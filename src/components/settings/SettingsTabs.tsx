import Link from "next/link";

type SettingsTabsProps = {
  activeTab: string;
  activeSubtab?: string;
  isAdmin: boolean;
};

function tabClass(active: boolean) {
  return active
    ? "rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow"
    : "rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-navy";
}

function subtabClass(active: boolean) {
  return active
    ? "rounded-full bg-ocean px-3 py-1.5 text-xs font-semibold text-white shadow"
    : "rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-navy";
}

function buildHref(tab: string, subtab?: string) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (subtab) params.set("subtab", subtab);
  return `/settings?${params.toString()}`;
}

export default function SettingsTabs({ activeTab, activeSubtab, isAdmin }: SettingsTabsProps) {
  const tabs = [
    { key: "agency", label: "Agence" },
    ...(isAdmin ? [{ key: "data", label: "Données" }] : []),
    { key: "profile", label: "Profil" },
    ...(isAdmin ? [{ key: "team", label: "Équipe" }] : []),
    ...(isAdmin ? [{ key: "audit", label: "Audit" }] : []),
  ];

  const dataTabs = [
    { key: "cruise-lines", label: "Compagnies" },
    { key: "ships", label: "Navires" },
    { key: "itineraries", label: "Itinéraires" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <Link key={tab.key} href={buildHref(tab.key)} className={tabClass(activeTab === tab.key)}>
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === "data" && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {dataTabs.map((tab) => (
            <Link
              key={tab.key}
              href={buildHref("data", tab.key)}
              className={subtabClass(activeSubtab === tab.key)}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
