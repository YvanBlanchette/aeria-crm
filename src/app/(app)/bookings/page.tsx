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
  searchParams: { status?: string; itinerary?: string };
}) {
  await requireUser();
  const status = searchParams.status;
  const itineraryFilter =
    searchParams.itinerary === "linked" || searchParams.itinerary === "unlinked"
      ? searchParams.itinerary
      : undefined;

  const where: any = {};
  if (status) where.status = status;
  if (itineraryFilter === "linked") where.itineraryId = { not: null };
  if (itineraryFilter === "unlinked") where.itineraryId = null;

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { sailingDate: "desc" },
    include: { client: true, itinerary: { include: { ship: { include: { cruiseLine: true } } } } },
    take: 200,
  });

  const makeHref = (nextStatus?: string, nextItinerary?: "linked" | "unlinked") => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextItinerary) params.set("itinerary", nextItinerary);
    const query = params.toString();
    return query ? `/bookings?${query}` : "/bookings";
  };

  return (
    <div className="space-y-5">
      {/* STATUS FILTERS */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={makeHref(undefined, itineraryFilter as "linked" | "unlinked" | undefined)}
          className={`badge ${!status ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
        >
          Toutes
        </Link>
        {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
          <Link
            key={v}
            href={makeHref(v, itineraryFilter as "linked" | "unlinked" | undefined)}
            className={`badge ${status === v ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
          >
            {l}
          </Link>
        ))}
      </div>

      {/* ITINERARY LINK FILTERS */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={makeHref(status, undefined)}
          className={`badge ${!itineraryFilter ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
        >
          Itinéraire: tous
        </Link>
        <Link
          href={makeHref(status, "linked")}
          className={`badge ${itineraryFilter === "linked" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
        >
          Itinéraire: lié
        </Link>
        <Link
          href={makeHref(status, "unlinked")}
          className={`badge ${itineraryFilter === "unlinked" ? "bg-navy text-white" : "bg-white border border-slate-300 text-slate-600"}`}
        >
          Itinéraire: non lié
        </Link>
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
