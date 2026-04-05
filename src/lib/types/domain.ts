export type AppRole = "employee" | "team_lead" | "admin";

export type TimeEntryStatus =
  | "open"
  | "complete"
  | "in_review"
  | "approved"
  | "rejected"
  | "corrected";

export type ApprovalStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export type TimeEntrySource = "live" | "manual" | "correction";
export type BreakSource = "live" | "manual" | "auto_legal";
export type ChangeRequestStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type LeaveType = "vacation" | "sick" | "medical" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type ApprovalDecision = "approved" | "rejected";
export type DayPart = "full" | "morning" | "afternoon";
export type LeaveDurationMode = "full_day" | "partial_day";
export type ExportType =
  | "monthly_timesheet"
  | "absence_report"
  | "team_overview"
  | "project_time_report";
export type ExportStatus = "pending" | "completed" | "failed";

export type SessionContext = {
  authUserId: string;
  profile: {
    id: string;
    role: AppRole;
    isActive: boolean;
  };
  employee: {
    id: string;
    teamId: string | null;
    workScheduleId: string | null;
    isActive: boolean;
    targetDailyMinutesOverride: number | null;
    targetWeeklyMinutesOverride: number | null;
  } | null;
  runtime: {
    mode: "real" | "demo";
    basePath: string;
    role: AppRole;
    embed: boolean;
  };
};

export type CompanyContextDto = {
  companyName: string;
  timezone: string;
  holidayRegionCode: string;
  defaultAnnualLeaveDays: number;
};

export type TimeEntryBreakRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  source: BreakSource;
};

export type TimeEntryRow = {
  id: string;
  employee_id: string;
  entry_date: string;
  started_at: string | null;
  ended_at: string | null;
  status: TimeEntryStatus;
  approval_status: ApprovalStatus;
  source: TimeEntrySource;
  project_id: string | null;
  comment: string | null;
  submitted_at: string | null;
  locked_at: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  time_entry_breaks?: TimeEntryBreakRow[];
};

export type LeaveBalanceSnapshot = {
  entitlementDays: number;
  carriedOverDays: number;
  adjustmentDays: number;
  approvedTakenDays: number;
  pendingRequestedDays: number;
  availableDays: number;
};
