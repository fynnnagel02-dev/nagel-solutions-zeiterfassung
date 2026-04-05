do $$
begin
  alter type public.leave_type add value 'medical';
exception
  when duplicate_object then null;
end $$;

alter table public.leave_requests
  add column if not exists duration_mode text,
  add column if not exists partial_start_time time,
  add column if not exists partial_end_time time;

update public.leave_requests
set duration_mode = case
  when start_day_part = 'full' and end_day_part = 'full' then 'full_day'
  else 'partial_day'
end
where duration_mode is null;

update public.leave_requests
set
  partial_start_time = case
    when start_day_part = 'morning' then coalesce(partial_start_time, time '08:00')
    when start_day_part = 'afternoon' then coalesce(partial_start_time, time '13:00')
    else partial_start_time
  end,
  partial_end_time = case
    when end_day_part = 'morning' then coalesce(partial_end_time, time '12:00')
    when end_day_part = 'afternoon' then coalesce(partial_end_time, time '17:00')
    else partial_end_time
  end
where duration_mode = 'partial_day';

alter table public.leave_requests
  alter column duration_mode set default 'full_day',
  alter column duration_mode set not null;

do $$
begin
  alter table public.leave_requests
    add constraint leave_requests_duration_mode_check
    check (duration_mode in ('full_day', 'partial_day'));
exception
  when duplicate_object then null;
end $$;
