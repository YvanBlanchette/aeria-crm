import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createItinerary } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewItineraryPage() {
  await requireUser();
  const ships = await prisma.ship.findMany({
    orderBy: { name: "asc" },
    include: { cruiseLine: true },
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/itineraries" className="text-sm text-slate-500 hover:text-ocean">← Itinéraires</Link>
        <h1 className="text-2xl font-bold text-navy mt-1">Nouvel itinéraire</h1>
        <p className="text-sm text-slate-500">Créez la fiche, puis ajoutez les escales jour par jour dans le builder.</p>
      </div>
      <form action={createItinerary} className="card p-6 space-y-5 max-w-2xl">
        <div>
          <label className="label" htmlFor="name">Nom de l&apos;itinéraire *</label>
          <input id="name" name="name" required className="input" placeholder="Ex. : Caraïbes de l'Est — 7 nuits" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="nights">Nuits *</label>
            <input id="nights" name="nights" type="number" min="1" max="180" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="departurePort">Port de départ *</label>
            <input id="departurePort" name="departurePort" required className="input" placeholder="Miami" />
          </div>
          <div>
            <label className="label" htmlFor="arrivalPort">Port d&apos;arrivée</label>
            <input id="arrivalPort" name="arrivalPort" className="input" placeholder="Identique si boucle" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="shipId">Navire</label>
          <select id="shipId" name="shipId" className="input">
            <option value="">— À définir —</option>
            {ships.map((s) => (
              <option key={s.id} value={s.id}>{s.cruiseLine.name} · {s.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Gérez compagnies et navires dans les Paramètres.</p>
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="input" />
        </div>
        <button className="btn-primary">Créer et ouvrir le builder</button>
      </form>
    </div>
  );
}
