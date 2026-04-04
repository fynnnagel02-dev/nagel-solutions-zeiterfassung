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
    select greatest(
      coalesce(lby.available_days, 0),
      0
    )
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

  select coalesce(sum(
    case
      when lr.start_day_part = 'full' and lr.end_day_part = 'full' and lr.start_date = lr.end_date then 1.0
      when lr.start_date = lr.end_date then 0.5
      else 1.0
    end
  ), 0)
  into approved_taken
  from public.leave_requests lr
  where lr.employee_id = target_employee_id
    and lr.leave_type = 'vacation'
    and lr.status = 'approved'
    and extract(year from lr.start_date)::integer = target_year;

  select coalesce(sum(
    case
      when lr.start_day_part = 'full' and lr.end_day_part = 'full' and lr.start_date = lr.end_date then 1.0
      when lr.start_date = lr.end_date then 0.5
      else 1.0
    end
  ), 0)
  into pending_requested
  from public.leave_requests lr
  where lr.employee_id = target_employee_id
    and lr.leave_type = 'vacation'
    and lr.status = 'pending'
    and extract(year from lr.start_date)::integer = target_year;

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
