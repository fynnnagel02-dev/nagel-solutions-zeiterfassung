create extension if not exists btree_gist;

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "company_settings_select_authenticated" on public.company_settings;

create policy "profiles_admin_update"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create or replace function public.can_access_employee(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_profile_is_active()
    and (
      public.is_admin()
      or (
        public.current_employee_is_active()
        and (
          target_employee_id = public.current_employee_id()
          or exists (
            select 1
            from public.employees target_employee
            join public.teams t on t.id = target_employee.team_id
            where target_employee.id = target_employee_id
              and target_employee.is_active = true
              and t.team_lead_employee_id = public.current_employee_id()
              and t.is_active = true
          )
        )
      )
    );
$$;

create unique index if not exists time_entry_breaks_one_open_break_idx
on public.time_entry_breaks (time_entry_id)
where ended_at is null;

create or replace function public.validate_team_lead_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  lead_profile_role public.app_role;
  lead_team_id uuid;
  lead_is_active boolean;
begin
  if new.team_lead_employee_id is null then
    return new;
  end if;

  select e.team_id, e.is_active, p.role
  into lead_team_id, lead_is_active, lead_profile_role
  from public.employees e
  join public.profiles p on p.id = e.profile_id
  where e.id = new.team_lead_employee_id;

  if lead_team_id is null then
    raise exception 'Team lead employee must belong to a team';
  end if;

  if lead_team_id <> new.id then
    raise exception 'Team lead employee must belong to the same team they lead';
  end if;

  if lead_is_active is distinct from true then
    raise exception 'Inactive employees cannot be assigned as team leads';
  end if;

  if lead_profile_role not in ('team_lead', 'admin') then
    raise exception 'Assigned team lead must have team_lead or admin role';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_team_lead_assignment_trigger on public.teams;
create trigger validate_team_lead_assignment_trigger
before insert or update on public.teams
for each row execute function public.validate_team_lead_assignment();

create or replace function public.get_target_minutes_for_employee_on_date(
  target_employee_id uuid,
  target_date date
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  employee_record public.employees;
  company_record public.company_settings;
  weekday_number integer;
  schedule_day_record public.work_schedule_days;
begin
  select *
  into employee_record
  from public.employees
  where id = target_employee_id;

  if employee_record.id is null then
    raise exception 'Employee not found';
  end if;

  select *
  into company_record
  from public.company_settings
  where id = 1;

  if exists (
    select 1
    from public.holidays h
    where h.holiday_date = target_date
      and h.region_code = company_record.holiday_region_code
  ) then
    return 0;
  end if;

  if employee_record.target_daily_minutes_override is not null then
    return employee_record.target_daily_minutes_override;
  end if;

  if employee_record.work_schedule_id is null then
    return company_record.default_daily_target_minutes;
  end if;

  weekday_number := extract(isodow from target_date)::integer;

  select *
  into schedule_day_record
  from public.work_schedule_days
  where work_schedule_id = employee_record.work_schedule_id
    and weekday = weekday_number;

  if schedule_day_record.id is null or schedule_day_record.is_workday = false then
    return 0;
  end if;

  return schedule_day_record.target_minutes;
end;
$$;

create or replace function public.compute_vacation_consumption_days(
  target_employee_id uuid,
  target_start_date date,
  target_end_date date,
  target_start_day_part public.day_part,
  target_end_day_part public.day_part
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cursor_date date;
  total numeric := 0;
begin
  cursor_date := target_start_date;

  while cursor_date <= target_end_date loop
    if public.get_target_minutes_for_employee_on_date(target_employee_id, cursor_date) > 0 then
      if cursor_date = target_start_date and cursor_date = target_end_date then
        if target_start_day_part = 'full' and target_end_day_part = 'full' then
          total := total + 1;
        else
          total := total + 0.5;
        end if;
      elsif cursor_date = target_start_date and target_start_day_part <> 'full' then
        total := total + 0.5;
      elsif cursor_date = target_end_date and target_end_day_part <> 'full' then
        total := total + 0.5;
      else
        total := total + 1;
      end if;
    end if;

    cursor_date := cursor_date + interval '1 day';
  end loop;

  return total;
end;
$$;

create or replace function public.recompute_leave_balance_year(
  target_employee_id uuid,
  target_year integer
)
returns public.leave_balance_years
language plpgsql
security definer
set search_path = public
as $$
declare
  company_default numeric(5,2);
  employee_override numeric(5,2);
  company_carry_over boolean;
  employee_carry_over boolean;
  entitlement numeric(5,2);
  carry_over numeric(5,2) := 0;
  adjustments numeric(5,2) := 0;
  approved_taken numeric(5,2) := 0;
  pending_requested numeric(5,2) := 0;
  available numeric(5,2);
  leave_row public.leave_requests;
  overlap_start date;
  overlap_end date;
  result_row public.leave_balance_years;
begin
  select default_annual_leave_days, carry_over_enabled
  into company_default, company_carry_over
  from public.company_settings
  where id = 1;

  select els.annual_entitlement_days, els.allow_carry_over
  into employee_override, employee_carry_over
  from public.employee_leave_settings els
  where els.employee_id = target_employee_id;

  entitlement := coalesce(employee_override, company_default, 0);

  if coalesce(employee_carry_over, company_carry_over, false) and target_year > 2000 then
    select greatest(coalesce(lby.available_days, 0), 0)
    into carry_over
    from public.leave_balance_years lby
    where lby.employee_id = target_employee_id
      and lby.balance_year = target_year - 1;
  end if;

  select coalesce(sum(lba.adjustment_days), 0)
  into adjustments
  from public.leave_balance_adjustments lba
  where lba.employee_id = target_employee_id
    and lba.balance_year = target_year;

  for leave_row in
    select *
    from public.leave_requests lr
    where lr.employee_id = target_employee_id
      and lr.leave_type = 'vacation'
      and lr.status in ('pending', 'approved')
      and lr.start_date <= make_date(target_year, 12, 31)
      and lr.end_date >= make_date(target_year, 1, 1)
  loop
    overlap_start := greatest(leave_row.start_date, make_date(target_year, 1, 1));
    overlap_end := least(leave_row.end_date, make_date(target_year, 12, 31));

    if leave_row.status = 'approved' then
      approved_taken := approved_taken + public.compute_vacation_consumption_days(
        target_employee_id,
        overlap_start,
        overlap_end,
        case when overlap_start = leave_row.start_date then leave_row.start_day_part else 'full' end,
        case when overlap_end = leave_row.end_date then leave_row.end_day_part else 'full' end
      );
    else
      pending_requested := pending_requested + public.compute_vacation_consumption_days(
        target_employee_id,
        overlap_start,
        overlap_end,
        case when overlap_start = leave_row.start_date then leave_row.start_day_part else 'full' end,
        case when overlap_end = leave_row.end_date then leave_row.end_day_part else 'full' end
      );
    end if;
  end loop;

  available := entitlement + carry_over + adjustments - approved_taken;

  insert into public.leave_balance_years (
    employee_id,
    balance_year,
    entitlement_days,
    carried_over_days,
    adjustment_days,
    approved_taken_days,
    pending_requested_days,
    available_days,
    last_recomputed_at
  )
  values (
    target_employee_id,
    target_year,
    entitlement,
    carry_over,
    adjustments,
    approved_taken,
    pending_requested,
    available,
    now()
  )
  on conflict (employee_id, balance_year)
  do update set
    entitlement_days = excluded.entitlement_days,
    carried_over_days = excluded.carried_over_days,
    adjustment_days = excluded.adjustment_days,
    approved_taken_days = excluded.approved_taken_days,
    pending_requested_days = excluded.pending_requested_days,
    available_days = excluded.available_days,
    last_recomputed_at = now(),
    updated_at = now()
  returning * into result_row;

  return result_row;
end;
$$;

create or replace function public.start_workday(
  target_employee_id uuid,
  target_entry_date date,
  target_started_at timestamptz
)
returns public.time_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.time_entries;
begin
  insert into public.time_entries (
    employee_id,
    entry_date,
    started_at,
    source,
    status,
    approval_status
  )
  values (
    target_employee_id,
    target_entry_date,
    target_started_at,
    'live',
    'open',
    'not_submitted'
  )
  returning * into result_row;

  return result_row;
exception
  when unique_violation then
    raise exception 'A workday entry already exists for this date';
end;
$$;

create or replace function public.start_break(
  target_time_entry_id uuid,
  target_started_at timestamptz
)
returns public.time_entry_breaks
language plpgsql
security definer
set search_path = public
as $$
declare
  entry_row public.time_entries;
  result_row public.time_entry_breaks;
begin
  select *
  into entry_row
  from public.time_entries
  where id = target_time_entry_id
  for update;

  if entry_row.id is null then
    raise exception 'Time entry not found';
  end if;

  if entry_row.started_at is null or entry_row.ended_at is not null then
    raise exception 'Breaks can only be started on an open workday';
  end if;

  insert into public.time_entry_breaks (
    time_entry_id,
    started_at,
    source
  )
  values (
    target_time_entry_id,
    target_started_at,
    'live'
  )
  returning * into result_row;

  return result_row;
exception
  when unique_violation then
    raise exception 'An open break already exists';
end;
$$;

create or replace function public.end_break(
  target_time_entry_id uuid,
  target_ended_at timestamptz
)
returns public.time_entry_breaks
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.time_entry_breaks;
begin
  update public.time_entry_breaks
  set ended_at = target_ended_at,
      updated_at = now()
  where id = (
    select teb.id
    from public.time_entry_breaks teb
    where teb.time_entry_id = target_time_entry_id
      and teb.ended_at is null
    order by teb.started_at desc
    limit 1
    for update
  )
  returning * into result_row;

  if result_row.id is null then
    raise exception 'No open break exists';
  end if;

  return result_row;
end;
$$;

create or replace function public.end_workday(
  target_time_entry_id uuid,
  target_ended_at timestamptz
)
returns public.time_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  entry_row public.time_entries;
  result_row public.time_entries;
begin
  select *
  into entry_row
  from public.time_entries
  where id = target_time_entry_id
  for update;

  if entry_row.id is null then
    raise exception 'Time entry not found';
  end if;

  if exists (
    select 1
    from public.time_entry_breaks teb
    where teb.time_entry_id = target_time_entry_id
      and teb.ended_at is null
  ) then
    raise exception 'Cannot end workday while a break is open';
  end if;

  if entry_row.ended_at is not null then
    raise exception 'Workday already ended';
  end if;

  update public.time_entries
  set ended_at = target_ended_at,
      status = 'complete',
      updated_at = now()
  where id = target_time_entry_id
  returning * into result_row;

  return result_row;
end;
$$;

create or replace function public.approve_time_entry(
  target_time_entry_id uuid,
  actor_employee_id uuid,
  actor_decision_reason text
)
returns public.time_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.time_entries;
  decision_time timestamptz := now();
begin
  update public.time_entries
  set status = 'approved',
      approval_status = 'approved',
      approved_at = decision_time,
      approved_by_employee_id = actor_employee_id,
      locked_at = decision_time,
      updated_at = now()
  where id = target_time_entry_id
    and approval_status = 'pending'
  returning * into result_row;

  if result_row.id is null then
    raise exception 'Time entry is not pending approval';
  end if;

  insert into public.time_entry_approvals (
    time_entry_id,
    decision,
    decided_by_employee_id,
    reason
  )
  values (
    target_time_entry_id,
    'approved',
    actor_employee_id,
    actor_decision_reason
  );

  return result_row;
end;
$$;

create or replace function public.reject_time_entry(
  target_time_entry_id uuid,
  actor_employee_id uuid,
  actor_decision_reason text
)
returns public.time_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.time_entries;
begin
  update public.time_entries
  set status = 'rejected',
      approval_status = 'rejected',
      rejected_at = now(),
      rejected_by_employee_id = actor_employee_id,
      updated_at = now()
  where id = target_time_entry_id
    and approval_status = 'pending'
  returning * into result_row;

  if result_row.id is null then
    raise exception 'Time entry is not pending approval';
  end if;

  insert into public.time_entry_approvals (
    time_entry_id,
    decision,
    decided_by_employee_id,
    reason
  )
  values (
    target_time_entry_id,
    'rejected',
    actor_employee_id,
    actor_decision_reason
  );

  return result_row;
end;
$$;

create or replace function public.approve_leave_request(
  target_leave_request_id uuid,
  actor_employee_id uuid,
  actor_decision_reason text
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.leave_requests;
  start_request_year integer;
  end_request_year integer;
begin
  update public.leave_requests
  set status = 'approved',
      decided_at = now(),
      decided_by_employee_id = actor_employee_id,
      updated_at = now()
  where id = target_leave_request_id
    and status = 'pending'
  returning * into request_row;

  if request_row.id is null then
    raise exception 'Leave request is not pending approval';
  end if;

  insert into public.leave_approvals (
    leave_request_id,
    decision,
    decided_by_employee_id,
    reason
  )
  values (
    target_leave_request_id,
    'approved',
    actor_employee_id,
    actor_decision_reason
  );

  start_request_year := extract(year from request_row.start_date)::integer;
  end_request_year := extract(year from request_row.end_date)::integer;
  perform public.recompute_leave_balance_year(request_row.employee_id, start_request_year);

  if end_request_year <> start_request_year then
    perform public.recompute_leave_balance_year(request_row.employee_id, end_request_year);
  end if;

  return request_row;
end;
$$;

create or replace function public.reject_leave_request(
  target_leave_request_id uuid,
  actor_employee_id uuid,
  actor_decision_reason text
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.leave_requests;
begin
  update public.leave_requests
  set status = 'rejected',
      decided_at = now(),
      decided_by_employee_id = actor_employee_id,
      updated_at = now()
  where id = target_leave_request_id
    and status = 'pending'
  returning * into request_row;

  if request_row.id is null then
    raise exception 'Leave request is not pending approval';
  end if;

  insert into public.leave_approvals (
    leave_request_id,
    decision,
    decided_by_employee_id,
    reason
  )
  values (
    target_leave_request_id,
    'rejected',
    actor_employee_id,
    actor_decision_reason
  );

  return request_row;
end;
$$;

create or replace function public.approve_time_entry_change_request(
  target_change_request_id uuid,
  actor_employee_id uuid,
  actor_decision_reason text
)
returns public.time_entry_change_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.time_entry_change_requests;
  entry_row public.time_entries;
  original_entry jsonb;
  synthetic_break_start timestamptz;
  result_row public.time_entry_change_requests;
begin
  select *
  into request_row
  from public.time_entry_change_requests
  where id = target_change_request_id
    and status = 'pending'
  for update;

  if request_row.id is null then
    raise exception 'Change request is not pending';
  end if;

  select *
  into entry_row
  from public.time_entries
  where id = request_row.time_entry_id
  for update;

  original_entry := to_jsonb(entry_row);

  update public.time_entries
  set started_at = coalesce(request_row.proposed_started_at, entry_row.started_at),
      ended_at = coalesce(request_row.proposed_ended_at, entry_row.ended_at),
      project_id = coalesce(request_row.proposed_project_id, entry_row.project_id),
      comment = coalesce(request_row.proposed_comment, entry_row.comment),
      status = 'corrected',
      approval_status = 'approved',
      updated_at = now()
  where id = entry_row.id
  returning * into entry_row;

  if request_row.proposed_started_at is not null and request_row.proposed_ended_at is not null then
    delete from public.time_entry_breaks
    where time_entry_id = entry_row.id;

    if coalesce(request_row.proposed_break_minutes, 0) > 0 then
      synthetic_break_start :=
        request_row.proposed_ended_at - make_interval(mins => request_row.proposed_break_minutes);

      if synthetic_break_start < request_row.proposed_started_at then
        raise exception 'Break duration exceeds the work interval';
      end if;

      insert into public.time_entry_breaks (
        time_entry_id,
        started_at,
        ended_at,
        source
      )
      values (
        entry_row.id,
        synthetic_break_start,
        request_row.proposed_ended_at,
        'manual'
      );
    end if;
  end if;

  update public.time_entry_change_requests
  set status = 'approved',
      decided_by_employee_id = actor_employee_id,
      decided_at = now(),
      decision_reason = actor_decision_reason,
      updated_at = now()
  where id = target_change_request_id
  returning * into result_row;

  insert into public.time_entry_audit_logs (
    time_entry_id,
    actor_employee_id,
    event_type,
    old_values,
    new_values
  )
  values (
    entry_row.id,
    actor_employee_id,
    'time_entry.correction_approved',
    original_entry,
    to_jsonb(entry_row)
  );

  return result_row;
end;
$$;

create or replace function public.reject_time_entry_change_request(
  target_change_request_id uuid,
  actor_employee_id uuid,
  actor_decision_reason text
)
returns public.time_entry_change_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  result_row public.time_entry_change_requests;
begin
  update public.time_entry_change_requests
  set status = 'rejected',
      decided_by_employee_id = actor_employee_id,
      decided_at = now(),
      decision_reason = actor_decision_reason,
      updated_at = now()
  where id = target_change_request_id
    and status = 'pending'
  returning * into result_row;

  if result_row.id is null then
    raise exception 'Change request is not pending';
  end if;

  return result_row;
end;
$$;
