"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, undefined);
  return (
    <main className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2" aria-hidden>⚓</div>
          <h1 className="text-2xl font-bold text-white">ÆRIA CRM</h1>
          <p className="text-slate-400 text-sm mt-1">Votre agence croisières, à bon port.</p>
        </div>
        <form action={formAction} className="card p-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">Courriel</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
