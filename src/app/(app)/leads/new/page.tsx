import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createLead } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  await requireUser();
  const clients = await prisma.client.findMany({ orderBy: { lastName: "asc" }, take: 500 });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/leads" className="text-sm text-slate-500 hover:text-ocean">
          ← Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-1">Nouveau prospect</h1>
      </div>
      <form action={createLead} className="card p-6 space-y-5 max-w-3xl">
        <div>
          <label className="label" htmlFor="title">
            Titre du prospect *
          </label>
          <input
            id="title"
            name="title"
            required
            className="input"
            placeholder="Ex. : Croisière Alaska famille de 4 — été 2027"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="destination">
              Destination
            </label>
            <input
              id="destination"
              name="destination"
              className="input"
              placeholder="Caraïbes, Alaska…"
            />
          </div>
          <div>
            <label className="label" htmlFor="travelPeriod">
              Période souhaitée
            </label>
            <input
              id="travelPeriod"
              name="travelPeriod"
              className="input"
              placeholder="Décembre 2026"
            />
          </div>
          <div>
            <label className="label" htmlFor="budget">
              Budget (CAD)
            </label>
            <input id="budget" name="budget" type="number" min="0" step="100" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="clientId">
            Client existant
          </label>
          <select id="clientId" name="clientId" className="input">
            <option value="">— Nouveau contact (remplir ci-dessous) —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName}, {c.firstName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="contactName">
              Nom du contact
            </label>
            <input id="contactName" name="contactName" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="contactEmail">
              Courriel
            </label>
            <input id="contactEmail" name="contactEmail" type="email" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="contactPhone">
              Téléphone
            </label>
            <input id="contactPhone" name="contactPhone" className="input" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="source">
              Source
            </label>
            <input
              id="source"
              name="source"
              className="input"
              placeholder="Site web, référence, salon…"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" name="notes" rows={3} className="input" />
        </div>
        <button className="btn-primary">Créer le prospect</button>
      </form>
    </div>
  );
}
