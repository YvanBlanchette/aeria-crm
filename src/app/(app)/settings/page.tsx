import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import SettingsTabs from "@/components/settings/SettingsTabs";
import AgencySettingsSection from "@/components/settings/AgencySettingsSection";
import DataSettingsSection from "@/components/settings/DataSettingsSection";
import ProfileSettingsSection from "@/components/settings/ProfileSettingsSection";
import TeamSettingsSection from "@/components/settings/TeamSettingsSection";
import AuditSettingsSection from "@/components/settings/AuditSettingsSection";

export const dynamic = "force-dynamic";

type SearchParams = {
  saved?: string;
  pwd?: string;
  teamPwd?: string;
  data?: string;
  team?: string;
  tab?: string;
  subtab?: string;
};

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const allowedTabs = isAdmin ? ["agency", "data", "profile", "team", "audit"] : ["profile"];
  const activeTab = allowedTabs.includes(searchParams.tab ?? "")
    ? (searchParams.tab as string)
    : isAdmin
      ? "agency"
      : "profile";
  const activeSubtab = ["cruise-lines", "ships", "itineraries"].includes(searchParams.subtab ?? "")
    ? (searchParams.subtab as string)
    : "cruise-lines";

  const [lines, users, settings, auditLogs, itineraries] = await Promise.all([
    prisma.cruiseLine.findMany({
      orderBy: { name: "asc" },
      include: { ships: { orderBy: { name: "asc" } } },
    }),
    isAdmin ? prisma.user.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    prisma.agencySettings.findUnique({ where: { id: "default" } }),
    isAdmin
      ? prisma.settingsAuditLog.findMany({
          take: 15,
          orderBy: { createdAt: "desc" },
          include: { actorUser: { select: { name: true, email: true } } },
        })
      : Promise.resolve([]),
    activeTab === "data"
      ? prisma.itinerary.findMany({
          take: 100,
          orderBy: { createdAt: "desc" },
          include: { ship: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const cfg = settings ?? {
    agencyName: "ÆRIA Voyages",
    legalName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    street: "",
    city: "",
    province: "",
    country: "",
    zipCode: "",
    timezone: "America/Toronto",
    defaultCurrency: "CAD",
    defaultLanguage: "fr",
    bookingPrefix: "CR",
    defaultDepositPct: 25,
    balanceDueDays: 45,
    passportAlertDays: 180,
    defaultClientView: "active",
    autoArchiveLostLeads: false,
  };

  return (
    <div className="space-y-6">
      {searchParams.saved === "1" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Paramètres agence enregistrés.
        </p>
      )}
      {searchParams.saved === "invalid" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Le nom commercial est requis pour enregistrer les paramètres agence.
        </p>
      )}
      {searchParams.data === "updated" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Les données ont été mises à jour.
        </p>
      )}
      {searchParams.data === "invalid" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Une action sur les données a échoué. Vérifiez les champs et réessayez.
        </p>
      )}
      {searchParams.team === "created" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Un utilisateur a été créé.
        </p>
      )}
      {searchParams.team === "invalid" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de créer l&apos;utilisateur. Vérifiez les champs ou l&apos;adresse courriel.
        </p>
      )}
      {searchParams.pwd === "updated" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Votre mot de passe a été mis à jour.
        </p>
      )}
      {searchParams.pwd === "wrong" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Mot de passe actuel invalide.
        </p>
      )}
      {searchParams.pwd === "invalid" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Nouveau mot de passe invalide (8 caractères minimum et confirmation identique).
        </p>
      )}
      {searchParams.teamPwd === "updated" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Mot de passe collaborateur réinitialisé.
        </p>
      )}
      {searchParams.teamPwd === "invalid" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Le nouveau mot de passe collaborateur doit contenir au moins 8 caractères.
        </p>
      )}
      {searchParams.teamPwd === "mismatch" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          La confirmation du mot de passe collaborateur ne correspond pas.
        </p>
      )}

      <SettingsTabs activeTab={activeTab} activeSubtab={activeSubtab} isAdmin={isAdmin} />

      {activeTab === "agency" && isAdmin && <AgencySettingsSection cfg={cfg} />}

      {activeTab === "data" && isAdmin && (
        <DataSettingsSection activeSubtab={activeSubtab} lines={lines} itineraries={itineraries} />
      )}

      {activeTab === "profile" && <ProfileSettingsSection returnTab="profile" />}

      {activeTab === "team" && isAdmin && <TeamSettingsSection users={users} returnTab="team" />}

      {activeTab === "audit" && isAdmin && <AuditSettingsSection auditLogs={auditLogs} />}
    </div>
  );
}
