"use client";

import { useEffect, useRef, useState } from "react";

export function ConfirmActionForm({
  action,
  buttonLabel,
  buttonClassName,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
}: {
  action: (formData: FormData) => void | Promise<void>;
  buttonLabel: string;
  buttonClassName: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
      <form ref={formRef} action={action}>
        <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>
          {buttonLabel}
        </button>
      </form>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl p-5">
            <h3 className="text-lg font-semibold text-navy">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{message}</p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
