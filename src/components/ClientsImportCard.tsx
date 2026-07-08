"use client";

import { importClientsCsv } from "@/app/(app)/clients/actions";

export function ClientsImportCard({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <form action={importClientsCsv} className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-navy">Importer des clients (CSV)</h2>
        <p className="text-xs text-slate-500">
          Format détecté : Colonnes CRM existant (Contact principal, Courriel principal, etc.)
        </p>
      </div>
      <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <div>
          <label htmlFor="csvFile" className="label">
            Fichier CSV
          </label>
          <input
            id="csvFile"
            name="csvFile"
            type="file"
            accept=".csv,text/csv"
            required
            className="input"
          />
        </div>
        <button name="previewOnly" value="1" className="btn-secondary">
          Aperçu
        </button>
        <button className="btn-primary">Importer</button>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <label className="text-sm text-slate-600 inline-flex items-center gap-2">
          <input type="checkbox" name="clientOnly" defaultChecked />
          Importer uniquement les entrées de catégorie Client
        </label>
        <label className="text-sm text-slate-600 inline-flex items-center gap-2">
          <input type="checkbox" name="activeOnly" defaultChecked />
          Importer uniquement les fiches actives (Actif = Oui)
        </label>
      </div>
    </form>
  );
}
