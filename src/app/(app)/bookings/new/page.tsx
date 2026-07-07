import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createBooking } from "../actions";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({ searchParams }: { searchParams: { clientId?: string } }) {
  await requireUser();
  const [clients, itineraries] = await Promise.all([
    prisma.client.findMany({ orderBy: { lastName: "asc" }, take: 500 }),
    prisma.itinerary.findMany({ orderBy: { name: "asc" }, include: { ship: true } }),
  ]);

  return (
    <>
      <div>
        <Link href="/bookings" className="text-sm text-slate-500 hover:text-ocean">← Réservations</Link>
        <h1 className="text-2xl font-bold text-navy mt-1">Nouvelle réservation</h1>
      </div>
      <BookingForm
        action={createBooking}
        submitLabel="Créer la réservation"
        defaultClientId={searchParams.clientId}
        clients={clients.map((c) => ({ id: c.id, label: `${c.lastName}, ${c.firstName}` }))}
        itineraries={itineraries.map((i) => ({ id: i.id, label: `${i.name}${i.ship ? ` — ${i.ship.name}` : ""} (${i.nights} nuits)` }))}
      />
    </>
  );
}
