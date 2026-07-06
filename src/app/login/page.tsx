"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "./actions";
import Logo from "@/components/logo";
import Link from "next/link";
import { FiCheckCircle, FiShield, FiTrendingUp } from "react-icons/fi";

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
    <main className="min-h-screen bg-gradient-to-br from-navy via-navy-700 to-ocean p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center">
        {/* BRAND PANEL */}
        <section className="hidden w-1/2 pr-8 text-white lg:block">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/90">
            Plateforme interne
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight">
            Pilotez vos ventes croisiere avec precision.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Accedez a votre cockpit AERIA pour suivre clients, reservations, paiements et performance agence.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <FiShield className="mt-0.5 shrink-0" />
              Espace securise avec session chiffree et controle des acces.
            </li>
            <li className="flex items-start gap-2">
              <FiTrendingUp className="mt-0.5 shrink-0" />
              Vue centralisee des opportunites, departs et encaissements.
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="mt-0.5 shrink-0" />
              Process collaboratif pour equipes agences et operations.
            </li>
          </ul>
        </section>

        {/* AUTH CARD */}
        <section className="w-full lg:w-1/2">
          <div className="card mx-auto w-full max-w-md border-white/40 bg-white/95 p-6 shadow-xl backdrop-blur">
            <div className="mb-2 text-center">
              <Logo variant="black" href="/login" className="justify-center" />
            </div>
            <h2 className="text-center text-xl font-semibold text-navy">Connexion</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Entrez vos identifiants pour acceder au CRM.</p>

            <form action={formAction} className="mt-5 space-y-4">
              {/* CREDENTIALS */}
              <div>
                <label htmlFor="email" className="label">Courriel</label>
                <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="vous@aeria-voyages.com" />
              </div>
              <div>
                <label htmlFor="password" className="label">Mot de passe</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="input" placeholder="••••••••" />
              </div>

              {/* FEEDBACK */}
              {state?.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

              {/* SUBMIT */}
              <SubmitButton />
            </form>

            <p className="mt-4 text-center text-xs text-slate-500">
              Route alternative: <Link href="/signin" className="font-medium text-ocean hover:underline">/signin</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
