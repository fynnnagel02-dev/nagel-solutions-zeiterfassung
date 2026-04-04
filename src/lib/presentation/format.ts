const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
});

export function formatDate(value: string | Date) {
  return dateFormatter.format(typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value);
}

export function formatShortDate(value: string | Date) {
  return shortDateFormatter.format(typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value);
}

export function formatWeekdayShort(value: string | Date) {
  return weekdayFormatter.format(typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value).replace(".", "");
}

export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatClock(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatMinutes(totalMinutes: number | null | undefined) {
  if (totalMinutes === null || totalMinutes === undefined) {
    return "--";
  }

  return `${formatMinutesCompact(totalMinutes)} Std.`;
}

export function formatMinutesCompact(totalMinutes: number | null | undefined) {
  if (totalMinutes === null || totalMinutes === undefined) {
    return "--,--";
  }

  const sign = totalMinutes < 0 ? "-" : "";
  const absolute = Math.abs(totalMinutes);
  const decimalHours = absolute / 60;
  return `${sign}${decimalHours.toFixed(2).replace(".", ",")}`;
}

export function formatDeltaMinutes(totalMinutes: number | null | undefined) {
  if (totalMinutes === null || totalMinutes === undefined) {
    return "--";
  }

  const prefix = totalMinutes > 0 ? "+" : "";
  return `${prefix}${formatMinutes(totalMinutes).replace(" Std.", "")}`;
}

export function formatRelativeAge(value: string | null | undefined) {
  if (!value) {
    return "gerade eben";
  }

  const now = Date.now();
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round((now - timestamp) / 60_000));

  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min.`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `vor ${diffHours} Std.`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `vor ${diffDays} Tag${diffDays === 1 ? "" : "en"}`;
}

export function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return formatDate(startDate);
  }

  return `${formatShortDate(startDate)} - ${formatDate(endDate)}`;
}

export function parseHoursAndMinutes(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(":")) {
    const normalized = trimmed.replace(".", ":");
    const match = normalized.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
      return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }

  const normalized = trimmed.replace(",", ".");
  const valueAsNumber = Number(normalized);

  if (Number.isNaN(valueAsNumber) || valueAsNumber < 0) {
    return null;
  }

  return Math.round(valueAsNumber * 60);
}

export function minutesToInputValue(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) {
    return "";
  }

  return formatMinutesCompact(minutes);
}

export function getMonthOptions(localeYear = new Date().getFullYear()) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(localeYear, index, 1));
    return {
      value: index + 1,
      label: monthFormatter.format(date).replace(/^\w/, (value) => value.toUpperCase()),
    };
  });
}
