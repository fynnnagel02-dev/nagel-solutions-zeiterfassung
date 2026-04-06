import Link from "next/link";

export default function InactivePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-shell)] px-4 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-[color:var(--color-border-strong)] bg-white p-8 shadow-[0_24px_56px_rgba(15,23,42,0.12)]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
            Zugriff pausiert
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
            Dieses Konto ist derzeit nicht aktiv.
          </h1>
          <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
            Für dieses Profil oder den verknüpften Mitarbeitendenstatus ist aktuell kein operativer Zugriff freigeschaltet. Bitte wenden Sie sich an Ihre Administration.
          </p>
          <Link
            href="/anmelden"
            className="inline-flex rounded-2xl bg-[color:var(--color-sidebar)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
