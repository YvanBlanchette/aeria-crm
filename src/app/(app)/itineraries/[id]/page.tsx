import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDay, removeDay, deleteItinerary } from "../actions";
import { RouteTimeline } from "@/components/RouteTimeline";

export const dynamic = "force-dynamic";

export default async function ItineraryBuilder({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  await requireUser();
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: params.id },
    include: {
      ship: { include: { cruiseLine: true } },
      days: { orderBy: { dayNumber: "asc" } },
      bookings: { include: { client: true }, orderBy: { sailingDate: "desc" }, take: 5 },
    },
  });
  if (!itinerary) notFound();

  const addDayAction = addDay.bind(null, itinerary.id);
  const deleteAction = deleteItinerary.bind(null, itinerary.id);
  const totalDays = itinerary.nights + 1;
  const remaining = totalDays - itinerary.days.length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/itineraries" className="text-sm text-slate-500 hover:text-ocean">
            ← Itinéraires
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-1">{itinerary.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {itinerary.nights} nuits · {itinerary.departurePort}
            {itinerary.arrivalPort && itinerary.arrivalPort !== itinerary.departurePort
              ? ` → ${itinerary.arrivalPort}`
              : " (boucle)"}
            {itinerary.ship && ` · ${itinerary.ship.cruiseLine.name}, ${itinerary.ship.name}`}
          </p>
        </div>
        <form action={deleteAction}>
          <button className="btn-danger">Supprimer l&apos;itinéraire</button>
        </form>
      </div>

      {searchParams.error === "has-bookings" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Des réservations utilisent cet itinéraire : il ne peut pas être supprimé.
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <section className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-navy">Ligne de route</h2>
            <span
              className={`badge ${remaining > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
            >
              {itinerary.days.length}/{totalDays} jours
            </span>
          </div>
          <RouteTimeline
            days={itinerary.days}
            actions={(day) => {
              const remove = removeDay.bind(null, itinerary.id, day.id);
              return (
                <form action={remove}>
                  <button
                    className="text-xs text-slate-400 hover:text-red-600"
                    title="Retirer ce jour"
                  >
                    ✕
                  </button>
                </form>
              );
            }}
          />
        </section>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-semibold text-navy mb-4">
              Ajouter le jour {itinerary.days.length + 1}
            </h2>
            <form action={addDayAction} className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isSeaDay"
                  className="rounded border-slate-300 text-ocean focus:ring-ocean"
                />
                Journée en mer
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="port">
                    Port d&apos;escale
                  </label>
                  <input id="port" name="port" className="input" placeholder="Cozumel" />
                </div>
                <div>
                  <label className="label" htmlFor="country">
                    Pays
                  </label>
                  <input id="country" name="country" className="input" placeholder="Mexique" />
                </div>
                <div>
                  <label className="label" htmlFor="arrival">
                    Arrivée
                  </label>
                  <input id="arrival" name="arrival" type="time" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="departure">
                    Départ
                  </label>
                  <input id="departure" name="departure" type="time" className="input" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="notes">
                  Notes (excursions, conseils…)
                </label>
                <input id="notes" name="notes" className="input" />
              </div>
              <button className="btn-primary">Ajouter l&apos;escale</button>
            </form>
          </section>

          {itinerary.description && (
            <section className="card p-5">
              <h2 className="font-semibold text-navy mb-2">Description</h2>
              <p className="text-sm whitespace-pre-wrap">{itinerary.description}</p>
            </section>
          )}

          <section className="card p-5">
            <h2 className="font-semibold text-navy mb-3">Réservations sur cet itinéraire</h2>
            {itinerary.bookings.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune réservation pour l&apos;instant.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {itinerary.bookings.map((b) => (
                  <li key={b.id} className="py-2 flex justify-between text-sm">
                    <Link href={`/bookings/${b.id}`} className="text-ocean hover:underline">
                      {b.reference}
                    </Link>
                    <span className="text-slate-600">
                      {b.client.firstName} {b.client.lastName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
