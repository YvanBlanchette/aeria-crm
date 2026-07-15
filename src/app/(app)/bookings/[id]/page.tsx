import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, BOOKING_STATUS_LABELS, CABIN_LABELS } from "@/lib/format";
import { updateBooking, deleteBooking } from "../actions";
import { BookingForm } from "@/components/BookingForm";
import { RouteTimeline } from "@/components/RouteTimeline";

export const dynamic = "force-dynamic";

export default async function BookingDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string };
}) {
  await requireUser();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      agent: { select: { name: true } },
      itinerary: {
        include: {
          ship: { include: { cruiseLine: true } },
          days: { orderBy: { dayNumber: "asc" } },
        },
      },
      payments: { orderBy: { createdAt: "asc" } },
      paymentSchedules: { orderBy: { dueDate: "asc" } },
      segments: {
        orderBy: { sortOrder: "asc" },
        include: {
          cruiseDetails: true,
          flightDetails: true,
          hotelDetails: true,
          transferDetails: true,
          activityDetails: true,
          insuranceDetails: true,
        },
      },
    },
  });
  if (!booking) notFound();

  const editing = searchParams.edit === "1";
  const balance = Number(booking.totalPrice) - Number(booking.deposit ?? 0);

  let clientOptions: { id: string; label: string }[] = [];
  let cruiseCatalog: { name: string; ships: string[] }[] = [];
  let itineraryOptions: {
    id: string;
    label: string;
    nights: number;
    departurePort: string;
    arrivalPort?: string | null;
    shipName?: string | null;
    cruiseLineName?: string | null;
  }[] = [];
  if (editing) {
    const [clients, itineraries, cruiseLines] = await Promise.all([
      prisma.client.findMany({ orderBy: { lastName: "asc" }, take: 500 }),
      prisma.itinerary.findMany({
        orderBy: { name: "asc" },
        include: { ship: { include: { cruiseLine: true } } },
      }),
      prisma.cruiseLine.findMany({
        orderBy: { name: "asc" },
        include: { ships: { orderBy: { name: "asc" } } },
      }),
    ]);
    clientOptions = clients.map((c) => ({ id: c.id, label: `${c.lastName}, ${c.firstName}` }));
    cruiseCatalog = cruiseLines.map((line) => ({
      name: line.name,
      ships: line.ships.map((ship) => ship.name),
    }));
    itineraryOptions = itineraries.map((i) => ({
      id: i.id,
      label: `${i.name}${i.ship ? ` — ${i.ship.name}` : ""} (${i.nights} nuits)`,
      nights: i.nights,
      departurePort: i.departurePort,
      arrivalPort: i.arrivalPort,
      shipName: i.ship?.name,
      cruiseLineName: i.ship?.cruiseLine.name,
    }));
  }

  const updateAction = updateBooking.bind(null, booking.id);
  const deleteAction = deleteBooking.bind(null, booking.id);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/bookings" className="text-sm text-slate-500 hover:text-ocean">
            ← Réservations
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-1">
            {booking.reference}
            <span className="badge bg-ocean-100 text-ocean-600 ml-3 align-middle">
              {BOOKING_STATUS_LABELS[booking.status]}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            <Link href={`/clients/${booking.client.id}`} className="text-ocean hover:underline">
              {booking.client.firstName} {booking.client.lastName}
            </Link>
            {booking.agent ? ` · Agent : ${booking.agent.name}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Link href={`/bookings/${booking.id}?edit=1`} className="btn-secondary">
              Modifier
            </Link>
          )}
          <form action={deleteAction}>
            <button className="btn-danger">Supprimer</button>
          </form>
        </div>
      </div>

      {editing ? (
        <BookingForm
          booking={booking}
          action={updateAction}
          submitLabel="Enregistrer"
          lockClient
          clients={clientOptions}
          cruiseCatalog={cruiseCatalog}
          itineraries={itineraryOptions}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-5">
            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Voyage</h2>
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="label">Départ</dt>
                  <dd>{fmtDate(booking.sailingDate)}</dd>
                </div>
                <div>
                  <dt className="label">Retour</dt>
                  <dd>{fmtDate(booking.returnDate)}</dd>
                </div>
                <div>
                  <dt className="label">Cabine</dt>
                  <dd>
                    {CABIN_LABELS[booking.cabinType]}
                    {booking.cabinNumber ? ` — ${booking.cabinNumber}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="label">Passagers</dt>
                  <dd>{booking.passengers}</dd>
                </div>
                {booking.itinerary?.ship && (
                  <div>
                    <dt className="label">Navire</dt>
                    <dd>
                      {booking.itinerary.ship.cruiseLine.name} · {booking.itinerary.ship.name}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Finances</h2>
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="label">Prix total</dt>
                  <dd className="text-lg font-bold text-navy">{fmtMoney(booking.totalPrice)}</dd>
                </div>
                <div>
                  <dt className="label">Dépôt reçu</dt>
                  <dd>{fmtMoney(booking.deposit)}</dd>
                </div>
                <div>
                  <dt className="label">Solde restant</dt>
                  <dd className={balance > 0 ? "font-medium text-amber-700" : "text-emerald-700"}>
                    {fmtMoney(balance)}
                  </dd>
                </div>
                <div>
                  <dt className="label">Solde dû le</dt>
                  <dd>{fmtDate(booking.balanceDueDate)}</dd>
                </div>
                <div>
                  <dt className="label">Commission</dt>
                  <dd>{fmtMoney(booking.commission)}</dd>
                </div>
              </dl>
            </section>
            {booking.notes && (
              <section className="card p-5">
                <h2 className="font-semibold text-navy mb-2">Notes</h2>
                <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
              </section>
            )}

            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Segments</h2>
              {booking.segments.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun segment ajouté.</p>
              ) : (
                <ul className="space-y-3">
                  {booking.segments.map((s, idx) => (
                    <li key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <p className="font-medium text-navy">
                        {idx + 1}. {s.title || s.type}
                      </p>
                      <p className="text-slate-600">
                        {s.supplierName || "Fournisseur à préciser"}
                        {s.startAt ? ` · ${fmtDate(s.startAt)}` : ""}
                        {s.endAt ? ` → ${fmtDate(s.endAt)}` : ""}
                      </p>
                      {(s.totalAmount || s.baseAmount) && (
                        <p className="text-slate-700 mt-1">
                          Montant: {fmtMoney(s.totalAmount ?? s.baseAmount)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Paiements</h2>
              {booking.payments.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
              ) : (
                <ul className="space-y-2">
                  {booking.payments.map((p) => (
                    <li key={p.id} className="text-sm rounded-lg border border-slate-200 p-3">
                      <p className="font-medium text-navy">
                        {fmtMoney(p.amount)} · {p.type}
                      </p>
                      <p className="text-slate-600">
                        {p.paidAt ? fmtDate(p.paidAt) : "Date à confirmer"} · {p.status}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Échéances</h2>
              {booking.paymentSchedules.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune échéance définie.</p>
              ) : (
                <ul className="space-y-2">
                  {booking.paymentSchedules.map((s) => (
                    <li key={s.id} className="text-sm rounded-lg border border-slate-200 p-3">
                      <p className="font-medium text-navy">
                        {s.label || "Échéance"} · {fmtMoney(s.amount)}
                      </p>
                      <p className="text-slate-600">
                        {fmtDate(s.dueDate)} · {s.status}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card p-5 lg:col-span-2">
            <h2 className="font-semibold text-navy mb-1">Itinéraire</h2>
            {booking.itinerary ? (
              <>
                <p className="text-sm text-slate-500 mb-5">
                  <Link
                    href={`/itineraries/${booking.itinerary.id}`}
                    className="text-ocean hover:underline"
                  >
                    {booking.itinerary.name}
                  </Link>
                  {" · "}
                  {booking.itinerary.nights} nuits au départ de {booking.itinerary.departurePort}
                </p>
                <RouteTimeline days={booking.itinerary.days} />
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Aucun itinéraire lié. Modifiez la réservation pour en associer un, ou créez-le dans
                l&apos;onglet Itinéraires.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
