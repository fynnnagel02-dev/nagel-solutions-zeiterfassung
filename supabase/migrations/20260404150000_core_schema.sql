create extension if not exists pgcrypto;

create type public.app_role as enum ('employee', 'team_lead', 'admin');
create type public.time_entry_status as enum (
  'open',
  'complete',
  'in_review',
  'approved',
  'rejected',
  'corrected'
);
create type public.approval_status as enum ('not_submitted', 'pending', 'approved', 'rejected');
create type public.time_entry_source as enum ('live', 'manual', 'correction');
create type public.break_source as enum ('live', 'manual');
create type public.change_request_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.leave_type as enum ('vacation', 'sick', 'other');
create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.approval_decision as enum ('approved', 'rejected');
create type public.day_part as enum ('full', 'morning', 'afternoon');
create type public.export_type as enum ('monthly_timesheet', 'absence_report', 'team_overview');
create type public.export_status as enum ('pending', 'completed', 'failed');

create table public.company_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null,
  timezone text not null default 'Europe/Berlin',
  holiday_region_code text not null default 'DE-NI',
  default_daily_target_minutes integer not null check (default_daily_target_minutes >= 0),
  default_weekly_target_minutes integer not null check (default_weekly_target_minutes >= 0),
  default_annual_leave_days numeric(5,2) not null default 30 check (default_annual_leave_days >= 0),
  carry_over_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  weekly_target_minutes integer not null check (weekly_target_minutes >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_schedule_days (
  id uuid primary key default gen_random_uuid(),
  work_schedule_id uuid not null references public.work_schedules (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  is_workday boolean not null default true,
  target_minutes integer not null default 0 check (target_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_schedule_id, weekday)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  team_lead_employee_id uuid unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete restrict,
  employee_number text unique,
  first_name text not null,
  last_name text not null,
  team_id uuid references public.teams (id) on delete set null,
  work_schedule_id uuid references public.work_schedules (id) on delete set null,
  employment_start_date date not null,
  employment_end_date date,
  target_daily_minutes_override integer check (target_daily_minutes_override is null or target_daily_minutes_override >= 0),
  target_weekly_minutes_override integer check (target_weekly_minutes_override is null or target_weekly_minutes_override >= 0),
  is_active boolean not null default true,
  deactivated_at timestamptz,
  deactivation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (employment_end_date is null or employment_end_date >= employment_start_date)
);

alter table public.teams
  add constraint teams_team_lead_employee_id_fkey
  foreign key (team_lead_employee_id) references public.employees (id) on delete set null;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name),
  unique (code)
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  region_code text not null,
  name text not null,
  is_company_observed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (holiday_date, region_code)
);

create table public.employee_leave_settings (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees (id) on delete cascade,
  annual_entitlement_days numeric(5,2) check (annual_entitlement_days is null or annual_entitlement_days >= 0),
  allow_carry_over boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  entry_date date not null,
  started_at timestamptz,
  ended_at timestamptz,
  status public.time_entry_status not null default 'open',
  approval_status public.approval_status not null default 'not_submitted',
  source public.time_entry_source not null default 'live',
  project_id uuid references public.projects (id) on delete set null,
  comment text,
  submitted_at timestamptz,
  locked_at timestamptz,
  approved_at timestamptz,
  approved_by_employee_id uuid references public.employees (id) on delete set null,
  rejected_at timestamptz,
  rejected_by_employee_id uuid references public.employees (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, entry_date),
  check (started_at is null or ended_at is null or ended_at > started_at)
);

create table public.time_entry_breaks (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  source public.break_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at)
);

create table public.time_entry_approvals (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  decision public.approval_decision not null,
  decided_by_employee_id uuid references public.employees (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.time_entry_change_requests (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  requested_by_employee_id uuid not null references public.employees (id) on delete restrict,
  status public.change_request_status not null default 'pending',
  reason text not null,
  proposed_started_at timestamptz,
  proposed_ended_at timestamptz,
  proposed_break_minutes integer check (proposed_break_minutes is null or proposed_break_minutes >= 0),
  proposed_project_id uuid references public.projects (id) on delete set null,
  proposed_comment text,
  decided_by_employee_id uuid references public.employees (id) on delete set null,
  decided_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entry_audit_logs (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  actor_employee_id uuid references public.employees (id) on delete set null,
  event_type text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  leave_type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  start_day_part public.day_part not null default 'full',
  end_day_part public.day_part not null default 'full',
  status public.leave_status not null default 'pending',
  comment text,
  requested_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by_employee_id uuid references public.employees (id) on delete set null,
  decided_at timestamptz,
  decided_by_employee_id uuid references public.employees (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.leave_approvals (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null references public.leave_requests (id) on delete cascade,
  decision public.approval_decision not null,
  decided_by_employee_id uuid references public.employees (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.leave_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  balance_year integer not null check (balance_year >= 2000),
  adjustment_days numeric(5,2) not null,
  reason text not null,
  source text not null default 'manual',
  created_by_employee_id uuid references public.employees (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.leave_balance_years (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  balance_year integer not null check (balance_year >= 2000),
  entitlement_days numeric(5,2) not null default 0,
  carried_over_days numeric(5,2) not null default 0,
  adjustment_days numeric(5,2) not null default 0,
  approved_taken_days numeric(5,2) not null default 0,
  pending_requested_days numeric(5,2) not null default 0,
  available_days numeric(5,2) not null default 0,
  last_recomputed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, balance_year)
);

create table public.export_logs (
  id uuid primary key default gen_random_uuid(),
  export_type public.export_type not null,
  requested_by_employee_id uuid references public.employees (id) on delete set null,
  scope_description jsonb not null default '{}'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  status public.export_status not null default 'pending',
  row_count integer,
  artifact_ref text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index employees_team_id_idx on public.employees (team_id);
create index employees_profile_id_idx on public.employees (profile_id);
create index holidays_region_date_idx on public.holidays (region_code, holiday_date);
create index time_entries_employee_date_idx on public.time_entries (employee_id, entry_date desc);
create index time_entry_breaks_time_entry_id_idx on public.time_entry_breaks (time_entry_id);
create index leave_requests_employee_dates_idx on public.leave_requests (employee_id, start_date, end_date);
create index leave_balance_adjustments_employee_year_idx on public.leave_balance_adjustments (employee_id, balance_year);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_company_settings
before update on public.company_settings
for each row execute function public.set_updated_at();

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_work_schedules
before update on public.work_schedules
for each row execute function public.set_updated_at();

create trigger set_updated_at_work_schedule_days
before update on public.work_schedule_days
for each row execute function public.set_updated_at();

create trigger set_updated_at_teams
before update on public.teams
for each row execute function public.set_updated_at();

create trigger set_updated_at_employees
before update on public.employees
for each row execute function public.set_updated_at();

create trigger set_updated_at_projects
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_updated_at_holidays
before update on public.holidays
for each row execute function public.set_updated_at();

create trigger set_updated_at_employee_leave_settings
before update on public.employee_leave_settings
for each row execute function public.set_updated_at();

create trigger set_updated_at_time_entries
before update on public.time_entries
for each row execute function public.set_updated_at();

create trigger set_updated_at_time_entry_breaks
before update on public.time_entry_breaks
for each row execute function public.set_updated_at();

create trigger set_updated_at_time_entry_change_requests
before update on public.time_entry_change_requests
for each row execute function public.set_updated_at();

create trigger set_updated_at_leave_requests
before update on public.leave_requests
for each row execute function public.set_updated_at();

create trigger set_updated_at_leave_balance_years
before update on public.leave_balance_years
for each row execute function public.set_updated_at();
