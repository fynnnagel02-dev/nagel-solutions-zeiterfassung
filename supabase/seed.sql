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

update public.company_settings
set
  company_name = 'Nagel Solutions Einsatzservice',
  timezone = 'Europe/Berlin',
  holiday_region_code = 'DE-NI',
  default_daily_target_minutes = 480,
  default_weekly_target_minutes = 2400,
  default_annual_leave_days = 30,
  carry_over_enabled = true
where id = 1;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'demo.admin@nagel-solutions.local',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Petra Nagel"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'demo.teamlead@nagel-solutions.local',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Markus Weber"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'demo.employee@nagel-solutions.local',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Lena Hoffmann"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'demo.field1@nagel-solutions.local',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Jonas Becker"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'demo.field2@nagel-solutions.local',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Aylin Kaya"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'demo.service@nagel-solutions.local',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Tobias Roth"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into public.profiles (id, role, is_active)
values
  ('10000000-0000-0000-0000-000000000001', 'admin', true),
  ('10000000-0000-0000-0000-000000000002', 'team_lead', true),
  ('10000000-0000-0000-0000-000000000003', 'employee', true),
  ('10000000-0000-0000-0000-000000000004', 'employee', true),
  ('10000000-0000-0000-0000-000000000005', 'employee', true),
  ('10000000-0000-0000-0000-000000000006', 'employee', true)
on conflict (id) do update set
  role = excluded.role,
  is_active = excluded.is_active;

insert into public.work_schedules (id, name, weekly_target_minutes, is_active)
values
  ('40000000-0000-0000-0000-000000000001', 'Buero und Steuerung 40h', 2400, true),
  ('40000000-0000-0000-0000-000000000002', 'Service und Baustelle 37,5h', 2250, true)
on conflict (id) do nothing;

insert into public.work_schedule_days (work_schedule_id, weekday, is_workday, target_minutes)
values
  ('40000000-0000-0000-0000-000000000001', 1, true, 480),
  ('40000000-0000-0000-0000-000000000001', 2, true, 480),
  ('40000000-0000-0000-0000-000000000001', 3, true, 480),
  ('40000000-0000-0000-0000-000000000001', 4, true, 480),
  ('40000000-0000-0000-0000-000000000001', 5, true, 480),
  ('40000000-0000-0000-0000-000000000001', 6, false, 0),
  ('40000000-0000-0000-0000-000000000001', 7, false, 0),
  ('40000000-0000-0000-0000-000000000002', 1, true, 450),
  ('40000000-0000-0000-0000-000000000002', 2, true, 450),
  ('40000000-0000-0000-0000-000000000002', 3, true, 450),
  ('40000000-0000-0000-0000-000000000002', 4, true, 450),
  ('40000000-0000-0000-0000-000000000002', 5, true, 450),
  ('40000000-0000-0000-0000-000000000002', 6, false, 0),
  ('40000000-0000-0000-0000-000000000002', 7, false, 0)
on conflict (work_schedule_id, weekday) do nothing;

insert into public.teams (id, name, is_active)
values
  ('30000000-0000-0000-0000-000000000001', 'Operative Nord', true),
  ('30000000-0000-0000-0000-000000000002', 'Service Innendienst', true)
on conflict (id) do update set
  name = excluded.name,
  is_active = excluded.is_active;

insert into public.employees (
  id,
  profile_id,
  employee_number,
  first_name,
  last_name,
  team_id,
  work_schedule_id,
  employment_start_date,
  target_daily_minutes_override,
  target_weekly_minutes_override,
  is_active
)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NS-ADM-001', 'Petra', 'Nagel', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', current_date - interval '900 day', null, null, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'NS-TL-014', 'Markus', 'Weber', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', current_date - interval '620 day', null, null, true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'NS-MA-103', 'Lena', 'Hoffmann', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', current_date - interval '420 day', null, null, true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'NS-MA-119', 'Jonas', 'Becker', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', current_date - interval '300 day', null, null, true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'NS-MA-127', 'Aylin', 'Kaya', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', current_date - interval '180 day', null, null, true),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'NS-IO-008', 'Tobias', 'Roth', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', current_date - interval '510 day', null, null, true)
on conflict (id) do update set
  team_id = excluded.team_id,
  work_schedule_id = excluded.work_schedule_id,
  is_active = excluded.is_active;

update public.teams
set team_lead_employee_id = '20000000-0000-0000-0000-000000000002'
where id = '30000000-0000-0000-0000-000000000001';

insert into public.employee_leave_settings (employee_id, annual_entitlement_days, allow_carry_over)
values
  ('20000000-0000-0000-0000-000000000001', 30, true),
  ('20000000-0000-0000-0000-000000000002', 30, true),
  ('20000000-0000-0000-0000-000000000003', 28, true),
  ('20000000-0000-0000-0000-000000000004', 27, true),
  ('20000000-0000-0000-0000-000000000005', 28, true),
  ('20000000-0000-0000-0000-000000000006', 29, true)
on conflict (employee_id) do update set
  annual_entitlement_days = excluded.annual_entitlement_days,
  allow_carry_over = excluded.allow_carry_over;

insert into public.projects (id, name, code, description, is_active)
values
  ('50000000-0000-0000-0000-000000000001', 'Rollout Solarpark Nord', 'PR-2026-018', 'Team fuer Montage und Inbetriebnahme im Feld.', true),
  ('50000000-0000-0000-0000-000000000002', 'Wartung Serviceflotte', 'SRV-2026-004', 'Laufende Serviceeinsaetze mit kurzen Reaktionszeiten.', true),
  ('50000000-0000-0000-0000-000000000003', 'Steuerung Kundencenter', 'OPS-2026-002', 'Disposition, Freigaben und Rueckfragen fuer den Tagesbetrieb.', true),
  ('50000000-0000-0000-0000-000000000004', 'Intern / Allgemein', 'INT-ALLG', 'Interne Abstimmung, Schulung und allgemeine Arbeitszeit ohne Kundenprojekt.', true)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.holidays (id, holiday_date, region_code, name, is_company_observed)
values
  ('60000000-0000-0000-0000-000000000001', (date_trunc('year', current_date) + interval '120 day')::date, 'DE-NI', 'Tag der Arbeit', true),
  ('60000000-0000-0000-0000-000000000002', (date_trunc('year', current_date) + interval '359 day')::date, 'DE-NI', 'Weihnachtstag', true),
  ('60000000-0000-0000-0000-000000000003', (date_trunc('year', current_date) + interval '150 day')::date, 'DE-HH', 'Fronleichnam Servicepartner', false)
on conflict (id) do update set
  holiday_date = excluded.holiday_date,
  region_code = excluded.region_code,
  name = excluded.name,
  is_company_observed = excluded.is_company_observed;

insert into public.time_entries (
  id,
  employee_id,
  entry_date,
  started_at,
  ended_at,
  status,
  approval_status,
  source,
  project_id,
  comment,
  submitted_at,
  locked_at,
  approved_at,
  approved_by_employee_id,
  rejected_at,
  rejected_by_employee_id
)
values
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', current_date - interval '5 day', (current_date - interval '5 day' + time '07:08')::timestamptz, (current_date - interval '5 day' + time '16:18')::timestamptz, 'approved', 'approved', 'manual', '50000000-0000-0000-0000-000000000001', 'Inbetriebnahme Abschnitt Nord 2', (current_date - interval '4 day' + time '08:00')::timestamptz, (current_date - interval '4 day' + time '08:10')::timestamptz, (current_date - interval '4 day' + time '10:30')::timestamptz, '20000000-0000-0000-0000-000000000002', null, null),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', current_date - interval '4 day', (current_date - interval '4 day' + time '07:14')::timestamptz, (current_date - interval '4 day' + time '16:02')::timestamptz, 'in_review', 'pending', 'manual', '50000000-0000-0000-0000-000000000002', 'Serviceeinsatz Hannover Nord', (current_date - interval '3 day' + time '07:45')::timestamptz, null, null, null, null, null),
  ('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', current_date - interval '3 day', (current_date - interval '3 day' + time '06:58')::timestamptz, (current_date - interval '3 day' + time '15:46')::timestamptz, 'approved', 'approved', 'manual', '50000000-0000-0000-0000-000000000001', 'Nachlauf und Dokumentation', (current_date - interval '2 day' + time '08:15')::timestamptz, (current_date - interval '2 day' + time '08:20')::timestamptz, (current_date - interval '2 day' + time '09:30')::timestamptz, '20000000-0000-0000-0000-000000000002', null, null),
  ('70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', current_date - interval '2 day', (current_date - interval '2 day' + time '07:10')::timestamptz, (current_date - interval '2 day' + time '15:40')::timestamptz, 'complete', 'not_submitted', 'manual', '50000000-0000-0000-0000-000000000002', 'Fahrzeugpruefung und Abschlussbericht', null, null, null, null, null, null),
  ('70000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', current_date, (current_date + time '07:12')::timestamptz, null, 'open', 'not_submitted', 'live', '50000000-0000-0000-0000-000000000001', 'Baustelle Suedtor wird vorbereitet', null, null, null, null, null, null),
  ('70000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', current_date, (current_date + time '07:20')::timestamptz, null, 'open', 'not_submitted', 'live', '50000000-0000-0000-0000-000000000003', 'Morgenrunde und Disposition fuer Team Nord', null, null, null, null, null, null),
  ('70000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000006', current_date - interval '1 day', (current_date - interval '1 day' + time '08:05')::timestamptz, (current_date - interval '1 day' + time '16:11')::timestamptz, 'approved', 'approved', 'manual', '50000000-0000-0000-0000-000000000003', 'Innendienst und Nachverfolgung von Kundenanfragen', (current_date - interval '1 day' + time '16:30')::timestamptz, (current_date - interval '1 day' + time '16:40')::timestamptz, current_date::timestamptz, '20000000-0000-0000-0000-000000000001', null, null)
on conflict (id) do update set
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  status = excluded.status,
  approval_status = excluded.approval_status,
  project_id = excluded.project_id,
  comment = excluded.comment,
  submitted_at = excluded.submitted_at,
  locked_at = excluded.locked_at,
  approved_at = excluded.approved_at,
  approved_by_employee_id = excluded.approved_by_employee_id;

insert into public.time_entry_breaks (id, time_entry_id, started_at, ended_at, source)
values
  ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', (current_date - interval '5 day' + time '12:04')::timestamptz, (current_date - interval '5 day' + time '12:34')::timestamptz, 'manual'),
  ('71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', (current_date - interval '4 day' + time '12:00')::timestamptz, (current_date - interval '4 day' + time '12:28')::timestamptz, 'manual'),
  ('71000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000003', (current_date - interval '3 day' + time '11:56')::timestamptz, (current_date - interval '3 day' + time '12:26')::timestamptz, 'manual'),
  ('71000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000004', (current_date - interval '2 day' + time '12:10')::timestamptz, (current_date - interval '2 day' + time '12:35')::timestamptz, 'manual'),
  ('71000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000006', (current_date + time '11:55')::timestamptz, null, 'live'),
  ('71000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000007', (current_date - interval '1 day' + time '12:15')::timestamptz, (current_date - interval '1 day' + time '12:45')::timestamptz, 'manual')
on conflict (id) do update set
  started_at = excluded.started_at,
  ended_at = excluded.ended_at;

insert into public.time_entry_change_requests (
  id,
  time_entry_id,
  requested_by_employee_id,
  status,
  reason,
  proposed_started_at,
  proposed_ended_at,
  proposed_break_minutes,
  proposed_project_id,
  proposed_comment,
  decided_by_employee_id,
  decided_at,
  decision_reason
)
values
  ('72000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'pending', 'Fahrtzeit zum Materiallager fehlte im freigegebenen Eintrag.', (current_date - interval '5 day' + time '06:50')::timestamptz, (current_date - interval '5 day' + time '16:20')::timestamptz, 35, '50000000-0000-0000-0000-000000000001', 'Bitte Anfahrt ab morgens 06:50 beruecksichtigen.', null, null, null),
  ('72000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'approved', 'Servicebericht wurde nachtraeglich ergaenzt.', (current_date - interval '3 day' + time '06:58')::timestamptz, (current_date - interval '3 day' + time '15:46')::timestamptz, 30, '50000000-0000-0000-0000-000000000002', 'Zusatzkommentar im Abschlussbericht.', '20000000-0000-0000-0000-000000000002', (current_date - interval '2 day' + time '10:00')::timestamptz, 'Kommentar wurde nachvollziehbar ergaenzt.')
on conflict (id) do update set
  status = excluded.status,
  reason = excluded.reason,
  proposed_started_at = excluded.proposed_started_at,
  proposed_ended_at = excluded.proposed_ended_at,
  proposed_break_minutes = excluded.proposed_break_minutes,
  proposed_comment = excluded.proposed_comment,
  decided_by_employee_id = excluded.decided_by_employee_id,
  decided_at = excluded.decided_at,
  decision_reason = excluded.decision_reason;

create temporary table seed_calendar as
with business_days as (
  select day::date as workday
  from generate_series(current_date - interval '30 day', current_date + interval '30 day', interval '1 day') as day
  where extract(isodow from day) between 1 and 5
),
current_anchor as (
  select case
    when extract(isodow from current_date) between 1 and 5
      then current_date
    else (
      select min(workday)
      from business_days
      where workday > current_date
    )
  end as current_workday
),
past_days as (
  select
    workday,
    row_number() over (order by workday desc) as rn
  from business_days
  where workday < (select current_workday from current_anchor)
),
future_days as (
  select
    workday,
    row_number() over (order by workday asc) as rn
  from business_days
  where workday > (select current_workday from current_anchor)
)
select
  (select current_workday from current_anchor) as current_workday,
  max(case when past_days.rn = 1 then past_days.workday end) as prev_workday_1,
  max(case when past_days.rn = 2 then past_days.workday end) as prev_workday_2,
  max(case when past_days.rn = 3 then past_days.workday end) as prev_workday_3,
  max(case when past_days.rn = 4 then past_days.workday end) as prev_workday_4,
  max(case when past_days.rn = 5 then past_days.workday end) as prev_workday_5,
  max(case when past_days.rn = 6 then past_days.workday end) as prev_workday_6,
  max(case when future_days.rn = 1 then future_days.workday end) as next_workday_1,
  max(case when future_days.rn = 2 then future_days.workday end) as next_workday_2,
  max(case when future_days.rn = 3 then future_days.workday end) as next_workday_3,
  max(case when future_days.rn = 4 then future_days.workday end) as next_workday_4,
  max(case when future_days.rn = 5 then future_days.workday end) as next_workday_5
from past_days
cross join future_days;

insert into public.leave_requests (
  id,
  employee_id,
  leave_type,
  start_date,
  end_date,
  duration_mode,
  partial_start_time,
  partial_end_time,
  start_day_part,
  end_day_part,
  status,
  comment,
  requested_at,
  decided_at,
  decided_by_employee_id
)
values
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'vacation', (select next_workday_2 from seed_calendar), (select next_workday_2 from seed_calendar), 'full_day', null, null, 'full', 'full', 'approved', 'Kurzurlaub fuer Familienfeier.', ((select prev_workday_6 from seed_calendar) + time '10:00')::timestamptz, ((select prev_workday_5 from seed_calendar) + time '10:00')::timestamptz, '20000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'vacation', (select next_workday_4 from seed_calendar), (select next_workday_4 from seed_calendar), 'full_day', null, null, 'full', 'full', 'pending', 'Geplanter Urlaub nach Projektabschluss.', ((select prev_workday_1 from seed_calendar) + time '15:00')::timestamptz, null, null),
  ('80000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'sick', (select current_workday from seed_calendar), (select current_workday from seed_calendar), 'full_day', null, null, 'full', 'full', 'approved', 'Krankmeldung liegt vor.', ((select current_workday from seed_calendar) + time '06:30')::timestamptz, ((select current_workday from seed_calendar) + time '07:00')::timestamptz, '20000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'vacation', (select next_workday_1 from seed_calendar), (select next_workday_1 from seed_calendar), 'full_day', null, null, 'full', 'full', 'approved', 'Kurzfristig genehmigter Resturlaub.', ((select prev_workday_5 from seed_calendar) + time '09:00')::timestamptz, ((select prev_workday_4 from seed_calendar) + time '09:00')::timestamptz, '20000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'medical', (select prev_workday_5 from seed_calendar), (select prev_workday_5 from seed_calendar), 'partial_day', time '09:00', time '11:30', 'morning', 'morning', 'approved', 'Arzttermin am Vormittag.', ((select prev_workday_6 from seed_calendar) + time '11:00')::timestamptz, ((select prev_workday_5 from seed_calendar) + time '08:30')::timestamptz, '20000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'sick', (select current_workday from seed_calendar), (select current_workday from seed_calendar), 'partial_day', time '09:00', time '12:00', 'morning', 'morning', 'approved', 'Halbtägige Krankmeldung fuer den Vormittag.', ((select current_workday from seed_calendar) + time '06:00')::timestamptz, ((select current_workday from seed_calendar) + time '06:30')::timestamptz, '20000000-0000-0000-0000-000000000002')
on conflict (id) do update set
  leave_type = excluded.leave_type,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  duration_mode = excluded.duration_mode,
  partial_start_time = excluded.partial_start_time,
  partial_end_time = excluded.partial_end_time,
  start_day_part = excluded.start_day_part,
  end_day_part = excluded.end_day_part,
  status = excluded.status,
  comment = excluded.comment,
  requested_at = excluded.requested_at,
  decided_at = excluded.decided_at,
  decided_by_employee_id = excluded.decided_by_employee_id;

insert into public.export_logs (
  id,
  export_type,
  requested_by_employee_id,
  scope_description,
  filters,
  status,
  row_count,
  artifact_ref,
  completed_at
)
values
  (
    '90000000-0000-0000-0000-000000000001',
    'monthly_timesheet',
    '20000000-0000-0000-0000-000000000001',
    '{"title":"Monatsexport Zeiterfassung","filename":"2026-04-Export-Lena-Hoffmann.pdf"}'::jsonb,
    jsonb_build_object('dateFrom', (current_date - interval '30 day')::date, 'dateTo', current_date::date),
    'completed',
    22,
    '2026-04-Export-Lena-Hoffmann.pdf',
    now() - interval '2 day'
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    'absence_report',
    '20000000-0000-0000-0000-000000000001',
    '{"title":"Abwesenheitsreport April","filename":"2026-04-Abwesenheiten.pdf"}'::jsonb,
    jsonb_build_object('dateFrom', current_date::date, 'dateTo', (current_date + interval '31 day')::date),
    'completed',
    7,
    '2026-04-Abwesenheiten.pdf',
    now() - interval '1 day'
  )
on conflict (id) do update set
  scope_description = excluded.scope_description,
  filters = excluded.filters,
  status = excluded.status,
  row_count = excluded.row_count,
  artifact_ref = excluded.artifact_ref,
  completed_at = excluded.completed_at;

drop table if exists seed_calendar;
