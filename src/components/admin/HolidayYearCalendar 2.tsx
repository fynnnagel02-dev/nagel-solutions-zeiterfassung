import { Panel } from "@/src/components/shared/Panel";
import { formatDate, getMonthOptions } from "@/src/lib/presentation/format";

type HolidayGroupRow = {
  holidayDate: string;
  name: string;
  isCompanyObserved: boolean;
  holidayIds: string[];
  regionCodes: string[];
  stateLabels: string[];
};

export function HolidayYearCalendar({
  holidays,
  year,
}: {
  holidays: HolidayGroupRow[];
  year: number;
}) {
  const months = getMonthOptions(year).map((month) => ({
    ...month,
    holidays: holidays.filter((holiday) => new Date(`${holiday.holidayDate}T12:00:00Z`).getUTCMonth() + 1 === month.value),
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {months.map((month) => (
        <Panel key={month.value} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
              {month.label}
            </h3>
            <p className="text-sm text-[color:var(--color-text-soft)]">
              {month.holidays.length === 0
                ? "Keine Feiertage in diesem Monat"
                : `${month.holidays.length} Feiertag${month.holidays.length === 1 ? "" : "e"} im Überblick`}
            </p>
          </div>
          <div className="space-y-3">
            {month.holidays.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-5 text-sm text-[color:var(--color-text-soft)]">
                Für diesen Monat sind derzeit keine gesetzlichen Feiertage hinterlegt.
              </div>
            ) : (
              month.holidays.map((holiday) => (
                <div
                  key={`${holiday.holidayDate}-${holiday.name}`}
                  className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">{holiday.name}</p>
                      <p className="text-sm text-[color:var(--color-text-soft)]">{formatDate(holiday.holidayDate)}</p>
                    </div>
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      Feiertag
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-soft)]">
                    Gilt in {holiday.stateLabels.length === 16 ? "allen Bundesländern" : holiday.stateLabels.join(", ")}.
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      ))}
    </div>
  );
}
