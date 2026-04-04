import { NextRequest, NextResponse } from "next/server";

import { assertEmployeeIsActive, assertHasEmployee } from "@/src/lib/auth/assertions";
import { computeBreakMinutes, computeWorkedMinutes } from "@/src/lib/domain/time-calculations";
import { createTabularPdf } from "@/src/lib/exports/pdf";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import { exportRequestSchema } from "@/src/lib/validations/exports";

function enumerateDates(dateFrom: string, dateTo: string) {
  const values: string[] = [];
  const current = new Date(`${dateFrom}T12:00:00Z`);
  const end = new Date(`${dateTo}T12:00:00Z`);

  while (current <= end) {
    values.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return values;
}

function formatExportFilename(date: Date, scopeLabel: string) {
  return `${date.toISOString().slice(0, 10)} Export [${scopeLabel}].pdf`;
}

function monthLabel(dateFrom: string) {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    new Date(`${dateFrom}T12:00:00Z`)
  );
}

export async function GET(request: NextRequest) {
  const context = await assertEmployeeIsActive();
  const actor = assertHasEmployee(context);
  if (context.profile.role !== "admin") {
    return NextResponse.json({ error: "Adminzugriff erforderlich." }, { status: 403 });
  }

  const payload = exportRequestSchema.parse({
    exportType: request.nextUrl.searchParams.get("exportType"),
    dateFrom: request.nextUrl.searchParams.get("dateFrom"),
    dateTo: request.nextUrl.searchParams.get("dateTo"),
    employeeId: request.nextUrl.searchParams.get("employeeId") || null,
    teamId: request.nextUrl.searchParams.get("teamId") || null,
  });

  const admin = createSupabaseAdminClient();

  let title = "Export";
  let scopeLabel = "Gesamt";
  let rows: Array<{ date: string; label: string; hours?: string; note?: string; tone?: [number, number, number] }> =
    [];

  if (payload.exportType === "monthly_timesheet") {
    if (!payload.employeeId) {
      return NextResponse.json({ error: "Für den Monatsexport muss eine mitarbeitende Person gewählt werden." }, { status: 400 });
    }

    const [{ data: employee, error: employeeError }, { data: company }] = await Promise.all([
      admin.from("employees").select("id, first_name, last_name").eq("id", payload.employeeId).single(),
      admin.from("company_settings").select("holiday_region_code").eq("id", 1).single(),
    ]);

    if (employeeError || !employee) {
      return NextResponse.json({ error: employeeError?.message ?? "Mitarbeitende Person wurde nicht gefunden." }, { status: 400 });
    }

    const [{ data: entries, error: entriesError }, { data: leaves, error: leavesError }, { data: holidays, error: holidaysError }] =
      await Promise.all([
        admin
          .from("time_entries")
          .select("*, time_entry_breaks(*)")
          .eq("employee_id", payload.employeeId)
          .gte("entry_date", payload.dateFrom)
          .lte("entry_date", payload.dateTo)
          .order("entry_date"),
        admin
          .from("leave_requests")
          .select("*")
          .eq("employee_id", payload.employeeId)
          .lte("start_date", payload.dateTo)
          .gte("end_date", payload.dateFrom)
          .in("status", ["pending", "approved"]),
        admin
          .from("holidays")
          .select("*")
          .eq("region_code", company?.holiday_region_code ?? "DE-NI")
          .gte("holiday_date", payload.dateFrom)
          .lte("holiday_date", payload.dateTo),
      ]);

    if (entriesError || leavesError || holidaysError) {
      return NextResponse.json(
        { error: entriesError?.message ?? leavesError?.message ?? holidaysError?.message ?? "Exportdaten konnten nicht geladen werden." },
        { status: 500 }
      );
    }

    title = "Monatsexport Zeiterfassung";
    scopeLabel = `${employee.first_name} ${employee.last_name}, ${monthLabel(payload.dateFrom)}`;

    rows = enumerateDates(payload.dateFrom, payload.dateTo).map((dateKey) => {
      const entry = entries.find((item) => item.entry_date === dateKey);
      const leave = leaves.find((item) => item.start_date <= dateKey && item.end_date >= dateKey);
      const holiday = holidays.find((item) => item.holiday_date === dateKey);
      const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
      const isWeekend = weekday === 0 || weekday === 6;

      if (leave?.leave_type === "sick") {
        return { date: dateKey, label: "Krank", note: leave.comment ?? "Krankmeldung", tone: [0.93, 0.35, 0.45] as [number, number, number] };
      }

      if (leave) {
        return {
          date: dateKey,
          label: leave.status === "pending" ? "Abwesenheit ausstehend" : "Urlaub / Abwesenheit",
          note: leave.comment ?? "Abwesenheit",
          tone: leave.status === "pending" ? ([0.96, 0.76, 0.24] as [number, number, number]) : ([0.22, 0.55, 0.88] as [number, number, number]),
        };
      }

      if (holiday) {
        return { date: dateKey, label: "Feiertag", note: holiday.name, tone: [0.78, 0.82, 0.88] as [number, number, number] };
      }

      if (isWeekend) {
        return { date: dateKey, label: "Wochenende", note: "Kein regulärer Arbeitstag", tone: [0.88, 0.9, 0.93] as [number, number, number] };
      }

      if (entry) {
        const worked = computeWorkedMinutes(entry, entry.time_entry_breaks ?? []);
        const breakMinutes = computeBreakMinutes(entry.time_entry_breaks ?? []);
        return {
          date: dateKey,
          label: "Arbeitszeit",
          hours: `${(worked / 60).toFixed(2).replace(".", ",")} Std.`,
          note: `${entry.started_at ? new Date(entry.started_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "--:--"} - ${entry.ended_at ? new Date(entry.ended_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "--:--"} · Pause ${(breakMinutes / 60).toFixed(2).replace(".", ",")} Std.`,
          tone: [0.22, 0.67, 0.42] as [number, number, number],
        };
      }

      return { date: dateKey, label: "Kein Eintrag", note: "Keine Buchung oder Abwesenheit", tone: [0.92, 0.93, 0.95] as [number, number, number] };
    });
  } else if (payload.exportType === "absence_report") {
    const { data: requests, error } = await admin
      .from("leave_requests")
      .select("*, employees(first_name, last_name)")
      .gte("start_date", payload.dateFrom)
      .lte("end_date", payload.dateTo)
      .order("start_date");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    title = "Abwesenheitsreport";
    scopeLabel = payload.teamId ? "Teamreport" : "Gesamtübersicht";
    rows = requests.map((request) => ({
      date: `${request.start_date} - ${request.end_date}`,
      label:
        request.leave_type === "sick"
          ? "Krank"
          : request.leave_type === "vacation"
            ? "Urlaub"
            : "Abwesenheit",
      note: `${request.employees?.first_name ?? ""} ${request.employees?.last_name ?? ""}`.trim() || request.comment || "Ohne Zusatzinfo",
      tone:
        request.leave_type === "sick"
          ? ([0.93, 0.35, 0.45] as [number, number, number])
          : ([0.22, 0.55, 0.88] as [number, number, number]),
    }));
  } else {
    const { data: employees, error } = await admin.from("employees").select("first_name, last_name, is_active").order("last_name");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    title = "Teamübersicht";
    scopeLabel = payload.teamId ? "Team" : "Alle Teams";
    rows = employees.map((employee) => ({
      date: payload.dateFrom,
      label: employee.is_active ? "Aktiv" : "Inaktiv",
      note: `${employee.first_name} ${employee.last_name}`,
      tone: employee.is_active ? ([0.22, 0.67, 0.42] as [number, number, number]) : ([0.78, 0.82, 0.88] as [number, number, number]),
    }));
  }

  const pdf = createTabularPdf({
    title,
    subtitle: `${scopeLabel}`,
    info: [
      `Zeitraum: ${payload.dateFrom} bis ${payload.dateTo}`,
      `Erzeugt am: ${new Date().toLocaleString("de-DE")}`,
    ],
    rows,
  });

  const filename = formatExportFilename(new Date(), scopeLabel);

  await admin.from("export_logs").insert({
    export_type: payload.exportType,
    requested_by_employee_id: actor.id,
    scope_description: {
      employeeId: payload.employeeId ?? null,
      teamId: payload.teamId ?? null,
      title,
      filename,
    },
    filters: {
      dateFrom: payload.dateFrom,
      dateTo: payload.dateTo,
    },
    status: "completed",
    row_count: rows.length,
    artifact_ref: filename,
    completed_at: new Date().toISOString(),
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
