export const GERMAN_STATE_OPTIONS = [
  { code: "DE-BW", label: "Baden-Wuerttemberg" },
  { code: "DE-BY", label: "Bayern" },
  { code: "DE-BE", label: "Berlin" },
  { code: "DE-BB", label: "Brandenburg" },
  { code: "DE-HB", label: "Bremen" },
  { code: "DE-HH", label: "Hamburg" },
  { code: "DE-HE", label: "Hessen" },
  { code: "DE-MV", label: "Mecklenburg-Vorpommern" },
  { code: "DE-NI", label: "Niedersachsen" },
  { code: "DE-NW", label: "Nordrhein-Westfalen" },
  { code: "DE-RP", label: "Rheinland-Pfalz" },
  { code: "DE-SL", label: "Saarland" },
  { code: "DE-SN", label: "Sachsen" },
  { code: "DE-ST", label: "Sachsen-Anhalt" },
  { code: "DE-SH", label: "Schleswig-Holstein" },
  { code: "DE-TH", label: "Thueringen" },
] as const;

export const ALL_GERMAN_STATE_CODES = GERMAN_STATE_OPTIONS.map((state) => state.code);

export function getStateLabel(code: string) {
  return GERMAN_STATE_OPTIONS.find((state) => state.code === code)?.label ?? code;
}
