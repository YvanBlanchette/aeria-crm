"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { FiCheckCircle, FiShield, FiTrendingUp } from "react-icons/fi";
import Logo from "@/components/logo";
import { signin } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Connexion..." : "Se connecter"}
    </button>
  );
}

export default function SignInView() {
  const [state, formAction] = useFormState(signin, undefined);

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy via-navy-700 to-ocean p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center">
        <section className="hidden w-1/2 pr-8 text-white lg:block">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/90">
            Plateforme interne
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight">
            Naviguez vos ventes de voyages avec précision.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Accédez à votre cockpit AERIA pour suivre clients, réservations, paiements et
            performance agence.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <FiShield className="mt-0.5 shrink-0" />
              Espace sécurisé avec session chiffrée et contrôle des accès.
            </li>
            <li className="flex items-start gap-2">
              <FiTrendingUp className="mt-0.5 shrink-0" />
              Vue centralisée des opportunités, départs et encaissements.
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="mt-0.5 shrink-0" />
              Process collaboratif pour équipes agences et opérations.
            </li>
          </ul>
        </section>

        <section className="w-full lg:w-1/2">
          <div className="card mx-auto w-full max-w-md border-white/40 bg-white/95 p-6 shadow-xl backdrop-blur">
            <div className="mb-4 text-center">
              <Logo variant="black" href="/signin" className="justify-center" />
            </div>
            <h2 className="text-xl font-semibold text-navy">Connexion</h2>
            <p className="mt-1 text-sm text-slate-500">
              Entrez vos identifiants pour accéder au CRM.
            </p>

            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Courriel
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="vous@aeria-voyages.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              {state?.error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </p>
              )}

              <SubmitButton />
            </form>

            <p className="mt-4 text-center text-xs text-slate-500">
              Vous n'avez pas encore de compte?
              <Link href="/signup" className="ml-2 font-medium text-ocean hover:underline">
                Créez votre compte ici.
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
