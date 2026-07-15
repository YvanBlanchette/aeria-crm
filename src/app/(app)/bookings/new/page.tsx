import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createBooking } from "../actions";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: { clientId?: string; itineraryId?: string };
}) {
  await requireUser();
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

  return (
    <>
      <div>
        <Link href="/bookings" className="text-sm text-slate-500 hover:text-ocean">
          ← Réservations
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-1">Nouvelle réservation</h1>
      </div>
      <BookingForm
        action={createBooking}
        submitLabel="Créer la réservation"
        defaultClientId={searchParams.clientId}
        defaultItineraryId={searchParams.itineraryId}
        clients={clients.map((c) => ({ id: c.id, label: `${c.lastName}, ${c.firstName}` }))}
        cruiseCatalog={cruiseLines.map((line) => ({
          name: line.name,
          ships: line.ships.map((ship) => ship.name),
        }))}
        itineraries={itineraries.map((i) => ({
          id: i.id,
          label: `${i.name}${i.ship ? ` — ${i.ship.name}` : ""} (${i.nights} nuits)`,
          nights: i.nights,
          departurePort: i.departurePort,
          arrivalPort: i.arrivalPort,
          shipName: i.ship?.name,
          cruiseLineName: i.ship?.cruiseLine.name,
        }))}
      />
    </>
  );
}
