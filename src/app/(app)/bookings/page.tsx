import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, BOOKING_STATUS_LABELS, CABIN_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  OPTION: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-ocean-100 text-ocean-600",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-slate-100 text-slate-600",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireUser();
  const status = searchParams.status;
  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { sailingDate: "desc" },
    include: { client: true, itinerary: { include: { ship: { include: { cruiseLine: true } } } } },
    take: 200,
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/bookings"
          className={`badge ${!status ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
        >
          Toutes
        </Link>
        {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
          <Link
            key={v}
            href={`/bookings?status=${v}`}
            className={`badge ${status === v ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
          >
            {l}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {bookings.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune réservation dans cette vue.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="table-th">Référence</th>
                <th className="table-th">Client</th>
                <th className="table-th">Croisière</th>
                <th className="table-th">Cabine</th>
                <th className="table-th">Départ</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="font-medium text-ocean hover:underline"
                    >
                      {b.reference}
                    </Link>
                  </td>
                  <td className="table-td">
                    {b.client.firstName} {b.client.lastName}
                  </td>
                  <td className="table-td text-slate-600">
                    {b.itinerary ? (
                      <>
                        {b.itinerary.name}
                        {b.itinerary.ship && (
                          <span className="block text-xs text-slate-400">
                            {b.itinerary.ship.cruiseLine.name} · {b.itinerary.ship.name}
                          </span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="table-td">
                    {CABIN_LABELS[b.cabinType]}
                    {b.cabinNumber ? ` ${b.cabinNumber}` : ""}
                  </td>
                  <td className="table-td">{fmtDate(b.sailingDate)}</td>
                  <td className="table-td font-medium">{fmtMoney(b.totalPrice)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUS_COLORS[b.status]}`}>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
