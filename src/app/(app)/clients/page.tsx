import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireUser();
  const q = searchParams.q?.trim();
  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { bookings: true } } },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-navy">Clients</h1>
        <Link href="/clients/new" className="btn-primary">+ Nouveau client</Link>
      </div>

      <form className="max-w-md">
        <label htmlFor="q" className="sr-only">Rechercher un client</label>
        <input id="q" name="q" defaultValue={q} placeholder="Rechercher par nom, courriel, téléphone…" className="input" />
      </form>

      <div className="card overflow-hidden">
        {clients.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {q ? "Aucun client ne correspond à cette recherche." : "Aucun client. Ajoutez votre premier client pour commencer."}
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Nom</th>
                <th className="table-th">Courriel</th>
                <th className="table-th">Téléphone</th>
                <th className="table-th">Passeport</th>
                <th className="table-th">Croisières</th>
                <th className="table-th">Mis à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link href={`/clients/${c.id}`} className="font-medium text-navy hover:text-ocean">
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="table-td text-slate-600">{c.email ?? "—"}</td>
                  <td className="table-td text-slate-600">{c.phone ?? "—"}</td>
                  <td className="table-td text-slate-600">
                    {c.passportNumber ? (
                      <span>
                        {c.passportNumber}
                        {c.passportExpiry && c.passportExpiry < new Date(Date.now() + 1000 * 60 * 60 * 24 * 180) && (
                          <span className="badge bg-amber-100 text-amber-800 ml-2">Expire bientôt</span>
                        )}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="table-td">{c._count.bookings}</td>
                  <td className="table-td text-slate-500">{fmtDate(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
