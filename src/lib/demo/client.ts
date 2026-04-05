type DemoActionResult = {
  simulated: true;
  message: string;
  tone?: "warning" | "info";
  kind?: string;
};

export function isDemoActionResult(value: unknown): value is DemoActionResult {
  return Boolean(
    value &&
      typeof value === "object" &&
      "simulated" in value &&
      "message" in value &&
      (value as { simulated?: unknown }).simulated === true
  );
}

export function getActionMessage(result: unknown, fallback: string) {
  return isDemoActionResult(result) ? result.message : fallback;
}

export function getActionTone(
  result: unknown,
  fallback: "error" | "success" | "warning" = "success"
) {
  if (!isDemoActionResult(result)) {
    return fallback;
  }

  return "warning" as const;
}

export function getActionSuccessTone(result: unknown): "success" | "warning" {
  return isDemoActionResult(result) ? "warning" : "success";
}
