import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, LEAD_STATUS_LABELS, BOOKING_STATUS_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  OPTION: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-ocean-100 text-ocean-600",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-slate-100 text-slate-600",
};

export default async function Dashboard() {
  const user = await requireUser();

  const [clientCount, openLeads, activeBookings, revenueAgg, leadsByStatus, recentBookings, upcomingDepartures] =
    await Promise.all([
      prisma.client.count(),
      prisma.lead.count({ where: { status: { notIn: ["WON", "LOST"] } } }),
      prisma.booking.count({ where: { status: { in: ["OPTION", "CONFIRMED", "PAID"] } } }),
      prisma.booking.aggregate({
        _sum: { totalPrice: true, commission: true },
        where: { status: { in: ["CONFIRMED", "PAID", "COMPLETED"] } },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: true }),
      prisma.booking.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { client: true, itinerary: true },
      }),
      prisma.booking.findMany({
        where: { sailingDate: { gte: new Date() }, status: { in: ["CONFIRMED", "PAID"] } },
        take: 5,
        orderBy: { sailingDate: "asc" },
        include: { client: true, itinerary: { include: { ship: true } } },
      }),
    ]);

  const kpis = [
    { label: "Clients", value: clientCount, href: "/clients" },
    { label: "Prospects ouverts", value: openLeads, href: "/leads" },
    { label: "Réservations actives", value: activeBookings, href: "/bookings" },
    { label: "Ventes confirmées", value: fmtMoney(revenueAgg._sum.totalPrice), href: "/bookings" },
    { label: "Commissions", value: fmtMoney(revenueAgg._sum.commission), href: "/bookings" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Bonjour, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Voici l&apos;état de votre agence aujourd&apos;hui.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card p-4 hover:border-ocean transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className="text-2xl font-bold text-navy mt-1">{k.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Pipeline des prospects</h2>
          <div className="space-y-2">
            {(["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"] as const).map((s) => {
              const count = leadsByStatus.find((l) => l.status === s)?._count ?? 0;
              const max = Math.max(1, ...leadsByStatus.map((l) => l._count));
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-slate-600">{LEAD_STATUS_LABELS[s]}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-ocean rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-sm font-medium text-navy">{count}</span>
                </div>
              );
            })}
          </div>
          <Link href="/leads" className="text-sm text-ocean hover:underline mt-4 inline-block">
            Voir le pipeline →
          </Link>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Prochains départs</h2>
          {upcomingDepartures.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun départ confirmé à venir.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingDepartures.map((b) => (
                <li key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/bookings/${b.id}`} className="text-sm font-medium text-navy hover:text-ocean truncate block">
                      {b.client.firstName} {b.client.lastName}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">
                      {b.itinerary?.name ?? "Itinéraire à définir"}
                      {b.itinerary?.ship ? ` · ${b.itinerary.ship.name}` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600 shrink-0">{fmtDate(b.sailingDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Réservations récentes</h2>
          <Link href="/bookings/new" className="btn-primary text-xs">+ Nouvelle réservation</Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            Aucune réservation pour l&apos;instant. Créez votre première réservation pour la voir apparaître ici.
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="table-th">Référence</th>
                <th className="table-th">Client</th>
                <th className="table-th">Croisière</th>
                <th className="table-th">Départ</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link href={`/bookings/${b.id}`} className="font-medium text-ocean hover:underline">{b.reference}</Link>
                  </td>
                  <td className="table-td">{b.client.firstName} {b.client.lastName}</td>
                  <td className="table-td text-slate-600">{b.itinerary?.name ?? "—"}</td>
                  <td className="table-td">{fmtDate(b.sailingDate)}</td>
                  <td className="table-td font-medium">{fmtMoney(b.totalPrice)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUS_COLORS[b.status]}`}>{BOOKING_STATUS_LABELS[b.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
