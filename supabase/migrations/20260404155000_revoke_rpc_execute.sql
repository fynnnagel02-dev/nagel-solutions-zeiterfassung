revoke execute on function public.start_workday(uuid, date, timestamptz) from public, anon, authenticated;
revoke execute on function public.start_break(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.end_break(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.end_workday(uuid, timestamptz) from public, anon, authenticated;

revoke execute on function public.approve_time_entry(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.reject_time_entry(uuid, uuid, text) from public, anon, authenticated;

revoke execute on function public.approve_leave_request(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.reject_leave_request(uuid, uuid, text) from public, anon, authenticated;

revoke execute on function public.approve_time_entry_change_request(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.reject_time_entry_change_request(uuid, uuid, text) from public, anon, authenticated;

revoke execute on function public.recompute_leave_balance_year(uuid, integer) from public, anon, authenticated;
revoke execute on function public.compute_vacation_consumption_days(uuid, date, date, public.day_part, public.day_part) from public, anon, authenticated;
revoke execute on function public.get_target_minutes_for_employee_on_date(uuid, date) from public, anon, authenticated;
