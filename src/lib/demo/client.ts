type DemoActionResult = {
  simulated: true;
  message: string;
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
