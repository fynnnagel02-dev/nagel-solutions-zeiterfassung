"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelLeaveRequest, createLeaveRequest } from "@/app/actions/leave";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

export function LeaveRequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<"vacation" | "sick" | "other">("vacation");
  const [startDayPart, setStartDayPart] = useState<"full" | "morning" | "afternoon">("full");
  const [endDayPart, setEndDayPart] = useState<"full" | "morning" | "afternoon">("full");
  const [comment, setComment] = useState("");

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
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Art</label>
          <select
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value as "vacation" | "sick" | "other")}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            <option value="vacation">Urlaub</option>
            <option value="sick">Krank</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Start-Tagesanteil</label>
          <select
            value={startDayPart}
            onChange={(event) => setStartDayPart(event.target.value as "full" | "morning" | "afternoon")}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            <option value="full">Ganzer Tag</option>
            <option value="morning">Vormittag</option>
            <option value="afternoon">Nachmittag</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ende-Tagesanteil</label>
          <select
            value={endDayPart}
            onChange={(event) => setEndDayPart(event.target.value as "full" | "morning" | "afternoon")}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            <option value="full">Ganzer Tag</option>
            <option value="morning">Vormittag</option>
            <option value="afternoon">Nachmittag</option>
          </select>
        </div>
      </div>

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
              await createLeaveRequest({
                leaveType,
                startDate,
                endDate,
                startDayPart,
                endDayPart,
                comment: comment || null,
              });
              setSuccess("Abwesenheit beantragt.");
              setStartDate("");
              setEndDate("");
              setComment("");
              router.refresh();
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

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await cancelLeaveRequest({ leaveRequestId });
          router.refresh();
        })
      }
    >
      {isPending ? "Wird storniert..." : "Stornieren"}
    </Button>
  );
}
