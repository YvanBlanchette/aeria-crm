import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { importClientsCsv } from "./actions";
import { ClientsTable } from "@/components/ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: {
    view?: string;
    imported?: string;
    updated?: string;
    skipped?: string;
    importError?: string;
    preview?: string;
    archived?: string;
  };
}) {
  await requireUser();
  const view = searchParams.view === "archived" || searchParams.view === "all" ? searchParams.view : "active";
  const imported = Number(searchParams.imported ?? 0);
  const updated = Number(searchParams.updated ?? 0);
  const skipped = Number(searchParams.skipped ?? 0);
  const isPreview = searchParams.preview === "1";
  const hasImportResult = searchParams.imported !== undefined || searchParams.updated !== undefined || searchParams.skipped !== undefined;

  const where =
    view === "archived"
      ? { archivedAt: { not: null as Date | null } }
      : view === "all"
        ? undefined
        : { archivedAt: null as Date | null };

  const clients = await prisma.client.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { bookings: true } } },
    take: 1000,
  });

  const rows = clients.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email ?? "",
    phone: c.phone ?? "",
    passportNumber: c.passportNumber ?? "",
    passportExpiringSoon:
      !!c.passportExpiry && c.passportExpiry < new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
    bookingsCount: c._count.bookings,
    updatedAtLabel: fmtDate(c.updatedAt),
    isArchived: !!c.archivedAt,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-navy">Clients</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <a href="/api/clients/export" className="btn-secondary">Exporter CSV</a>
          <Link href="/clients/new" className="btn-primary">+ Nouveau client</Link>
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

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/clients?view=active" className={`badge ${view === "active" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}>Actifs</Link>
        <Link href="/clients?view=archived" className={`badge ${view === "archived" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}>Archives</Link>
        <Link href="/clients?view=all" className={`badge ${view === "all" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}>Tous</Link>
      </div>

      {hasImportResult && (
        <p className={`text-sm rounded-lg px-4 py-3 border ${isPreview ? "text-ocean-700 bg-ocean-50 border-ocean-200" : "text-emerald-800 bg-emerald-50 border-emerald-200"}`}>
          {isPreview ? "Aperçu import" : "Import terminé"} : {imported} créé(s), {updated} mis à jour, {skipped} ignoré(s).
        </p>
      )}

      <form action={importClientsCsv} className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-navy">Importer des clients (CSV)</h2>
          <p className="text-xs text-slate-500">Format détecté : Colonnes CRM existant (Contact principal, Courriel principal, etc.)</p>
        </div>
        <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label htmlFor="csvFile" className="label">Fichier CSV</label>
            <input id="csvFile" name="csvFile" type="file" accept=".csv,text/csv" required className="input" />
          </div>
          <button name="previewOnly" value="1" className="btn-secondary">Aperçu</button>
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

      <ClientsTable rows={rows} />
    </div>
  );
}
