"use client";

import { useEffect, useRef, useState } from "react";

export function ResetUserPasswordModal({
  userLabel,
  action,
  returnTab = "team",
}: {
  userLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  returnTab?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" className="btn-secondary text-xs" onClick={() => setOpen(true)}>
        Réinitialiser
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl p-5">
            <h3 className="text-lg font-semibold text-navy">Réinitialiser le mot de passe</h3>
            <p className="mt-2 text-sm text-slate-600">Utilisateur: {userLabel}</p>

            <form ref={formRef} action={action} className="mt-4 space-y-3">
              <input type="hidden" name="returnTab" value={returnTab} />
              <div>
                <label className="label" htmlFor="reset-newPassword">
                  Nouveau mot de passe
                </label>
                <input
                  id="reset-newPassword"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="reset-confirmPassword">
                  Confirmer le mot de passe
                </label>
                <input
                  id="reset-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  required
                  className="input"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    formRef.current?.requestSubmit();
                    setOpen(false);
                  }}
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
