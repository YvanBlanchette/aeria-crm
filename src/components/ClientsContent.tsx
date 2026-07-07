"use client";

import { useState } from "react";
import Link from "next/link";
import { ClientsImportButton } from "@/components/ClientsImportButton";
import { ClientsImportCard } from "@/components/ClientsImportCard";
import { ClientsTable } from "@/components/ClientsTable";

export function ClientsContent({
  searchParams,
  rows,
  view,
  archiveAction,
  restoreAction,
}: {
  searchParams: any;
  rows: any[];
  view: string;
  archiveAction: (id: string, formData: FormData) => void | Promise<void>;
  restoreAction: (id: string) => void | Promise<void>;
}) {
  const [showImport, setShowImport] = useState(false);
  const imported = Number(searchParams.imported ?? 0);
  const updated = Number(searchParams.updated ?? 0);
  const skipped = Number(searchParams.skipped ?? 0);
  const isPreview = searchParams.preview === "1";
  const hasImportResult = searchParams.imported !== undefined || searchParams.updated !== undefined || searchParams.skipped !== undefined;

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/clients?view=active" className={`badge ${view === "active" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}>Actifs</Link>
          <Link href="/clients?view=archived" className={`badge ${view === "archived" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}>Archives</Link>
          <Link href="/clients?view=all" className={`badge ${view === "all" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}>Tous</Link>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <ClientsImportButton
            showImport={showImport}
            onToggle={() => setShowImport(!showImport)}
            />
          <a href="/api/clients/export" className="btn-secondary">Exporter CSV</a>
        </div>
        
      </div>

      {searchParams.importError === "file" && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Import impossible : sélectionnez un fichier CSV valide.
        </p>
      )}

      {searchParams.archived === "1" && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Contact archive avec succes. Vous pouvez le restaurer a tout moment.
        </p>
      )}

      {/* IMPORT CARD */}
      <ClientsImportCard show={showImport} />



      {hasImportResult && (
        <p className={`text-sm rounded-lg px-4 py-3 border ${isPreview ? "text-ocean-700 bg-ocean-50 border-ocean-200" : "text-emerald-800 bg-emerald-50 border-emerald-200"}`}>
          {isPreview ? "Aperçu import" : "Import terminé"} : {imported} créé(s), {updated} mis à jour, {skipped} ignoré(s).
        </p>
      )}

      <ClientsTable rows={rows} archiveAction={archiveAction} restoreAction={restoreAction} className="h-[calc(100vh-200px)]" />
    </>
  );
}
