"use client";

import { ApprovalDecisionControls } from "@/src/components/team/ApprovalDecisionControls";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelativeAge,
} from "@/src/lib/presentation/format";

export type ApprovalItem = {
  kind: "time" | "leave" | "correction";
  id: string | null;
  employee?: { name: string } | undefined;
  age?: string | null;
  dateLabel?: string | null;
  payload: Record<string, unknown>;
  issue?: string | null;
};

type CorrectionPayload = {
  id?: string | null;
  project_id?: string | null;
  projects?: { name?: string | null; code?: string | null } | null;
  time_entry_breaks?: Array<{ ended_at?: string | null; started_at?: string | null; source?: string | null }>;
  comment?: string | null;
  proposed_started_at?: string | null;
  proposed_ended_at?: string | null;
  proposed_break_minutes?: number | null;
  proposed_project_id?: string | null;
  proposed_project_name?: string | null;
  proposed_project_code?: string | null;
  proposed_comment?: string | null;
  time_entries?:
    | {
        started_at?: string | null;
        ended_at?: string | null;
        project_id?: string | null;
        projects?: { name?: string | null; code?: string | null };
        comment?: string | null;
      }
    | Array<{
        started_at?: string | null;
        ended_at?: string | null;
        project_id?: string | null;
        projects?: { name?: string | null; code?: string | null };
        comment?: string | null;
      }>;
};

type ApprovalSectionProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  items: ApprovalItem[];
};

function renderDateLabel(item: ApprovalItem) {
  if (!item.dateLabel) {
    return "Kein Datumsbezug";
  }

  if (item.dateLabel.includes("__")) {
    const [startDate, endDate] = item.dateLabel.split("__");
    return formatDateRange(startDate, endDate);
  }

  return formatDate(item.dateLabel);
}

function renderDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "--";
}

function hasAutoLegalBreak(
  breaks: Array<{ ended_at?: string | null; started_at?: string | null; source?: string | null }> | undefined
) {
  return Boolean(breaks?.some((item) => item.source === "auto_legal"));
}

export function ApprovalSection({
  title,
  description,
  emptyTitle,
  emptyDescription,
  items,
}: ApprovalSectionProps) {
  return (
    <Panel className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">{description}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const payload = item.payload as CorrectionPayload & {
              comment?: string | null;
            };
            const currentEntry = Array.isArray(payload.time_entries)
              ? payload.time_entries[0]
              : payload.time_entries;

            return (
              <Panel
                key={`${item.kind}-${item.id ?? item.dateLabel ?? item.employee?.name ?? "unbekannt"}`}
                className="space-y-4 border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                        {item.employee?.name ?? "Unbekannte Person"}
                      </h3>
                      <StatusChip
                        label={
                          item.kind === "correction"
                            ? "Korrektur"
                            : item.kind === "leave"
                              ? "Abwesenheit"
                              : "Zeiteintrag"
                        }
                        tone={
                          item.kind === "correction"
                            ? "warning"
                            : item.kind === "leave"
                              ? "info"
                              : "neutral"
                        }
                      />
                    </div>
                    <p className="text-sm text-[color:var(--color-text-soft)]">{renderDateLabel(item)}</p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      Offen {formatRelativeAge(item.age ?? null)}
                    </p>
                  </div>
                </div>

                {item.kind === "time" ? (
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[color:var(--color-text-soft)]">
                    <p>Projekt: {payload.projects?.name ?? "Nicht zugeordnet"}</p>
                    {hasAutoLegalBreak(payload.time_entry_breaks) ? (
                      <p>Gesetzliche Pause wurde automatisch ergänzt.</p>
                    ) : null}
                    Kommentar: {(payload.comment as string | null) || "Kein Kommentar hinterlegt."}
                  </div>
                ) : null}

                {item.kind === "leave" ? (
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[color:var(--color-text-soft)]">
                    Grund: {(payload.comment as string | null) || "Keine zusätzliche Begründung hinterlegt."}
                  </div>
                ) : null}

                {item.kind === "correction" ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[color:var(--color-text-soft)]">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                        Aktueller Stand
                      </p>
                      <p>Beginn {renderDateTime(currentEntry?.started_at)}</p>
                      <p>Ende {renderDateTime(currentEntry?.ended_at)}</p>
                      <p>Projekt {currentEntry?.projects?.name || "—"}</p>
                      <p>Kommentar {currentEntry?.comment || "—"}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[color:var(--color-text-soft)]">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                        Gewünschte Änderung
                      </p>
                      <p>Beginn {renderDateTime(payload.proposed_started_at)}</p>
                      <p>Ende {renderDateTime(payload.proposed_ended_at)}</p>
                      <p>Pause {(payload.proposed_break_minutes as number | null) ?? "--"} Min.</p>
                      <p>
                        Projekt{" "}
                        {payload.proposed_project_name
                          ? `${payload.proposed_project_name}${payload.proposed_project_code ? ` (${payload.proposed_project_code})` : ""}`
                          : payload.proposed_project_id || "—"}
                      </p>
                      <p>Kommentar {(payload.proposed_comment as string | null) || "—"}</p>
                    </div>
                  </div>
                ) : null}

                {item.issue ? <FormMessage message={item.issue} tone="error" /> : null}
                {!item.issue ? <ApprovalDecisionControls kind={item.kind} id={item.id} /> : null}
              </Panel>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
