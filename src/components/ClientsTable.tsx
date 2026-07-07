"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PassportReveal } from "@/components/PassportReveal";
import { ConfirmActionForm } from "@/components/ConfirmActionForm";
import { fmtDate } from "@/lib/format";
import { FilterableTable, type FilterableColumn } from "@/components/FilterableTable";
import { Eye, Pencil, RotateCcw } from "lucide-react";

type ClientRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasPassportNumber: boolean;
  passportExpiry: string;
  updatedAtLabel: string;
  isArchived: boolean;
};

function isPassportExpiringSoon(passportExpiry: string) {
  if (!passportExpiry) return false;
  return new Date(passportExpiry) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
}

async function copyTextToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to legacy path
  }

  try {
    const temp = document.createElement("textarea");
    temp.value = value;
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    const ok = document.execCommand("copy");
    temp.remove();
    return ok;
  } catch {
    return false;
  }
}

export function ClientsTable({
  className,
  rows,
  archiveAction,
  restoreAction,
}: {
  className?: string;
  rows: ClientRow[];
  archiveAction: (id: string, formData: FormData) => void | Promise<void>;
  restoreAction: (id: string) => void | Promise<void>;
}) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const columns = useMemo<FilterableColumn<ClientRow>[]>(
    () => [
      {
        id: "name",
        header: "Nom",
        getValue: (row) => `${row.firstName} ${row.lastName}`,
        renderCell: (row) => (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-left font-medium text-navy hover:text-ocean"
            onClick={async () => {
              await copyTextToClipboard(`${row.firstName} ${row.lastName}`);
              setToast("Nom copié dans le presse-papiers");
            }}
            title="Cliquer pour copier"
          >
            <span>{row.firstName} {row.lastName}</span>
            {row.isArchived && <span className="badge bg-slate-200 text-slate-700">Archive</span>}
          </button>
        ),
      },
      {
        id: "email",
        header: "Courriel",
        getValue: (row) => row.email,
        renderCell: (row) => (
          <button
            type="button"
            className="w-full text-left text-slate-600 hover:text-ocean"
            onClick={async () => {
              await copyTextToClipboard(row.email);
              setToast("Courriel copié dans le presse-papiers");
            }}
            title="Cliquer pour copier"
          >
            {row.email || "-"}
          </button>
        ),
      },
      {
        id: "phone",
        header: "Telephone",
        getValue: (row) => row.phone,
        renderCell: (row) => (
          <button
            type="button"
            className="w-full text-left text-slate-600 hover:text-ocean"
            onClick={async () => {
              await copyTextToClipboard(row.phone);
              setToast("Téléphone copié dans le presse-papiers");
            }}
            title="Cliquer pour copier"
          >
            {row.phone || "-"}
          </button>
        ),
      },
      {
        id: "passport",
        header: "Passeport",
        getValue: (row) => row.hasPassportNumber,
        renderCell: (row) => (
          <PassportReveal
            clientId={row.id}
            hasValue={row.hasPassportNumber}
            compact
            onCopy={() => {
              setToast("Passeport copié dans le presse-papiers");
            }}
          />
        ),
      },
      {
        id: "passportExpiry",
        header: "Expiration du passeport",
        getValue: (row) => row.passportExpiry,
        renderCell: (row) =>
          row.passportExpiry ? (
            <button
              type="button"
              className="w-full text-left text-slate-600 hover:text-ocean"
              onClick={async () => {
                await copyTextToClipboard(fmtDate(row.passportExpiry));
                setToast("Date d'expiration copiée dans le presse-papiers");
              }}
              title="Cliquer pour copier"
            >
              <span>
                {fmtDate(row.passportExpiry)}
                {isPassportExpiringSoon(row.passportExpiry) && (
                  <span className="badge bg-amber-100 text-amber-800 ml-2">Expire bientot</span>
                )}
              </span>
            </button>
          ) : (
            <span className="text-slate-600">-</span>
          ),
        searchable: false,
      },
      {
        id: "updatedAtLabel",
        header: "Mis a jour",
        getValue: (row) => row.updatedAtLabel,
        renderCell: (row) => (
          <button
            type="button"
            className="w-full text-left text-slate-500 hover:text-ocean"
            onClick={async () => {
              await copyTextToClipboard(row.updatedAtLabel);
              setToast("Date de mise à jour copiée dans le presse-papiers");
            }}
            title="Cliquer pour copier"
          >
            {row.updatedAtLabel}
          </button>
        ),
        searchable: false,
      },
      {
        id: "actions",
        header: "Actions",
        getValue: () => "",
        searchable: false,
        sortable: false,
        cellClassName: "whitespace-nowrap",
        renderCell: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/clients/${row.id}`} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:text-ocean hover:border-ocean/40">
              <Eye className="h-3.5 w-3.5" />
              Voir
            </Link>
            <Link href={`/clients/${row.id}?edit=1`} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:text-ocean hover:border-ocean/40">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Link>
            {row.isArchived ? (
              <form action={restoreAction.bind(null, row.id)}>
                <button type="submit" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:border-emerald-300">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réactiver
                </button>
              </form>
            ) : (
              <ConfirmActionForm
                action={archiveAction.bind(null, row.id)}
                buttonLabel="Archiver"
                buttonClassName="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:text-red-700 hover:border-red-300"
                title="Archiver ce contact client ?"
                message="Le contact sera retiré des listes actives, sans perte d'historique."
                confirmLabel="Oui, archiver"
              />
            )}
          </div>
        ),
      },
    ],
    [archiveAction, restoreAction],
  );

  return (
    <>
      <FilterableTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage="Aucun client. Ajoutez votre premier client pour commencer."
        globalSearchPlaceholder="Rechercher nom, courriel, telephone, passeport..."
        className={className}
      />
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
