insert into public.company_settings (
  id,
  company_name,
  timezone,
  holiday_region_code,
  default_daily_target_minutes,
  default_weekly_target_minutes,
  default_annual_leave_days,
  carry_over_enabled
)
values (
  1,
  'Nagel Solutions Demo Company',
  'Europe/Berlin',
  'DE-NI',
  480,
  2400,
  30,
  false
)
on conflict (id) do nothing;

insert into public.work_schedules (
  id,
  name,
  weekly_target_minutes,
  is_active
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Standard 40h',
  2400,
  true
)
on conflict (id) do nothing;

insert into public.work_schedule_days (
  work_schedule_id,
  weekday,
  is_workday,
  target_minutes
)
values
  ('00000000-0000-0000-0000-000000000001', 1, true, 480),
  ('00000000-0000-0000-0000-000000000001', 2, true, 480),
  ('00000000-0000-0000-0000-000000000001', 3, true, 480),
  ('00000000-0000-0000-0000-000000000001', 4, true, 480),
  ('00000000-0000-0000-0000-000000000001', 5, true, 480),
  ('00000000-0000-0000-0000-000000000001', 6, false, 0),
  ('00000000-0000-0000-0000-000000000001', 7, false, 0)
on conflict (work_schedule_id, weekday) do nothing;
