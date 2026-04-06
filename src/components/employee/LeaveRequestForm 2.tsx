"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelLeaveRequest, createLeaveRequest } from "@/app/actions/leave";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { isDemoActionResult, getActionMessage } from "@/src/lib/demo/client";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

export function LeaveRequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<"vacation" | "sick" | "medical" | "other">("vacation");
  const [durationMode, setDurationMode] = useState<"full_day" | "partial_day">("full_day");
  const [partialStartTime, setPartialStartTime] = useState("08:00");
  const [partialEndTime, setPartialEndTime] = useState("12:00");
  const [comment, setComment] = useState("");
  const supportsPartialDay = leaveType !== "vacation";
  const isPartialDay = supportsPartialDay && durationMode === "partial_day";

  useEffect(() => {
    if (isPartialDay && startDate && endDate !== startDate) {
      setEndDate(startDate);
    }
  }, [endDate, isPartialDay, startDate]);

  function handleLeaveTypeChange(nextLeaveType: "vacation" | "sick" | "medical" | "other") {
    setLeaveType(nextLeaveType);

    if (nextLeaveType === "vacation") {
      setDurationMode("full_day");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Von</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bis</label>
          <input
            type="date"
            value={endDate}
            disabled={isPartialDay}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          />
          {isPartialDay ? (
            <p className="text-xs text-[color:var(--color-text-muted)]">
              Halbtägige Abwesenheiten gelten immer für genau einen Kalendertag.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Art</label>
          <select
            value={leaveType}
            onChange={(event) =>
              handleLeaveTypeChange(
                event.target.value as "vacation" | "sick" | "medical" | "other"
              )
            }
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            <option value="vacation">Urlaub</option>
            <option value="sick">Krank</option>
            <option value="medical">Arzt Besuch</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Dauer</label>
          <select
            value={durationMode}
            disabled={!supportsPartialDay}
            onChange={(event) =>
              setDurationMode(event.target.value as "full_day" | "partial_day")
            }
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            <option value="full_day">Ganzer Tag</option>
            {supportsPartialDay ? <option value="partial_day">Halbtags</option> : null}
          </select>
          {!supportsPartialDay ? (
            <p className="text-xs text-[color:var(--color-text-muted)]">
              Urlaub ist in dieser Version nur ganztägig möglich.
            </p>
          ) : null}
        </div>
      </div>

      {isPartialDay ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Von Uhrzeit</label>
            <input
              type="time"
              value={partialStartTime}
              onChange={(event) => setPartialStartTime(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bis Uhrzeit</label>
            <input
              type="time"
              value={partialEndTime}
              onChange={(event) => setPartialEndTime(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium">Kommentar</label>
        <textarea
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
        />
      </div>

      <Button
        type="button"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          setSuccess(null);

          startTransition(async () => {
            try {
              const result = await createLeaveRequest({
                leaveType,
                startDate,
                endDate,
                durationMode,
                partialStartTime: isPartialDay ? partialStartTime : null,
                partialEndTime: isPartialDay ? partialEndTime : null,
                comment: comment || null,
              });
              setSuccess(getActionMessage(result, "Abwesenheit beantragt."));
              setStartDate("");
              setEndDate("");
              setDurationMode("full_day");
              setComment("");
              if (!isDemoActionResult(result)) {
                router.refresh();
              }
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          });
        }}
      >
        {isPending ? "Wird gespeichert..." : "Abwesenheit beantragen"}
      </Button>

      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </div>
  );
}

export function CancelLeaveButton({ leaveRequestId }: { leaveRequestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success">("success");

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await cancelLeaveRequest({ leaveRequestId });
              setTone("success");
              setMessage(getActionMessage(result, "Abwesenheit wurde storniert."));
              if (!isDemoActionResult(result)) {
                router.refresh();
              }
            } catch (error) {
              setTone("error");
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        {isPending ? "Wird storniert..." : "Stornieren"}
      </Button>
      <FormMessage message={message} tone={tone} />
    </div>
  );
}
