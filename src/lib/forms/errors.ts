import { AppError } from "@/src/lib/security/errors";

export function toGermanErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    switch (error.code) {
      case "AUTHENTICATION_REQUIRED":
        return "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.";
      case "FORBIDDEN":
        return "Für diese Aktion fehlt die Berechtigung.";
      case "VALIDATION_ERROR":
        return "Die Eingaben sind nicht vollständig oder ungültig.";
      case "NOT_FOUND":
        return "Der angeforderte Datensatz wurde nicht gefunden.";
      case "CONFLICT":
        return error.message;
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Die Aktion konnte gerade nicht ausgeführt werden.";
}
