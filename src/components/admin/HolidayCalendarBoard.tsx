"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteHoliday } from "@/app/actions/admin";
import { HolidayAdminForm } from "@/src/components/admin/AdminForms";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { Modal } from "@/src/components/shared/Modal";
import { Panel } from "@/src/components/shared/Panel";
import { getActionMessage, getActionTone, isDemoActionResult } from "@/src/lib/demo/client";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";
import { formatDate, getMonthOptions } from "@/src/lib/presentation/format";

type HolidayGroupRow = {
  holidayDate: string;
  name: string;
  isCompanyObserved: boolean;
  holidayIds: string[];
  regionCodes: string[];
  stateLabels: string[];
};

function buildCalendarDays(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const leading = (first.getUTCDay() || 7) - 1;
  const total = last.getUTCDate();
  const cells = Array.from({ length: leading + total }, (_, index) => {
    if (index < leading) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, index - leading + 1));
  });

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function HolidayCalendarBoard({
  holidays,
  year,
}: {
  holidays: HolidayGroupRow[];
  year: number;
}) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getUTCMonth() + 1);
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayGroupRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success" | "warning">("success");
  const [isPending, startTransition] = useTransition();

  const monthOptions = getMonthOptions(year);
  const days = useMemo(() => buildCalendarDays(year, selectedMonth), [year, selectedMonth]);
  const holidaysByDate = useMemo(
    () =>
      new Map(
        holidays
          .filter((holiday) => new Date(`${holiday.holidayDate}T12:00:00Z`).getUTCMonth() + 1 === selectedMonth)
          .map((holiday) => [holiday.holidayDate, holiday])
      ),
    [holidays, selectedMonth]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(Number(event.target.value))}
            className="rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-[color:var(--color-text-soft)]">{year}</span>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Neu anlegen
        </Button>
      </div>

      <Panel className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
          {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day) => (
            <span key={day} className="px-2 py-1">{day.slice(0, 2)}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[130px] rounded-[1.5rem] bg-[color:var(--color-panel-soft)]/55" />;
            }

            const key = day.toISOString().slice(0, 10);
            const holiday = holidaysByDate.get(key);

            return (
              <div
                key={key}
                className="min-h-[130px] rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">{day.getUTCDate()}</p>
                  {holiday ? (
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
                      Feiertag
                    </span>
                  ) : null}
                </div>

                {holiday ? (
                  <button
                    type="button"
                    onClick={() => setSelectedHoliday(holiday)}
                    className="mt-3 w-full rounded-[1rem] border border-rose-100 bg-rose-50 px-3 py-3 text-left transition hover:border-rose-200"
                  >
                    <p className="text-sm font-semibold text-rose-900">{holiday.name}</p>
                    <p className="mt-1 text-xs leading-5 text-rose-700">
                      {holiday.stateLabels.length === 16 ? "Alle Bundesländer" : holiday.stateLabels.join(", ")}
                    </p>
                  </button>
                ) : (
                  <p className="mt-10 text-xs text-[color:var(--color-text-muted)]">Kein Feiertag</p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Modal
        open={Boolean(selectedHoliday)}
        onClose={() => setSelectedHoliday(null)}
        title={selectedHoliday?.name ?? "Feiertag"}
        description={selectedHoliday ? formatDate(selectedHoliday.holidayDate) : undefined}
      >
        {selectedHoliday ? (
          <div className="space-y-4">
            <HolidayAdminForm holiday={selectedHoliday} />
            <div className="flex justify-start border-t border-[color:var(--color-border-soft)] pt-4">
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      setMessage(null);
                      setMessageTone("success");
                      const result = await deleteHoliday({ holidayIds: selectedHoliday.holidayIds });
                      setMessageTone(getActionTone(result, "success"));
                      setMessage(getActionMessage(result, "Feiertag wurde gelöscht."));
                      if (!isDemoActionResult(result)) {
                        setSelectedHoliday(null);
                        router.refresh();
                      }
                    } catch (error) {
                      setMessageTone("error");
                      setMessage(toGermanErrorMessage(error));
                    }
                  })
                }
              >
                Löschen
              </Button>
            </div>
            <FormMessage message={message} tone={messageTone} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Feiertag anlegen"
        description="Neue Feiertage werden direkt im Kalender gepflegt."
      >
        <HolidayAdminForm />
      </Modal>
    </div>
  );
}
