-- MOCK DATA LOAD SCRIPT
-- Zweck:
--   - fuegt einen klar gekennzeichneten, anschaulichen Mock-Datensatz hinzu
--   - ist bewusst SEPARAT vom normalen seed.sql
--   - kann manuell im Supabase SQL Editor oder per CLI ausgefuehrt werden
--
-- WICHTIG:
--   - alle Namen, E-Mails, Projektnamen und Kommentare tragen klar den Zusatz "MOCK"
--   - der Datensatz ist idempotent ueber feste UUIDs aufgebaut
--   - diese Datei ersetzt nicht die normalen Migrationen

begin;

create temporary table mock_calendar on commit drop as
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
    '11000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'mock.admin@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"MOCK Hannah Leitner"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'mock.teamlead@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"MOCK Daniel Vorarbeiter"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'mock.mitarbeiter1@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"MOCK Lara Feldmann"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'mock.mitarbeiter2@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"display_name":"MOCK Cem Aslan"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'mock.mitarbeiter3@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"MOCK Jana Richter"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'mock.mitarbeiter4@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"MOCK Nils Petersen"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-0000-0000-000000000007',
    'authenticated',
    'authenticated',
    'mock.mitarbeiter5@nagel-solutions.local',
    crypt('mock-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"MOCK Sofia Brandt"}'::jsonb,
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
  ('11000000-0000-0000-0000-000000000001', 'admin', true),
  ('11000000-0000-0000-0000-000000000002', 'team_lead', true),
  ('11000000-0000-0000-0000-000000000003', 'employee', true),
  ('11000000-0000-0000-0000-000000000004', 'employee', true),
  ('11000000-0000-0000-0000-000000000005', 'employee', true),
  ('11000000-0000-0000-0000-000000000006', 'employee', true),
  ('11000000-0000-0000-0000-000000000007', 'employee', true)
on conflict (id) do update set
  role = excluded.role,
  is_active = excluded.is_active;

insert into public.work_schedules (id, name, weekly_target_minutes, is_active)
values
  ('41000000-0000-0000-0000-000000000001', 'MOCK Standard 40h', 2400, true),
  ('41000000-0000-0000-0000-000000000002', 'MOCK Service 37,5h', 2250, true)
on conflict (id) do update set
  name = excluded.name,
  weekly_target_minutes = excluded.weekly_target_minutes,
  is_active = excluded.is_active;

insert into public.work_schedule_days (work_schedule_id, weekday, is_workday, target_minutes)
values
  ('41000000-0000-0000-0000-000000000001', 1, true, 480),
  ('41000000-0000-0000-0000-000000000001', 2, true, 480),
  ('41000000-0000-0000-0000-000000000001', 3, true, 480),
  ('41000000-0000-0000-0000-000000000001', 4, true, 480),
  ('41000000-0000-0000-0000-000000000001', 5, true, 480),
  ('41000000-0000-0000-0000-000000000001', 6, false, 0),
  ('41000000-0000-0000-0000-000000000001', 7, false, 0),
  ('41000000-0000-0000-0000-000000000002', 1, true, 450),
  ('41000000-0000-0000-0000-000000000002', 2, true, 450),
  ('41000000-0000-0000-0000-000000000002', 3, true, 450),
  ('41000000-0000-0000-0000-000000000002', 4, true, 450),
  ('41000000-0000-0000-0000-000000000002', 5, true, 450),
  ('41000000-0000-0000-0000-000000000002', 6, false, 0),
  ('41000000-0000-0000-0000-000000000002', 7, false, 0)
on conflict (work_schedule_id, weekday) do update set
  is_workday = excluded.is_workday,
  target_minutes = excluded.target_minutes;

insert into public.teams (id, name, is_active)
values
  ('31000000-0000-0000-0000-000000000001', 'MOCK Montageteam West', true),
  ('31000000-0000-0000-0000-000000000002', 'MOCK Backoffice West', true)
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
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'MOCK-ADM-001', 'MOCK Hannah', 'Leitner', '31000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000001', current_date - interval '900 day', null, null, true),
  ('21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'MOCK-TL-001', 'MOCK Daniel', 'Vorarbeiter', '31000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', current_date - interval '600 day', null, null, true),
  ('21000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000003', 'MOCK-MA-001', 'MOCK Lara', 'Feldmann', '31000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000002', current_date - interval '450 day', null, null, true),
  ('21000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004', 'MOCK-MA-002', 'MOCK Cem', 'Aslan', '31000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000002', current_date - interval '320 day', null, null, true),
  ('21000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000005', 'MOCK-MA-003', 'MOCK Jana', 'Richter', '31000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', current_date - interval '250 day', null, null, true),
  ('21000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000006', 'MOCK-MA-004', 'MOCK Nils', 'Petersen', '31000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000002', current_date - interval '190 day', null, null, true),
  ('21000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000007', 'MOCK-MA-005', 'MOCK Sofia', 'Brandt', '31000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000001', current_date - interval '140 day', null, null, true)
on conflict (id) do update set
  profile_id = excluded.profile_id,
  employee_number = excluded.employee_number,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  team_id = excluded.team_id,
  work_schedule_id = excluded.work_schedule_id,
  is_active = excluded.is_active;

update public.teams
set team_lead_employee_id = '21000000-0000-0000-0000-000000000002'
where id = '31000000-0000-0000-0000-000000000001';

insert into public.employee_leave_settings (employee_id, annual_entitlement_days, allow_carry_over)
values
  ('21000000-0000-0000-0000-000000000001', 30, true),
  ('21000000-0000-0000-0000-000000000002', 30, true),
  ('21000000-0000-0000-0000-000000000003', 28, true),
  ('21000000-0000-0000-0000-000000000004', 27, true),
  ('21000000-0000-0000-0000-000000000005', 30, true),
  ('21000000-0000-0000-0000-000000000006', 26, true),
  ('21000000-0000-0000-0000-000000000007', 29, true)
on conflict (employee_id) do update set
  annual_entitlement_days = excluded.annual_entitlement_days,
  allow_carry_over = excluded.allow_carry_over;

insert into public.projects (id, name, code, description, is_active)
values
  ('51000000-0000-0000-0000-000000000001', 'MOCK Projekt Alpha Montage', 'MOCK-PRJ-001', 'MOCK Datensatz fuer Montagen und Inbetriebnahmen.', true),
  ('51000000-0000-0000-0000-000000000002', 'MOCK Projekt Beta Service', 'MOCK-PRJ-002', 'MOCK Datensatz fuer Wartung und Stoerungsdienst.', true),
  ('51000000-0000-0000-0000-000000000003', 'MOCK Projekt Gamma Backoffice', 'MOCK-PRJ-003', 'MOCK Datensatz fuer Disposition und Rueckfragen.', true),
  ('51000000-0000-0000-0000-000000000004', 'MOCK Projekt Delta Schulung', 'MOCK-PRJ-004', 'MOCK Datensatz fuer Schulung und interne Arbeit.', true),
  ('51000000-0000-0000-0000-000000000005', 'MOCK Projekt Epsilon Korrekturfall', 'MOCK-PRJ-005', 'MOCK Datensatz fuer Freigaben und Korrekturen.', true)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.leave_balance_years (
  employee_id,
  balance_year,
  entitlement_days,
  carried_over_days,
  adjustment_days,
  approved_taken_days,
  pending_requested_days
)
values
  ('21000000-0000-0000-0000-000000000003', extract(year from current_date)::int, 28, 0, 0, 6, 2),
  ('21000000-0000-0000-0000-000000000004', extract(year from current_date)::int, 27, 1, 0, 4, 3),
  ('21000000-0000-0000-0000-000000000005', extract(year from current_date)::int, 30, 0, 0, 8, 0),
  ('21000000-0000-0000-0000-000000000006', extract(year from current_date)::int, 26, 0, 1, 5, 0),
  ('21000000-0000-0000-0000-000000000007', extract(year from current_date)::int, 29, 2, 0, 7, 1)
on conflict (employee_id, balance_year) do update set
  entitlement_days = excluded.entitlement_days,
  carried_over_days = excluded.carried_over_days,
  adjustment_days = excluded.adjustment_days,
  approved_taken_days = excluded.approved_taken_days,
  pending_requested_days = excluded.pending_requested_days;

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
  approved_by_employee_id
)
values
  ('71000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', (select prev_workday_4 from mock_calendar), ((select prev_workday_4 from mock_calendar) + time '07:03')::timestamptz, ((select prev_workday_4 from mock_calendar) + time '16:04')::timestamptz, 'approved', 'approved', 'manual', '51000000-0000-0000-0000-000000000001', 'MOCK Montageeinsatz Alpha abgeschlossen.', ((select prev_workday_3 from mock_calendar) + time '08:00')::timestamptz, ((select prev_workday_3 from mock_calendar) + time '08:10')::timestamptz, ((select prev_workday_3 from mock_calendar) + time '09:00')::timestamptz, '21000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000003', (select prev_workday_3 from mock_calendar), ((select prev_workday_3 from mock_calendar) + time '07:11')::timestamptz, ((select prev_workday_3 from mock_calendar) + time '16:22')::timestamptz, 'in_review', 'pending', 'manual', '51000000-0000-0000-0000-000000000002', 'MOCK Serviceeinsatz Beta wartet auf Freigabe.', ((select prev_workday_2 from mock_calendar) + time '07:55')::timestamptz, null, null, null),
  ('71000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000004', (select prev_workday_2 from mock_calendar), ((select prev_workday_2 from mock_calendar) + time '08:01')::timestamptz, ((select prev_workday_2 from mock_calendar) + time '15:58')::timestamptz, 'complete', 'not_submitted', 'manual', '51000000-0000-0000-0000-000000000005', 'MOCK Eintrag mit offenem Korrekturpotenzial.', null, null, null, null),
  ('71000000-0000-0000-0000-000000000004', '21000000-0000-0000-0000-000000000005', (select current_workday from mock_calendar), ((select current_workday from mock_calendar) + time '07:18')::timestamptz, null, 'open', 'not_submitted', 'live', '51000000-0000-0000-0000-000000000001', 'MOCK Arbeitstag laeuft aktuell auf Alpha.', null, null, null, null),
  ('71000000-0000-0000-0000-000000000005', '21000000-0000-0000-0000-000000000006', (select prev_workday_1 from mock_calendar), ((select prev_workday_1 from mock_calendar) + time '08:14')::timestamptz, ((select prev_workday_1 from mock_calendar) + time '17:36')::timestamptz, 'approved', 'approved', 'manual', '51000000-0000-0000-0000-000000000004', 'MOCK Schulungstag mit langer Arbeitszeit.', ((select prev_workday_1 from mock_calendar) + time '18:00')::timestamptz, ((select prev_workday_1 from mock_calendar) + time '18:05')::timestamptz, ((select current_workday from mock_calendar) + time '08:00')::timestamptz, '21000000-0000-0000-0000-000000000001'),
  ('71000000-0000-0000-0000-000000000006', '21000000-0000-0000-0000-000000000007', (select prev_workday_5 from mock_calendar), ((select prev_workday_5 from mock_calendar) + time '08:25')::timestamptz, ((select prev_workday_5 from mock_calendar) + time '16:18')::timestamptz, 'approved', 'approved', 'manual', '51000000-0000-0000-0000-000000000003', 'MOCK Backoffice-Tag fuer Projekt Gamma.', ((select prev_workday_4 from mock_calendar) + time '09:00')::timestamptz, ((select prev_workday_4 from mock_calendar) + time '09:10')::timestamptz, ((select prev_workday_4 from mock_calendar) + time '10:00')::timestamptz, '21000000-0000-0000-0000-000000000001'),
  ('71000000-0000-0000-0000-000000000007', '21000000-0000-0000-0000-000000000002', (select current_workday from mock_calendar), ((select current_workday from mock_calendar) + time '07:05')::timestamptz, null, 'open', 'not_submitted', 'live', '51000000-0000-0000-0000-000000000003', 'MOCK Teamleiter steuert Tagesgeschaeft.', null, null, null, null)
on conflict (id) do update set
  entry_date = excluded.entry_date,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  status = excluded.status,
  approval_status = excluded.approval_status,
  source = excluded.source,
  project_id = excluded.project_id,
  comment = excluded.comment,
  submitted_at = excluded.submitted_at,
  locked_at = excluded.locked_at,
  approved_at = excluded.approved_at,
  approved_by_employee_id = excluded.approved_by_employee_id;

insert into public.time_entry_breaks (id, time_entry_id, started_at, ended_at, source)
values
  ('71100000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', ((select prev_workday_4 from mock_calendar) + time '12:05')::timestamptz, ((select prev_workday_4 from mock_calendar) + time '12:35')::timestamptz, 'manual'),
  ('71100000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', ((select prev_workday_3 from mock_calendar) + time '12:12')::timestamptz, ((select prev_workday_3 from mock_calendar) + time '12:42')::timestamptz, 'manual'),
  ('71100000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003', ((select prev_workday_2 from mock_calendar) + time '12:10')::timestamptz, ((select prev_workday_2 from mock_calendar) + time '12:35')::timestamptz, 'manual'),
  ('71100000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000005', ((select prev_workday_1 from mock_calendar) + time '12:00')::timestamptz, ((select prev_workday_1 from mock_calendar) + time '12:20')::timestamptz, 'manual'),
  ('71100000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000005', ((select prev_workday_1 from mock_calendar) + time '15:35')::timestamptz, ((select prev_workday_1 from mock_calendar) + time '15:50')::timestamptz, 'auto_legal'),
  ('71100000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000007', ((select current_workday from mock_calendar) + time '11:55')::timestamptz, null, 'live')
on conflict (id) do update set
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  source = excluded.source;

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
  ('71200000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000004', 'pending', 'MOCK Korrektur: Anfahrt und Projektzuordnung fehlen.', ((select prev_workday_2 from mock_calendar) + time '07:35')::timestamptz, ((select prev_workday_2 from mock_calendar) + time '16:05')::timestamptz, 30, '51000000-0000-0000-0000-000000000005', 'MOCK Bitte auf Projekt Epsilon umbuchen.', null, null, null),
  ('71200000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', 'approved', 'MOCK Kommentar nachgetragen.', ((select prev_workday_4 from mock_calendar) + time '07:03')::timestamptz, ((select prev_workday_4 from mock_calendar) + time '16:04')::timestamptz, 30, '51000000-0000-0000-0000-000000000001', 'MOCK Dokumentationsfenster am Abend ergaenzt.', '21000000-0000-0000-0000-000000000002', ((select prev_workday_3 from mock_calendar) + time '11:00')::timestamptz, 'MOCK Korrektur ist nachvollziehbar.')
on conflict (id) do update set
  status = excluded.status,
  reason = excluded.reason,
  proposed_started_at = excluded.proposed_started_at,
  proposed_ended_at = excluded.proposed_ended_at,
  proposed_break_minutes = excluded.proposed_break_minutes,
  proposed_project_id = excluded.proposed_project_id,
  proposed_comment = excluded.proposed_comment,
  decided_by_employee_id = excluded.decided_by_employee_id,
  decided_at = excluded.decided_at,
  decision_reason = excluded.decision_reason;

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
  ('81000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', 'vacation', (select next_workday_2 from mock_calendar), (select next_workday_2 from mock_calendar), 'full_day', null, null, 'full', 'full', 'approved', 'MOCK Urlaub bereits genehmigt.', ((select prev_workday_6 from mock_calendar) + time '10:00')::timestamptz, ((select prev_workday_5 from mock_calendar) + time '10:00')::timestamptz, '21000000-0000-0000-0000-000000000002'),
  ('81000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000004', 'vacation', (select next_workday_4 from mock_calendar), (select next_workday_4 from mock_calendar), 'full_day', null, null, 'full', 'full', 'pending', 'MOCK Urlaubsantrag wartet auf Entscheidung.', ((select prev_workday_1 from mock_calendar) + time '15:00')::timestamptz, null, null),
  ('81000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000005', 'sick', (select current_workday from mock_calendar), (select current_workday from mock_calendar), 'full_day', null, null, 'full', 'full', 'approved', 'MOCK Krankmeldung fuer den aktuellen Arbeitstag.', ((select current_workday from mock_calendar) + time '06:30')::timestamptz, ((select current_workday from mock_calendar) + time '07:00')::timestamptz, '21000000-0000-0000-0000-000000000002'),
  ('81000000-0000-0000-0000-000000000004', '21000000-0000-0000-0000-000000000006', 'medical', (select prev_workday_2 from mock_calendar), (select prev_workday_2 from mock_calendar), 'partial_day', time '09:30', time '11:00', 'morning', 'morning', 'approved', 'MOCK Arzttermin am Vormittag.', ((select prev_workday_5 from mock_calendar) + time '11:00')::timestamptz, ((select prev_workday_4 from mock_calendar) + time '09:00')::timestamptz, '21000000-0000-0000-0000-000000000002'),
  ('81000000-0000-0000-0000-000000000005', '21000000-0000-0000-0000-000000000007', 'other', (select next_workday_1 from mock_calendar), (select next_workday_1 from mock_calendar), 'partial_day', time '13:00', time '15:00', 'afternoon', 'afternoon', 'approved', 'MOCK Sonstige Abwesenheit fuer privaten Termin.', ((select prev_workday_2 from mock_calendar) + time '14:00')::timestamptz, ((select prev_workday_1 from mock_calendar) + time '09:00')::timestamptz, '21000000-0000-0000-0000-000000000001')
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
    '91000000-0000-0000-0000-000000000001',
    'project_time_report',
    '21000000-0000-0000-0000-000000000001',
    '{"title":"MOCK Projektreport Monatsuebersicht","filename":"MOCK-Projektreport.pdf"}'::jsonb,
    jsonb_build_object('dateFrom', (current_date - interval '30 day')::date, 'dateTo', current_date::date),
    'completed',
    5,
    'MOCK-Projektreport.pdf',
    now() - interval '1 day'
  )
on conflict (id) do update set
  scope_description = excluded.scope_description,
  filters = excluded.filters,
  status = excluded.status,
  row_count = excluded.row_count,
  artifact_ref = excluded.artifact_ref,
  completed_at = excluded.completed_at;

commit;
