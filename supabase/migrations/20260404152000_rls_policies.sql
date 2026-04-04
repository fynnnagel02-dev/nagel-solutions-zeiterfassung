alter table public.company_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.work_schedules enable row level security;
alter table public.work_schedule_days enable row level security;
alter table public.teams enable row level security;
alter table public.employees enable row level security;
alter table public.projects enable row level security;
alter table public.holidays enable row level security;
alter table public.employee_leave_settings enable row level security;
alter table public.time_entries enable row level security;
alter table public.time_entry_breaks enable row level security;
alter table public.time_entry_approvals enable row level security;
alter table public.time_entry_change_requests enable row level security;
alter table public.time_entry_audit_logs enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_approvals enable row level security;
alter table public.leave_balance_adjustments enable row level security;
alter table public.leave_balance_years enable row level security;
alter table public.export_logs enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "company_settings_select_authenticated"
on public.company_settings for select
using (public.current_profile_is_active());

create policy "company_settings_admin_mutation"
on public.company_settings for all
using (public.is_admin())
with check (public.is_admin());

create policy "teams_select_authenticated"
on public.teams for select
using (public.current_profile_is_active());

create policy "teams_admin_mutation"
on public.teams for all
using (public.is_admin())
with check (public.is_admin());

create policy "employees_select_scoped"
on public.employees for select
using (public.can_access_employee(id));

create policy "employees_admin_mutation"
on public.employees for all
using (public.is_admin())
with check (public.is_admin());

create policy "work_schedules_select_authenticated"
on public.work_schedules for select
using (public.current_profile_is_active());

create policy "work_schedules_admin_mutation"
on public.work_schedules for all
using (public.is_admin())
with check (public.is_admin());

create policy "work_schedule_days_select_authenticated"
on public.work_schedule_days for select
using (public.current_profile_is_active());

create policy "work_schedule_days_admin_mutation"
on public.work_schedule_days for all
using (public.is_admin())
with check (public.is_admin());

create policy "projects_select_authenticated"
on public.projects for select
using (public.current_profile_is_active());

create policy "projects_admin_mutation"
on public.projects for all
using (public.is_admin())
with check (public.is_admin());

create policy "holidays_select_authenticated"
on public.holidays for select
using (public.current_profile_is_active());

create policy "holidays_admin_mutation"
on public.holidays for all
using (public.is_admin())
with check (public.is_admin());

create policy "employee_leave_settings_select_scoped"
on public.employee_leave_settings for select
using (
  exists (
    select 1
    from public.employees e
    where e.id = employee_id
      and public.can_access_employee(e.id)
  )
);

create policy "employee_leave_settings_admin_mutation"
on public.employee_leave_settings for all
using (public.is_admin())
with check (public.is_admin());

create policy "time_entries_select_scoped"
on public.time_entries for select
using (public.can_access_employee(employee_id));

create policy "time_entry_breaks_select_scoped"
on public.time_entry_breaks for select
using (public.can_access_time_entry(time_entry_id));

create policy "time_entry_approvals_select_scoped"
on public.time_entry_approvals for select
using (public.can_access_time_entry(time_entry_id));

create policy "time_entry_change_requests_select_scoped"
on public.time_entry_change_requests for select
using (public.can_access_time_entry(time_entry_id));

create policy "time_entry_audit_logs_admin_select"
on public.time_entry_audit_logs for select
using (public.is_admin());

create policy "leave_requests_select_scoped"
on public.leave_requests for select
using (public.can_access_employee(employee_id));

create policy "leave_approvals_select_scoped"
on public.leave_approvals for select
using (public.can_access_leave_request(leave_request_id));

create policy "leave_balance_adjustments_select_scoped"
on public.leave_balance_adjustments for select
using (public.can_access_employee(employee_id));

create policy "leave_balance_years_select_scoped"
on public.leave_balance_years for select
using (public.can_access_employee(employee_id));

create policy "export_logs_select_scoped"
on public.export_logs for select
using (
  public.is_admin()
  or requested_by_employee_id = public.current_employee_id()
);
