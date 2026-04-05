"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/src/components/shared/Modal";
import { Panel } from "@/src/components/shared/Panel";
import { getLeaveTypeLabel } from "@/src/lib/presentation/leave";
import {
  formatDate,
  formatDateRange,
  getMonthOptions,
} from "@/src/lib/presentation/format";

type CalendarEmployee = {
  id: string;
  name: string;
  teamName: string | null;
};

type LeaveRequest = {
  employee_id: string;
  leave_type: "vacation" | "sick" | "medical" | "other";
  status: "pending" | "approved" | "rejected" | "cancelled";
  start_date: string;
  end_date: string;
};

type Holiday = {
  holiday_date: string;
  name: string;
};

type PlannerEvent = LeaveRequest & {
  employeeName: string;
  teamName: string | null;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthMeta(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const days = Array.from({ length: end.getUTCDate() }, (_, index) =>
    new Date(Date.UTC(year, month - 1, index + 1))
  );

  return { start, end, days };
}

function getWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short" })
    .format(date)
    .replace(".", "");
}

function getEventTone(leaveType: LeaveRequest["leave_type"], status: LeaveRequest["status"]) {
  if (leaveType === "sick") {
    return "bg-rose-500 text-white";
  }

  if (status === "pending") {
    return "bg-amber-300 text-slate-900";
  }

  if (leaveType === "other") {
    return "bg-violet-500 text-white";
  }

  if (leaveType === "medical") {
    return "bg-cyan-600 text-white";
  }

  return "bg-sky-600 text-white";
}

function getEventLabel(event: LeaveRequest) {
  if (event.leave_type !== "vacation") {
    return getLeaveTypeLabel(event.leave_type);
  }

  return event.status === "pending" ? "Urlaub angefragt" : "Urlaub";
}

function intersectsMonth(event: LeaveRequest, monthStart: Date, monthEnd: Date) {
  const from = toDateKey(monthStart);
  const to = toDateKey(monthEnd);
  return event.start_date <= to && event.end_date >= from;
}

function getOffsetInMonth(startDate: string, monthStart: Date) {
  const start = new Date(`${startDate}T12:00:00Z`).getTime();
  const month = new Date(`${toDateKey(monthStart)}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((start - month) / 86_400_000));
}

function getSpanInMonth(event: LeaveRequest, monthStart: Date, monthEnd: Date) {
  const effectiveStart = event.start_date < toDateKey(monthStart) ? toDateKey(monthStart) : event.start_date;
  const effectiveEnd = event.end_date > toDateKey(monthEnd) ? toDateKey(monthEnd) : event.end_date;
  const from = new Date(`${effectiveStart}T12:00:00Z`).getTime();
  const to = new Date(`${effectiveEnd}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((to - from) / 86_400_000) + 1);
}

export function YearAbsenceCalendar({
  year,
  month,
  employees,
  leaveRequests,
  holidays,
}: {
  year: number;
  month?: number;
  employees: CalendarEmployee[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
}) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month ?? new Date().getUTCMonth() + 1);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);

  const monthMeta = useMemo(
    () => getMonthMeta(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );
  const monthOptions = useMemo(() => getMonthOptions(selectedYear), [selectedYear]);
  const holidayMap = useMemo(
    () =>
      new Map(
        holidays
          .filter(
            (holiday) =>
              new Date(`${holiday.holiday_date}T12:00:00Z`).getUTCFullYear() === selectedYear &&
              new Date(`${holiday.holiday_date}T12:00:00Z`).getUTCMonth() + 1 === selectedMonth
          )
          .map((holiday) => [holiday.holiday_date, holiday.name])
      ),
    [holidays, selectedMonth, selectedYear]
  );

  const groupedEmployees = useMemo(
    () =>
      employees.reduce<Record<string, CalendarEmployee[]>>((accumulator, employee) => {
        const key = employee.teamName ?? "Ohne Team";
        accumulator[key] = accumulator[key] ?? [];
        accumulator[key].push(employee);
        return accumulator;
      }, {}),
    [employees]
  );

  const eventsByEmployee = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.id,
          leaveRequests.filter(
            (event) =>
              event.employee_id === employee.id &&
              event.status !== "rejected" &&
              event.status !== "cancelled" &&
              intersectsMonth(event, monthMeta.start, monthMeta.end)
          ),
        ])
      ),
    [employees, leaveRequests, monthMeta.end, monthMeta.start]
  );

  function goToPreviousMonth() {
    setSelectedMonth((currentMonth) => {
      if (currentMonth === 1) {
        setSelectedYear((currentYear) => currentYear - 1);
        return 12;
      }

      return currentMonth - 1;
    });
  }

  function goToNextMonth() {
    setSelectedMonth((currentMonth) => {
      if (currentMonth === 12) {
        setSelectedYear((currentYear) => currentYear + 1);
        return 1;
      }

      return currentMonth + 1;
    });
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Planer
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
              Interner Kalender
            </h2>
            <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
              Monatsplaner mit fester Mitarbeitenden-Spalte, Abwesenheitsbalken und dezentem Feiertags-Overlay.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="rounded-full border border-[color:var(--color-border-soft)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-text)]"
              >
                ←
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-[color:var(--color-text)]">
                  {monthOptions.find((option) => option.value === selectedMonth)?.label}
                </p>
                <p className="text-xs text-[color:var(--color-text-muted)]">{selectedYear}</p>
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-full border border-[color:var(--color-border-soft)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-text)]"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[color:var(--color-text-muted)]">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                <span key={day}>{day}</span>
              ))}
              {monthMeta.days.map((day) => (
                <span
                  key={toDateKey(day)}
                  className="rounded-lg bg-white px-1 py-2 text-[11px] text-[color:var(--color-text-soft)]"
                >
                  {day.getUTCDate()}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[color:var(--color-text)]">Teams</p>
            <div className="space-y-2">
              {Object.entries(groupedEmployees).map(([teamName, teamEmployees]) => (
                <div
                  key={teamName}
                  className="rounded-[1.25rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">{teamName}</p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {teamEmployees.length} Mitarbeitende
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[color:var(--color-text)]">Legende</p>
            <div className="space-y-2 text-sm text-[color:var(--color-text-soft)]">
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-sky-600" /> Urlaub</div>
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-rose-500" /> Krank</div>
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-cyan-600" /> Arzt Besuch</div>
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-violet-500" /> Sonstige Abwesenheit</div>
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-amber-300" /> Ausstehend</div>
              <div className="flex items-center gap-3"><span className="h-3 w-8 rounded-full bg-slate-200" /> Feiertag</div>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-[color:var(--color-border-soft)] bg-white px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  Monatsplaner
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
                  {monthOptions.find((option) => option.value === selectedMonth)?.label} {selectedYear}
                </h3>
                <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                  Kompakte Teamplanung mit klarer Tagesstruktur und fester Namensspalte.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="rounded-full border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)]"
                >
                  ← Vorheriger Monat
                </button>
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(Number(event.target.value))}
                  className="rounded-full border border-[color:var(--color-border-soft)] bg-white px-4 py-2 text-sm text-[color:var(--color-text)]"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value) || year)}
                  className="w-28 rounded-full border border-[color:var(--color-border-soft)] bg-white px-4 py-2 text-sm text-[color:var(--color-text)]"
                />
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="rounded-full border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)]"
                >
                  Nächster Monat →
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-auto">
            <div className="min-w-[1200px]">
              <div
                className="grid border-b border-[color:var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(248,250,252,0.78),rgba(255,255,255,0.96))]"
                style={{ gridTemplateColumns: `240px repeat(${monthMeta.days.length}, minmax(34px, 1fr))` }}
              >
                <div className="sticky left-0 z-20 border-r border-[color:var(--color-border-soft)] bg-white px-5 py-4">
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">Mitarbeitende</p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {employees.length} Einträge im sichtbaren Bereich
                  </p>
                </div>
                {monthMeta.days.map((day) => {
                  const key = toDateKey(day);
                  const holidayName = holidayMap.get(key);
                  const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;

                  return (
                    <div
                      key={key}
                      className={`border-l border-[color:var(--color-border-soft)] px-1 py-3 text-center ${holidayName ? "bg-slate-200/95" : isWeekend ? "bg-slate-100/95" : "bg-transparent"}`}
                      title={holidayName ? `${formatDate(day)} · ${holidayName}` : formatDate(day)}
                    >
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                        {getWeekdayLabel(day)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">
                        {day.getUTCDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {employees.map((employee) => {
                const monthEvents = eventsByEmployee.get(employee.id) ?? [];

                return (
                  <div
                    key={employee.id}
                    className="grid border-b border-[color:var(--color-border-soft)]"
                    style={{ gridTemplateColumns: `240px repeat(${monthMeta.days.length}, minmax(34px, 1fr))` }}
                  >
                    <div className="sticky left-0 z-10 border-r border-[color:var(--color-border-soft)] bg-white px-5 py-4">
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">{employee.name}</p>
                      <p className="text-xs text-[color:var(--color-text-muted)]">
                        {employee.teamName ?? "Kein Team"}
                      </p>
                    </div>

                    <div
                      className="relative h-16"
                      style={{ gridColumn: `2 / span ${monthMeta.days.length}` }}
                    >
                      <div
                        className="absolute inset-0 grid"
                        style={{ gridTemplateColumns: `repeat(${monthMeta.days.length}, minmax(34px, 1fr))` }}
                      >
                        {monthMeta.days.map((day) => {
                          const key = toDateKey(day);
                          const holidayName = holidayMap.get(key);
                          const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;

                          return (
                            <div
                              key={`${employee.id}-${key}`}
                              className={`border-l border-[color:var(--color-border-soft)] ${holidayName ? "bg-slate-200/95" : isWeekend ? "bg-slate-100/95" : "bg-white"}`}
                              title={holidayName ? `${formatDate(day)} · ${holidayName}` : formatDate(day)}
                            />
                          );
                        })}
                      </div>

                      <div className="absolute inset-0">
                        {monthEvents.map((event) => {
                          const offset = getOffsetInMonth(event.start_date, monthMeta.start);
                          const span = getSpanInMonth(event, monthMeta.start, monthMeta.end);
                          return (
                            <button
                              key={`${employee.id}-${event.start_date}-${event.end_date}-${event.leave_type}-${event.status}`}
                              type="button"
                              onClick={() =>
                                setSelectedEvent({
                                  ...event,
                                  employeeName: employee.name,
                                  teamName: employee.teamName,
                                })
                              }
                              className={`absolute top-3 flex h-10 items-center rounded-full px-3 text-left text-xs font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.14)] ${getEventTone(event.leave_type, event.status)}`}
                              style={{
                                left: `calc(${offset} * (100% / ${monthMeta.days.length}) + 8px)`,
                                width: `calc(${span} * (100% / ${monthMeta.days.length}) - 12px)`,
                              }}
                              title={`${employee.name} · ${getEventLabel(event)} · ${formatDateRange(event.start_date, event.end_date)}`}
                            >
                              <span className="truncate">{getEventLabel(event)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? selectedEvent.employeeName : "Abwesenheit"}
        description={selectedEvent ? formatDateRange(selectedEvent.start_date, selectedEvent.end_date) : undefined}
        className="max-w-2xl"
      >
        {selectedEvent ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  Person
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                  {selectedEvent.employeeName}
                </p>
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  {selectedEvent.teamName ?? "Kein Team"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  Vorgang
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                  {getEventLabel(selectedEvent)}
                </p>
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  Status: {selectedEvent.status === "pending" ? "Ausstehend" : "Bestätigt"}
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-white px-4 py-4 text-sm text-[color:var(--color-text-soft)]">
              <p>Zeitraum: {formatDateRange(selectedEvent.start_date, selectedEvent.end_date)}</p>
              <p className="mt-2">
                Typ: {getLeaveTypeLabel(selectedEvent.leave_type)}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
