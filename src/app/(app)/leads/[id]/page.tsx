import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, LEAD_STATUS_LABELS } from "@/lib/format";
import { updateLeadStatus, addActivity, deleteLead, convertLead } from "../actions";

export const dynamic = "force-dynamic";

const ACTIVITY_LABELS: Record<string, string> = {
  NOTE: "Note",
  CALL: "Appel",
  EMAIL: "Courriel",
  MEETING: "Rendez-vous",
};

export default async function LeadDetail({ params }: { params: { id: string } }) {
  await requireUser();
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      assignedTo: { select: { name: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!lead) notFound();

  const statusAction = updateLeadStatus.bind(null, lead.id);
  const activityAction = addActivity.bind(null, lead.id);
  const deleteAction = deleteLead.bind(null, lead.id);
  const convertAction = convertLead.bind(null, lead.id);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/leads" className="text-sm text-slate-500 hover:text-ocean">← Pipeline</Link>
          <h1 className="text-2xl font-bold text-navy mt-1">{lead.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Créé le {fmtDate(lead.createdAt)}
            {lead.assignedTo ? ` · Assigné à ${lead.assignedTo.name}` : ""}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <form action={statusAction} className="flex items-center gap-2">
            <label htmlFor="status" className="sr-only">Statut</label>
            <select id="status" name="status" defaultValue={lead.status} className="input w-auto">
              {Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button className="btn-secondary">Changer</button>
          </form>
          {lead.status !== "WON" && (
            <form action={convertAction}>
              <button className="btn-primary">Gagné → réserver</button>
            </form>
          )}
          <form action={deleteAction}>
            <button className="btn-danger">Supprimer</button>
          </form>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="card p-5 space-y-3 lg:col-span-1">
          <h2 className="font-semibold text-navy">Détails</h2>
          <dl className="text-sm space-y-2">
            <div><dt className="label">Statut</dt><dd>{LEAD_STATUS_LABELS[lead.status]}</dd></div>
            <div><dt className="label">Destination</dt><dd>{lead.destination ?? "—"}</dd></div>
            <div><dt className="label">Période</dt><dd>{lead.travelPeriod ?? "—"}</dd></div>
            <div><dt className="label">Budget</dt><dd>{fmtMoney(lead.budget)}</dd></div>
            <div><dt className="label">Source</dt><dd>{lead.source ?? "—"}</dd></div>
            <div>
              <dt className="label">Contact</dt>
              <dd>
                {lead.client ? (
                  <Link href={`/clients/${lead.client.id}`} className="text-ocean hover:underline">
                    {lead.client.firstName} {lead.client.lastName}
                  </Link>
                ) : (
                  <>
                    {lead.contactName ?? "—"}
                    {lead.contactEmail && <span className="block text-slate-500">{lead.contactEmail}</span>}
                    {lead.contactPhone && <span className="block text-slate-500">{lead.contactPhone}</span>}
                  </>
                )}
              </dd>
            </div>
            {lead.notes && <div><dt className="label">Notes</dt><dd className="whitespace-pre-wrap">{lead.notes}</dd></div>}
          </dl>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-navy mb-4">Journal d&apos;activités</h2>
          <form action={activityAction} className="flex gap-2 mb-5">
            <label htmlFor="type" className="sr-only">Type</label>
            <select id="type" name="type" className="input w-36">
              {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <label htmlFor="content" className="sr-only">Contenu</label>
            <input id="content" name="content" required className="input flex-1" placeholder="Ajouter une note, un compte-rendu d'appel…" />
            <button className="btn-primary">Ajouter</button>
          </form>
          {lead.activities.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune activité. Consignez chaque échange pour garder l&apos;historique complet.</p>
          ) : (
            <ol className="space-y-3">
              {lead.activities.map((a) => (
                <li key={a.id} className="border-l-2 border-ocean-100 pl-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="badge bg-ocean-50 text-ocean-600">{ACTIVITY_LABELS[a.type]}</span>
                    <span>{fmtDate(a.createdAt)}</span>
                    {a.author && <span>· {a.author.name}</span>}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{a.content}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
