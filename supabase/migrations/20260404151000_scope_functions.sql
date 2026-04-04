create or replace function public.current_auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.is_active
    from public.profiles p
    where p.id = auth.uid()
  ), false);
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.employees e
  where e.profile_id = auth.uid();
$$;

create or replace function public.current_employee_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select e.is_active
    from public.employees e
    where e.profile_id = auth.uid()
  ), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_is_active()
    and coalesce(public.current_profile_role() = 'admin', false);
$$;

create or replace function public.is_team_lead()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_is_active()
    and public.current_employee_is_active()
    and exists (
      select 1
      from public.teams t
      where t.team_lead_employee_id = public.current_employee_id()
        and t.is_active = true
    );
$$;

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
      or target_employee_id = public.current_employee_id()
      or exists (
        select 1
        from public.employees target_employee
        join public.teams t on t.id = target_employee.team_id
        where target_employee.id = target_employee_id
          and target_employee.is_active = true
          and t.team_lead_employee_id = public.current_employee_id()
          and t.is_active = true
      )
    );
$$;

create or replace function public.can_access_time_entry(target_time_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.time_entries te
    where te.id = target_time_entry_id
      and public.can_access_employee(te.employee_id)
  );
$$;

create or replace function public.can_access_leave_request(target_leave_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leave_requests lr
    where lr.id = target_leave_request_id
      and public.can_access_employee(lr.employee_id)
  );
$$;
