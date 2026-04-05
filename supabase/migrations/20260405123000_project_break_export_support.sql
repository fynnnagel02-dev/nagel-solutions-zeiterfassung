do $$
begin
  alter type public.break_source add value 'auto_legal';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.export_type add value 'project_time_report';
exception
  when duplicate_object then null;
end $$;

insert into public.projects (id, name, code, is_active)
values (
  '50000000-0000-0000-0000-000000000004',
  'Intern / Allgemein',
  'INT-ALLG',
  true
)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  is_active = excluded.is_active;

create or replace function public.start_workday(
  target_employee_id uuid,
  target_entry_date date,
  target_started_at timestamptz,
  target_project_id uuid default null
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
    approval_status,
    project_id
  )
  values (
    target_employee_id,
    target_entry_date,
    target_started_at,
    'live',
    'open',
    'not_submitted',
    target_project_id
  )
  returning * into result_row;

  return result_row;
exception
  when unique_violation then
    raise exception 'A workday entry already exists for this date';
end;
$$;
