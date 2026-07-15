"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import Logo from "@/components/logo";
import { signup } from "./actions";
import { FiCheckCircle, FiShield, FiUsers } from "react-icons/fi";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      {pending ? "Creation du compte..." : "Creer mon compte"}
    </button>
  );
}

export default function SignUpPage() {
  const [state, formAction] = useFormState(signup, undefined);

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy via-navy-700 to-ocean p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center">
        <section className="hidden w-1/2 pr-8 text-white lg:block">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/90">
            Espace collaborateur
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight">
            Creez votre acces et commencez a piloter vos dossiers.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Rejoignez votre equipe sur AERIA CRM pour suivre les clients, coordonner les
            reservations et garder une vision claire de vos prochaines ventes.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <FiShield className="mt-0.5 shrink-0" />
              Acces securise avec session chiffree et protection des donnees voyageurs.
            </li>
            <li className="flex items-start gap-2">
              <FiUsers className="mt-0.5 shrink-0" />
              Collaboration simple entre agents, operations et responsables d'agence.
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="mt-0.5 shrink-0" />
              Onboarding rapide pour etre operationnel des votre premiere connexion.
            </li>
          </ul>
        </section>

        <section className="w-full lg:w-1/2">
          <div className="card mx-auto w-full max-w-md border-white/40 bg-white/95 p-6 shadow-xl backdrop-blur">
            <div className="mb-2 text-center">
              <Logo variant="black" href="/signup" className="justify-center" />
            </div>

            <h2 className="text-center text-xl font-semibold text-navy">Inscription</h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Creez votre acces CRM en quelques secondes.
            </p>

            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Nom complet
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="input"
                  placeholder="Votre nom"
                />
              </div>

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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input"
                  placeholder="Minimum 8 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input"
                  placeholder="Retapez le mot de passe"
                />
              </div>

              {state?.error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </p>
              )}

              <SubmitButton />
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Vous avez deja un compte?
              <Link href="/signin" className="ml-2 font-medium text-ocean hover:underline">
                Retour a la connexion
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
