import { LoginForm } from "@/src/components/shared/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-shell)] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-[color:var(--color-border-strong)] bg-white p-8 shadow-[0_24px_56px_rgba(15,23,42,0.12)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
            Nagel Solutions
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
            Zeiterfassung
          </h1>
          <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
            Melden Sie sich mit Ihrem Unternehmenszugang an, um Zeiten, Freigaben und Stammdaten sicher im geschützten Bereich zu bearbeiten.
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
