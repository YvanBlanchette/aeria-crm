import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtMoney, LEAD_STATUS_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const COLUMNS = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"] as const;
const COLUMN_ACCENT: Record<string, string> = {
  NEW: "border-t-slate-400",
  CONTACTED: "border-t-sky-500",
  QUOTED: "border-t-ocean",
  NEGOTIATION: "border-t-amber-500",
  WON: "border-t-emerald-500",
  LOST: "border-t-red-400",
};

export default async function LeadsPage() {
  await requireUser();
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: { client: true, assignedTo: { select: { name: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {COLUMNS.map((col) => {
          const items = leads.filter((l) => l.status === col);
          return (
            <div key={col} className={`card border-t-4 ${COLUMN_ACCENT[col]}`}>
              <div className="px-3 py-2.5 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {LEAD_STATUS_LABELS[col]}
                </h2>
                <span className="text-xs font-bold text-slate-400">{items.length}</span>
              </div>
              <div className="px-2 pb-2 space-y-2">
                {items.length === 0 && <p className="px-1 pb-2 text-xs text-slate-400">Vide</p>}
                {items.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-ocean transition-colors"
                  >
                    <p className="text-sm font-medium text-navy leading-snug">{l.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {l.client
                        ? `${l.client.firstName} ${l.client.lastName}`
                        : (l.contactName ?? "Contact à définir")}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>{l.destination ?? "—"}</span>
                      <span className="font-medium text-navy">
                        {l.budget ? fmtMoney(l.budget) : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
