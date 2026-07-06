import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ItinerariesPage() {
  await requireUser();
  const itineraries = await prisma.itinerary.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      ship: { include: { cruiseLine: true } },
      days: { orderBy: { dayNumber: "asc" } },
      _count: { select: { bookings: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Itinéraires</h1>
          <p className="text-sm text-slate-500">
            Votre catalogue de croisières. Les itinéraires importés d&apos;API externes apparaîtront ici avec leur source.
          </p>
        </div>
        <Link href="/itineraries/new" className="btn-primary">+ Nouvel itinéraire</Link>
      </div>

      {itineraries.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">Aucun itinéraire. Créez-en un pour bâtir votre catalogue.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {itineraries.map((it) => {
            const ports = it.days.filter((d) => !d.isSeaDay).map((d) => d.port);
            return (
              <Link key={it.id} href={`/itineraries/${it.id}`} className="card p-5 hover:border-ocean transition-colors block">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-navy leading-snug">{it.name}</h2>
                  <span className={`badge shrink-0 ${it.source === "API" ? "bg-violet-100 text-violet-700" : "bg-ocean-50 text-ocean-600"}`}>
                    {it.source === "API" ? it.providerName ?? "API" : "Manuel"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {it.nights} nuits · Départ {it.departurePort}
                  {it.ship && <span className="block">{it.ship.cruiseLine.name} · {it.ship.name}</span>}
                </p>
                <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                  {ports.slice(0, 6).join(" → ")}{ports.length > 6 ? " → …" : ""}
                </p>
                <p className="text-xs text-slate-500 mt-3">{it._count.bookings} réservation(s)</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
