import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const entries = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    entries[key] = value;
  }

  return entries;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const env = loadEnvFile(".env.local");
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  assert(url && anonKey && serviceRoleKey, "Missing required Supabase env vars");

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const suffix = Date.now();
  const password = `SmokePass!${suffix}`;
  const emails = {
    admin: `smoke-admin-${suffix}@example.com`,
    lead: `smoke-lead-${suffix}@example.com`,
    employee: `smoke-employee-${suffix}@example.com`,
    outsider: `smoke-outsider-${suffix}@example.com`,
  };

  const createdAuthUsers = [];
  const cleanupErrors = [];

  async function createAuthUser(email) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Failed to create auth user for ${email}: ${error?.message}`);
    }

    createdAuthUsers.push(data.user.id);
    return data.user.id;
  }

  async function signIn(email) {
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(`Failed to sign in ${email}: ${error.message}`);
    }

    return client;
  }

  let summary = [];

  try {
    const companySettings = await admin
      .from("company_settings")
      .select("id")
      .eq("id", 1)
      .single();
    assert(companySettings.data?.id === 1, "company_settings singleton is missing");

    const workSchedule = await admin
      .from("work_schedules")
      .select("id")
      .limit(1)
      .single();
    assert(workSchedule.data?.id, "No work schedule found for smoke test");

    const adminUserId = await createAuthUser(emails.admin);
    const leadUserId = await createAuthUser(emails.lead);
    const employeeUserId = await createAuthUser(emails.employee);
    const outsiderUserId = await createAuthUser(emails.outsider);

    const { error: profilesError } = await admin.from("profiles").insert([
      { id: adminUserId, role: "admin", is_active: true },
      { id: leadUserId, role: "team_lead", is_active: true },
      { id: employeeUserId, role: "employee", is_active: true },
      { id: outsiderUserId, role: "employee", is_active: true },
    ]);
    if (profilesError) throw new Error(profilesError.message);

    const { data: team, error: teamError } = await admin
      .from("teams")
      .insert({ name: `Smoke Team ${suffix}` })
      .select("*")
      .single();
    if (teamError) throw new Error(teamError.message);

    const { data: secondTeam, error: secondTeamError } = await admin
      .from("teams")
      .insert({ name: `Smoke Other Team ${suffix}` })
      .select("*")
      .single();
    if (secondTeamError) throw new Error(secondTeamError.message);

    const employmentStartDate = new Date().toISOString().slice(0, 10);
    const employeeRows = [
      {
        profile_id: adminUserId,
        first_name: "Smoke",
        last_name: "Admin",
        employee_number: `S-ADMIN-${suffix}`,
        team_id: null,
        work_schedule_id: workSchedule.data.id,
        employment_start_date: employmentStartDate,
        is_active: true,
      },
      {
        profile_id: leadUserId,
        first_name: "Smoke",
        last_name: "Lead",
        employee_number: `S-LEAD-${suffix}`,
        team_id: team.id,
        work_schedule_id: workSchedule.data.id,
        employment_start_date: employmentStartDate,
        is_active: true,
      },
      {
        profile_id: employeeUserId,
        first_name: "Smoke",
        last_name: "Employee",
        employee_number: `S-EMP-${suffix}`,
        team_id: team.id,
        work_schedule_id: workSchedule.data.id,
        employment_start_date: employmentStartDate,
        is_active: true,
      },
      {
        profile_id: outsiderUserId,
        first_name: "Smoke",
        last_name: "Outsider",
        employee_number: `S-OUT-${suffix}`,
        team_id: secondTeam.id,
        work_schedule_id: workSchedule.data.id,
        employment_start_date: employmentStartDate,
        is_active: true,
      },
    ];

    const { data: employees, error: employeesError } = await admin
      .from("employees")
      .insert(employeeRows)
      .select("*");
    if (employeesError) throw new Error(employeesError.message);

    const employeeByProfileId = Object.fromEntries(
      employees.map((row) => [row.profile_id, row])
    );

    const { error: leaveSettingsError } = await admin.from("employee_leave_settings").insert(
      employees.map((row) => ({
        employee_id: row.id,
        annual_entitlement_days: 30,
      }))
    );
    if (leaveSettingsError) throw new Error(leaveSettingsError.message);

    const { error: assignLeadError } = await admin
      .from("teams")
      .update({ team_lead_employee_id: employeeByProfileId[leadUserId].id })
      .eq("id", team.id);
    if (assignLeadError) throw new Error(assignLeadError.message);

    const adminClient = await signIn(emails.admin);
    const leadClient = await signIn(emails.lead);
    const employeeClient = await signIn(emails.employee);

    const ownEmployeeRead = await employeeClient
      .from("employees")
      .select("id")
      .eq("id", employeeByProfileId[employeeUserId].id)
      .single();
    assert(ownEmployeeRead.data?.id === employeeByProfileId[employeeUserId].id, "Employee cannot read own employee row");
    summary.push("employee can read own employee row");

    const foreignEmployeeRead = await employeeClient
      .from("employees")
      .select("id")
      .eq("id", employeeByProfileId[leadUserId].id);
    assert((foreignEmployeeRead.data ?? []).length === 0, "Employee can read foreign employee row");
    summary.push("employee cannot read foreign employee row");

    const leadTeamRead = await leadClient
      .from("employees")
      .select("id")
      .eq("id", employeeByProfileId[employeeUserId].id)
      .single();
    assert(leadTeamRead.data?.id === employeeByProfileId[employeeUserId].id, "Team lead cannot read in-scope employee");
    summary.push("team lead can read scoped team employee");

    const leadOutsiderRead = await leadClient
      .from("employees")
      .select("id")
      .eq("id", employeeByProfileId[outsiderUserId].id);
    assert((leadOutsiderRead.data ?? []).length === 0, "Team lead can read out-of-scope employee");
    summary.push("team lead cannot read out-of-scope employee");

    const adminRead = await adminClient.from("employees").select("id");
    assert((adminRead.data ?? []).length >= 4, "Admin cannot read employee rows");
    summary.push("admin can read employee rows");

    const roleEscalationAttempt = await employeeClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", employeeUserId)
      .select("role");
    const employeeProfileAfterEscalationAttempt = await admin
      .from("profiles")
      .select("role")
      .eq("id", employeeUserId)
      .single();
    assert(
      roleEscalationAttempt.error || employeeProfileAfterEscalationAttempt.data?.role !== "admin",
      "Employee can escalate own role"
    );
    summary.push("employee cannot escalate own role");

    const today = new Date().toISOString().slice(0, 10);
    const employeeDirectStartWorkday = await employeeClient.rpc("start_workday", {
      target_employee_id: employeeByProfileId[employeeUserId].id,
      target_entry_date: today,
      target_started_at: `${today}T08:00:00+00:00`,
    });
    summary.push(
      employeeDirectStartWorkday.error
        ? "employee direct start_workday blocked"
        : "employee direct start_workday succeeded"
    );

    const startWorkdayResult = await admin.rpc("start_workday", {
      target_employee_id: employeeByProfileId[employeeUserId].id,
      target_entry_date: today,
      target_started_at: `${today}T08:00:00+00:00`,
    });
    assert(startWorkdayResult.data?.id, "Server-authoritative start workday failed");
    summary.push("server-authoritative start workday works");

    const timeEntryId = startWorkdayResult.data.id;

    const startBreakResult = await admin.rpc("start_break", {
      target_time_entry_id: timeEntryId,
      target_started_at: `${today}T10:00:00+00:00`,
    });
    assert(startBreakResult.data?.id, "Server-authoritative start break failed");
    summary.push("server-authoritative start break works");

    const secondOpenBreak = await admin.rpc("start_break", {
      target_time_entry_id: timeEntryId,
      target_started_at: `${today}T10:05:00+00:00`,
    });
    assert(secondOpenBreak.error, "Second concurrent-style open break was allowed");
    summary.push("second open break is rejected");

    const endBreakResult = await admin.rpc("end_break", {
      target_time_entry_id: timeEntryId,
      target_ended_at: `${today}T10:30:00+00:00`,
    });
    assert(endBreakResult.data?.id, "Server-authoritative end break failed");
    summary.push("server-authoritative end break works");

    const endWorkdayResult = await admin.rpc("end_workday", {
      target_time_entry_id: timeEntryId,
      target_ended_at: `${today}T16:00:00+00:00`,
    });
    assert(endWorkdayResult.data?.id, "Server-authoritative end workday failed");
    summary.push("server-authoritative end workday works");

    const submitPending = await admin
      .from("time_entries")
      .update({
        approval_status: "pending",
        status: "in_review",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", timeEntryId)
      .select("*")
      .single();
    if (submitPending.error) throw new Error(submitPending.error.message);

    const leadApproveTime = await admin.rpc("approve_time_entry", {
      target_time_entry_id: timeEntryId,
      actor_employee_id: employeeByProfileId[leadUserId].id,
      actor_decision_reason: "smoke approval",
    });
    assert(leadApproveTime.data?.id, "Server-authoritative time approval failed");
    summary.push("server-authoritative time approval works");

    const outsiderEntryInsert = await admin
      .from("time_entries")
      .insert({
        employee_id: employeeByProfileId[outsiderUserId].id,
        entry_date: today,
        started_at: `${today}T08:00:00+00:00`,
        ended_at: `${today}T16:00:00+00:00`,
        status: "in_review",
        approval_status: "pending",
        source: "manual",
      })
      .select("*")
      .single();
    if (outsiderEntryInsert.error) throw new Error(outsiderEntryInsert.error.message);

    const employeeMaliciousApproval = await employeeClient.rpc("approve_time_entry", {
      target_time_entry_id: outsiderEntryInsert.data.id,
      actor_employee_id: employeeByProfileId[employeeUserId].id,
      actor_decision_reason: "malicious",
    });

    summary.push(
      employeeMaliciousApproval.error
        ? "employee malicious approve_time_entry blocked"
        : "employee malicious approve_time_entry succeeded"
    );

    const vacationRequestInsert = await admin
      .from("leave_requests")
      .insert({
        employee_id: employeeByProfileId[employeeUserId].id,
        leave_type: "vacation",
        start_date: today,
        end_date: today,
        start_day_part: "full",
        end_day_part: "full",
        status: "pending",
      })
      .select("*")
      .single();
    if (vacationRequestInsert.error) throw new Error(vacationRequestInsert.error.message);

    const leadApproveLeave = await admin.rpc("approve_leave_request", {
      target_leave_request_id: vacationRequestInsert.data.id,
      actor_employee_id: employeeByProfileId[leadUserId].id,
      actor_decision_reason: "smoke approval",
    });
    assert(leadApproveLeave.data?.id, "Server-authoritative leave approval failed");
    summary.push("server-authoritative leave approval works");

    const sickRequestInsert = await admin
      .from("leave_requests")
      .insert({
        employee_id: employeeByProfileId[employeeUserId].id,
        leave_type: "sick",
        start_date: today,
        end_date: today,
        start_day_part: "full",
        end_day_part: "full",
        status: "pending",
      })
      .select("*")
      .single();
    if (sickRequestInsert.error) throw new Error(sickRequestInsert.error.message);

    const teamVisibleSick = await leadClient
      .from("leave_requests")
      .select("id, leave_type, status")
      .eq("id", sickRequestInsert.data.id)
      .single();
    assert(teamVisibleSick.data?.leave_type === "sick", "Team lead cannot see pending sick leave");
    summary.push("pending sick leave is visible to scoped lead");

    const leaveBalance = await admin.rpc("recompute_leave_balance_year", {
      target_employee_id: employeeByProfileId[employeeUserId].id,
      target_year: Number(today.slice(0, 4)),
    });
    assert(leaveBalance.data, "Leave balance recompute failed");
    summary.push("leave balance recompute works");

    const employeeMaliciousLeaveApproval = await employeeClient.rpc("approve_leave_request", {
      target_leave_request_id: sickRequestInsert.data.id,
      actor_employee_id: employeeByProfileId[employeeUserId].id,
      actor_decision_reason: "malicious",
    });
    summary.push(
      employeeMaliciousLeaveApproval.error
        ? "employee malicious approve_leave_request blocked"
        : "employee malicious approve_leave_request succeeded"
    );
  } finally {
    try {
      const idsByEmail = await admin
        .from("profiles")
        .select("id")
        .in("id", createdAuthUsers);
      const profileIds = (idsByEmail.data ?? []).map((row) => row.id);

      if (profileIds.length > 0) {
        const employeeRows = await admin
          .from("employees")
          .select("id")
          .in("profile_id", profileIds);
        const employeeIds = (employeeRows.data ?? []).map((row) => row.id);

        if (employeeIds.length > 0) {
          await admin.from("leave_approvals").delete().in(
            "leave_request_id",
            (
              await admin
                .from("leave_requests")
                .select("id")
                .in("employee_id", employeeIds)
            ).data?.map((row) => row.id) ?? ["00000000-0000-0000-0000-000000000000"]
          );
          await admin.from("leave_requests").delete().in("employee_id", employeeIds);
          await admin.from("leave_balance_years").delete().in("employee_id", employeeIds);
          await admin.from("leave_balance_adjustments").delete().in("employee_id", employeeIds);
          await admin.from("employee_leave_settings").delete().in("employee_id", employeeIds);

          const timeEntryIds =
            (
              await admin.from("time_entries").select("id").in("employee_id", employeeIds)
            ).data?.map((row) => row.id) ?? [];

          if (timeEntryIds.length > 0) {
            await admin.from("time_entry_approvals").delete().in("time_entry_id", timeEntryIds);
            await admin.from("time_entry_audit_logs").delete().in("time_entry_id", timeEntryIds);
            await admin
              .from("time_entry_change_requests")
              .delete()
              .in("time_entry_id", timeEntryIds);
            await admin.from("time_entry_breaks").delete().in("time_entry_id", timeEntryIds);
            await admin.from("time_entries").delete().in("id", timeEntryIds);
          }

          await admin.from("teams").update({ team_lead_employee_id: null }).not("id", "is", null);
          await admin.from("employees").delete().in("id", employeeIds);
        }

        await admin.from("teams").delete().like("name", `Smoke % ${suffix}`);

        for (const userId of createdAuthUsers) {
          const { error } = await admin.auth.admin.deleteUser(userId);
          if (error) {
            cleanupErrors.push(`deleteUser ${userId}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      cleanupErrors.push(String(error));
    }
  }

  console.log(JSON.stringify({ summary, cleanupErrors }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
