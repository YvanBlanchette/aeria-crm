"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { revealClientPassport } from "@/app/(app)/clients/actions";

export function PassportReveal({
  clientId,
  hasValue,
  compact = false,
  onCopy,
}: {
  clientId: string;
  hasValue: boolean;
  compact?: boolean;
  onCopy?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passportNumber, setPassportNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!hasValue) {
    return <span className="text-slate-400">—</span>;
  }

  const revealed = passportNumber !== null;

  async function copyPassportNumber() {
    if (!passportNumber) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(passportNumber);
      ok = true;
    } catch {
      const temp = document.createElement("textarea");
      temp.value = passportNumber;
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      ok = document.execCommand("copy");
      temp.remove();
    }
    if (ok) {
      onCopy?.(passportNumber);
      setCopied(true);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("password", password);
    const result = await revealClientPassport(clientId, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setPassportNumber(result.passportNumber ?? null);
    setLoading(false);
    setOpen(false);
  }

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${compact ? "text-sm" : ""}`}>
        {revealed ? (
          <button
            type="button"
            className="font-medium text-slate-700 hover:text-ocean text-left"
            onClick={copyPassportNumber}
            title="Cliquer pour copier"
          >
            {passportNumber}
          </button>
        ) : (
          <span className="text-slate-500">Passeport protégé</span>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-500 hover:text-ocean hover:border-ocean/40"
          onClick={() => (revealed ? setPassportNumber(null) : setOpen(true))}
          aria-label={revealed ? "Masquer le passeport" : "Déverrouiller le passeport"}
          title={revealed ? "Masquer" : "Déverrouiller"}
        >
          <Lock className="h-4 w-4" />
        </button>
        {copied && <span className="text-[11px] text-emerald-700">Copié</span>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl p-5">
            <h3 className="text-lg font-semibold text-navy">Déverrouiller le passeport</h3>
            <p className="mt-2 text-sm text-slate-600">
              Saisissez votre mot de passe pour afficher cette donnée sensible.
            </p>

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              <div>
                <label className="label" htmlFor={`passport-password-${clientId}`}>
                  Mot de passe
                </label>
                <input
                  id={`passport-password-${clientId}`}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Vérification..." : "Déverrouiller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
