import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, LEAD_STATUS_LABELS, BOOKING_STATUS_LABELS } from "@/lib/format";
import { PassportReveal } from "@/components/PassportReveal";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  OPTION: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-ocean-100 text-ocean-600",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-slate-100 text-slate-600",
};

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysUntil(target: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - Date.now()) / msPerDay);
}

export default async function Dashboard() {
  const user = await requireUser();
  const settings = await prisma.agencySettings.findUnique({
    where: { id: "default" },
    select: { passportAlertDays: true },
  });
  const now = new Date();
  const in14Days = addDays(now, 14);
  const passportAlertDays = settings?.passportAlertDays ?? 180;
  const passportLimitDate = addDays(now, passportAlertDays);
  const monthStart = startOfMonth(now);

  const [
    activeClientCount,
    archivedClientCount,
    openLeads,
    activeBookings,
    revenueAgg,
    monthRevenueAgg,
    leadsByStatus,
    recentBookings,
    upcomingDepartures,
    dueBookings,
    passportAlerts,
    bookingsByAgent,
  ] = await Promise.all([
    prisma.client.count({ where: { archivedAt: null } }),
    prisma.client.count({ where: { archivedAt: { not: null } } }),
    prisma.lead.count({ where: { status: { notIn: ["WON", "LOST"] } } }),
    prisma.booking.count({ where: { status: { in: ["OPTION", "CONFIRMED", "PAID"] } } }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true, commission: true },
      where: { status: { in: ["CONFIRMED", "PAID", "COMPLETED"] } },
    }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true, commission: true },
      where: {
        status: { in: ["CONFIRMED", "PAID", "COMPLETED"] },
        createdAt: { gte: monthStart },
      },
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
    prisma.booking.findMany({
      where: {
        status: { in: ["OPTION", "CONFIRMED"] },
        balanceDueDate: { gte: now, lte: in14Days },
      },
      orderBy: { balanceDueDate: "asc" },
      include: { client: true },
      take: 8,
    }),
    prisma.client.findMany({
      where: {
        archivedAt: null,
        passportExpiry: { gte: now, lte: passportLimitDate },
      },
      orderBy: { passportExpiry: "asc" },
      take: 8,
    }),
    prisma.booking.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null },
        status: { in: ["CONFIRMED", "PAID", "COMPLETED"] },
      },
      _count: true,
      _sum: { totalPrice: true, commission: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    }),
  ]);

  const agentIds = bookingsByAgent.map((b) => b.userId).filter((id): id is string => !!id);
  const agents = agentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      })
    : [];

  const agentNameById = new Map(agents.map((a) => [a.id, a.name]));

  const dueBookingsWithBalance = dueBookings.map((b) => {
    const balance = Number(b.totalPrice) - Number(b.deposit ?? 0);
    return { ...b, balance };
  });

  const dueAmountTotal = dueBookingsWithBalance.reduce((sum, b) => sum + Math.max(0, b.balance), 0);

  const wonLeads = leadsByStatus.find((l) => l.status === "WON")?._count ?? 0;
  const lostLeads = leadsByStatus.find((l) => l.status === "LOST")?._count ?? 0;
  const leadOutcomeTotal = wonLeads + lostLeads;
  const leadWinRate = leadOutcomeTotal > 0 ? Math.round((wonLeads / leadOutcomeTotal) * 100) : null;

  const kpis = [
    { label: "Clients actifs", value: activeClientCount, href: "/clients?view=active" },
    { label: "Clients archivés", value: archivedClientCount, href: "/clients?view=archived" },
    { label: "Prospects ouverts", value: openLeads, href: "/leads" },
    { label: "Réservations actives", value: activeBookings, href: "/bookings" },
    { label: "CA confirmé total", value: fmtMoney(revenueAgg._sum.totalPrice), href: "/bookings" },
    {
      label: "Commissions totales",
      value: fmtMoney(revenueAgg._sum.commission),
      href: "/bookings",
    },
    {
      label: "CA confirmé du mois",
      value: fmtMoney(monthRevenueAgg._sum.totalPrice),
      href: "/bookings",
    },
    {
      label: "Commissions du mois",
      value: fmtMoney(monthRevenueAgg._sum.commission),
      href: "/bookings",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Bonjour, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">
          Cockpit agence du {fmtDate(now)}: ventes, risques et priorités du jour.
        </p>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="card p-4 hover:border-ocean transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {k.label}
            </p>
            <p className="text-xl font-bold text-navy mt-1">{k.value}</p>
          </Link>
        ))}
      </div>

      {/* ALERT STRIP */}
      <div className="grid md:grid-cols-3 gap-4">
        <section className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Soldes à encaisser (14 jours)
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{fmtMoney(dueAmountTotal)}</p>
          <p className="text-sm text-slate-600 mt-2">
            {dueBookingsWithBalance.length} réservation(s) avec échéance proche.
          </p>
        </section>
        <section className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Passeports à surveiller (&lt; {passportAlertDays} jours)
          </p>
          <p className="text-2xl font-bold text-red-700 mt-1">{passportAlerts.length}</p>
          <p className="text-sm text-slate-600 mt-2">Vérifier et relancer les clients concernés.</p>
        </section>
        <section className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Taux de gain prospects
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {leadWinRate === null ? "—" : `${leadWinRate}%`}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            {wonLeads} gagné(s), {lostLeads} perdu(s).
          </p>
        </section>
      </div>

      {/* MAIN ANALYTICS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Pipeline des prospects</h2>
          <div className="space-y-2">
            {(["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"] as const).map((s) => {
              const count = leadsByStatus.find((l) => l.status === s)?._count ?? 0;
              const max = Math.max(1, ...leadsByStatus.map((l) => l._count));
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-slate-600">
                    {LEAD_STATUS_LABELS[s]}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ocean rounded-full"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
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
          <h2 className="font-semibold text-navy mb-4">Performance agents (CA)</h2>
          {bookingsByAgent.length === 0 ? (
            <p className="text-sm text-slate-500">
              Pas encore assez de données pour calculer la performance.
            </p>
          ) : (
            <ul className="space-y-3">
              {bookingsByAgent.map((row) => {
                if (!row.userId) return null;
                const agentName = agentNameById.get(row.userId) ?? "Agent inconnu";
                return (
                  <li key={row.userId} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-navy">{agentName}</p>
                      <p className="text-xs text-slate-500">
                        {row._count} réservation(s) confirmées/payées
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-navy">
                        {fmtMoney(row._sum.totalPrice)}
                      </p>
                      <p className="text-xs text-slate-500">Com. {fmtMoney(row._sum.commission)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Échéances de solde (14 jours)</h2>
          {dueBookingsWithBalance.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune échéance de solde imminente.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dueBookingsWithBalance.map((b) => {
                if (!b.balanceDueDate) return null;
                const dLeft = daysUntil(b.balanceDueDate);
                return (
                  <li key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="text-sm font-medium text-navy hover:text-ocean truncate block"
                      >
                        {b.reference} · {b.client.firstName} {b.client.lastName}
                      </Link>
                      <p className="text-xs text-slate-500">Solde: {fmtMoney(b.balance)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-slate-600">{fmtDate(b.balanceDueDate)}</p>
                      <p
                        className={`text-xs font-semibold ${dLeft <= 3 ? "text-red-700" : "text-amber-700"}`}
                      >
                        J-{dLeft}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
                    <Link
                      href={`/bookings/${b.id}`}
                      className="text-sm font-medium text-navy hover:text-ocean truncate block"
                    >
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

        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Passeports à renouveler</h2>
          {passportAlerts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun passeport n&apos;expire dans les {passportAlertDays} prochains jours.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {passportAlerts.map((c) => (
                <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-sm font-medium text-navy hover:text-ocean truncate block"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                    <PassportReveal clientId={c.id} hasValue={!!c.passportNumber} compact />
                  </div>
                  <span className="text-sm text-red-700 shrink-0">{fmtDate(c.passportExpiry)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* RECENT BOOKINGS */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Réservations récentes</h2>
          <Link href="/bookings/new" className="btn-primary text-xs">
            + Nouvelle réservation
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            Aucune réservation pour l&apos;instant. Créez votre première réservation pour la voir
            apparaître ici.
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
                  <td className="table-td text-slate-600">{b.itinerary?.name ?? "—"}</td>
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
      </section>
    </div>
  );
}
