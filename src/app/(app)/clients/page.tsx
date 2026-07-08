import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { ClientsContent } from "@/components/ClientsContent";
import { deleteClient, restoreClient } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: {
    view?: string;
    imported?: string;
    updated?: string;
    skipped?: string;
    importError?: string;
    preview?: string;
    archived?: string;
  };
}) {
  await requireUser();
  const settings = await prisma.agencySettings.findUnique({
    where: { id: "default" },
    select: { defaultClientView: true, passportAlertDays: true },
  });
  const defaultView =
    settings?.defaultClientView === "archived" || settings?.defaultClientView === "all"
      ? settings.defaultClientView
      : "active";
  const view =
    searchParams.view === "archived" || searchParams.view === "all"
      ? searchParams.view
      : defaultView;
  const passportAlertDays = settings?.passportAlertDays ?? 180;
  const imported = Number(searchParams.imported ?? 0);
  const updated = Number(searchParams.updated ?? 0);
  const skipped = Number(searchParams.skipped ?? 0);
  const isPreview = searchParams.preview === "1";
  const hasImportResult =
    searchParams.imported !== undefined ||
    searchParams.updated !== undefined ||
    searchParams.skipped !== undefined;

  const where =
    view === "archived"
      ? { archivedAt: { not: null as Date | null } }
      : view === "all"
        ? undefined
        : { archivedAt: null as Date | null };

  const clients = await prisma.client.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { _count: { select: { bookings: true } } },
    take: 1000,
  });

  const rows = clients.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email ?? "",
    phone: c.phone ?? "",
    hasPassportNumber: !!c.passportNumber,
    passportExpiry: c.passportExpiry ? c.passportExpiry.toISOString() : "",
    updatedAtLabel: fmtDate(c.updatedAt),
  }));

  return (
    <ClientsContent
      searchParams={searchParams}
      rows={rows}
      view={view}
      archiveAction={deleteClient}
      restoreAction={restoreClient}
    />
  );
}
