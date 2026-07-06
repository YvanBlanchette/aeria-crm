import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, BOOKING_STATUS_LABELS } from "@/lib/format";
import { updateClient, deleteClient } from "../actions";
import { ClientForm } from "@/components/ClientForm";

export const dynamic = "force-dynamic";

export default async function ClientDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string; error?: string };
}) {
  await requireUser();
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      bookings: { orderBy: { sailingDate: "desc" }, include: { itinerary: { include: { ship: true } } } },
      leads: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!client) notFound();

  const editing = searchParams.edit === "1";
  const updateAction = updateClient.bind(null, client.id);
  const deleteAction = deleteClient.bind(null, client.id);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/clients" className="text-sm text-slate-500 hover:text-ocean">← Clients</Link>
          <h1 className="text-2xl font-bold text-navy mt-1">
            {client.firstName} {client.lastName}
          </h1>
        </div>
        <div className="flex gap-2">
          {!editing && <Link href={`/clients/${client.id}?edit=1`} className="btn-secondary">Modifier</Link>}
          <form action={deleteAction}>
            <button className="btn-danger">Supprimer</button>
          </form>
        </div>
      </div>

      {searchParams.error === "has-bookings" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Ce client a des réservations : supprimez-les d&apos;abord, ou conservez la fiche pour l&apos;historique.
        </p>
      )}

      {editing ? (
        <ClientForm client={client} action={updateAction} submitLabel="Enregistrer" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <section className="card p-5 space-y-3">
            <h2 className="font-semibold text-navy">Coordonnées</h2>
            <dl className="text-sm space-y-2">
              <div><dt className="label">Courriel</dt><dd>{client.email ?? "—"}</dd></div>
              <div><dt className="label">Téléphone</dt><dd>{client.phone ?? "—"}</dd></div>
              <div><dt className="label">Adresse</dt><dd>{client.address ?? "—"}</dd></div>
              <div><dt className="label">Date de naissance</dt><dd>{fmtDate(client.dateOfBirth)}</dd></div>
            </dl>
          </section>
          <section className="card p-5 space-y-3">
            <h2 className="font-semibold text-navy">Documents de voyage</h2>
            <dl className="text-sm space-y-2">
              <div><dt className="label">Nationalité</dt><dd>{client.nationality ?? "—"}</dd></div>
              <div><dt className="label">Passeport</dt><dd>{client.passportNumber ?? "—"}</dd></div>
              <div>
                <dt className="label">Expiration</dt>
                <dd>
                  {fmtDate(client.passportExpiry)}
                  {client.passportExpiry && client.passportExpiry < new Date(Date.now() + 1000 * 60 * 60 * 24 * 180) && (
                    <span className="badge bg-amber-100 text-amber-800 ml-2">Expire dans moins de 6 mois</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>
          <section className="card p-5 space-y-3">
            <h2 className="font-semibold text-navy">Préférences &amp; notes</h2>
            <dl className="text-sm space-y-2">
              <div><dt className="label">Préférences croisière</dt><dd className="whitespace-pre-wrap">{client.preferences ?? "—"}</dd></div>
              <div><dt className="label">Notes internes</dt><dd className="whitespace-pre-wrap">{client.notes ?? "—"}</dd></div>
            </dl>
          </section>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Historique des croisières</h2>
          <Link href={`/bookings/new?clientId=${client.id}`} className="btn-primary text-xs">+ Réservation</Link>
        </div>
        {client.bookings.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aucune réservation pour ce client.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Référence</th>
                <th className="table-th">Croisière</th>
                <th className="table-th">Départ</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link href={`/bookings/${b.id}`} className="font-medium text-ocean hover:underline">{b.reference}</Link>
                  </td>
                  <td className="table-td text-slate-600">
                    {b.itinerary?.name ?? "—"}{b.itinerary?.ship ? ` · ${b.itinerary.ship.name}` : ""}
                  </td>
                  <td className="table-td">{fmtDate(b.sailingDate)}</td>
                  <td className="table-td">{fmtMoney(b.totalPrice)}</td>
                  <td className="table-td">{BOOKING_STATUS_LABELS[b.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
