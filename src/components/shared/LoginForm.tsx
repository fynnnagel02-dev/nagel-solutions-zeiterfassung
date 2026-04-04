"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FormMessage } from "@/src/components/shared/FormMessage";
import { createClient } from "@/src/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);

        startTransition(async () => {
          const client = createClient();
          const { error } = await client.auth.signInWithPassword({ email, password });

          if (error) {
            setMessage("Die Anmeldung ist fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.");
            return;
          }

          router.push("/");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--color-text)]" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm text-[color:var(--color-text)]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--color-text)]" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm text-[color:var(--color-text)]"
        />
      </div>

      <FormMessage message={message} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full justify-center rounded-2xl bg-[color:var(--color-sidebar)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Anmeldung läuft..." : "Anmelden"}
      </button>
    </form>
  );
}
