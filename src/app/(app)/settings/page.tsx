import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  addCruiseLine,
  addShip,
  deleteShip,
  createUser,
  saveAgencySettings,
  updateMyPassword,
  resetUserPassword,
} from "./actions";
import { ResetUserPasswordModal } from "@/components/ResetUserPasswordModal";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; pwd?: string; teamPwd?: string };
}) {
  const user = await requireUser();
  const [lines, users, settings, auditLogs] = await Promise.all([
    prisma.cruiseLine.findMany({ orderBy: { name: "asc" }, include: { ships: { orderBy: { name: "asc" } } } }),
    user.role === "ADMIN" ? prisma.user.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    prisma.agencySettings.findUnique({ where: { id: "default" } }),
    user.role === "ADMIN"
      ? prisma.settingsAuditLog.findMany({
          take: 15,
          orderBy: { createdAt: "desc" },
          include: { actorUser: { select: { name: true, email: true } } },
        })
      : Promise.resolve([]),
  ]);

  const cfg = settings ?? {
    agencyName: "ÆRIA Voyages",
    legalName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    address: "",
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
      <h1 className="text-2xl font-bold text-navy">Paramètres</h1>

      {searchParams.saved === "1" && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          Paramètres agence enregistrés.
        </p>
      )}
      {searchParams.pwd === "updated" && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          Votre mot de passe a été mis à jour.
        </p>
      )}
      {searchParams.pwd === "wrong" && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Mot de passe actuel invalide.
        </p>
      )}
      {searchParams.pwd === "invalid" && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Nouveau mot de passe invalide (8 caractères minimum et confirmation identique).
        </p>
      )}
      {searchParams.teamPwd === "updated" && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          Mot de passe collaborateur réinitialisé.
        </p>
      )}
      {searchParams.teamPwd === "invalid" && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Le nouveau mot de passe collaborateur doit contenir au moins 8 caractères.
        </p>
      )}
      {searchParams.teamPwd === "mismatch" && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          La confirmation du mot de passe collaborateur ne correspond pas.
        </p>
      )}

      {user.role === "ADMIN" && (
        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Profil agence &amp; règles opérationnelles</h2>
          <form action={saveAgencySettings} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="agencyName">Nom commercial *</label>
                <input id="agencyName" name="agencyName" required defaultValue={cfg.agencyName ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="legalName">Raison sociale</label>
                <input id="legalName" name="legalName" defaultValue={cfg.legalName ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="contactEmail">Courriel de contact</label>
                <input id="contactEmail" name="contactEmail" type="email" defaultValue={cfg.contactEmail ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="contactPhone">Téléphone de contact</label>
                <input id="contactPhone" name="contactPhone" defaultValue={cfg.contactPhone ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="website">Site web</label>
                <input id="website" name="website" defaultValue={cfg.website ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="timezone">Fuseau horaire</label>
                <select id="timezone" name="timezone" defaultValue={cfg.timezone ?? "America/Toronto"} className="input">
                  <option value="America/Toronto">America/Toronto</option>
                  <option value="America/Montreal">America/Montreal</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="address">Adresse agence</label>
              <input id="address" name="address" defaultValue={cfg.address ?? ""} className="input" />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="label" htmlFor="defaultCurrency">Devise par défaut</label>
                <select id="defaultCurrency" name="defaultCurrency" defaultValue={cfg.defaultCurrency ?? "CAD"} className="input">
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="defaultLanguage">Langue par défaut</label>
                <select id="defaultLanguage" name="defaultLanguage" defaultValue={cfg.defaultLanguage ?? "fr"} className="input">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="bookingPrefix">Préfixe réservations</label>
                <input id="bookingPrefix" name="bookingPrefix" maxLength={6} defaultValue={cfg.bookingPrefix ?? "CR"} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="defaultDepositPct">Dépôt par défaut (%)</label>
                <input id="defaultDepositPct" name="defaultDepositPct" type="number" min={0} max={100} defaultValue={cfg.defaultDepositPct ?? 25} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="balanceDueDays">Solde dû (jours avant départ)</label>
                <input id="balanceDueDays" name="balanceDueDays" type="number" min={0} max={365} defaultValue={cfg.balanceDueDays ?? 45} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="passportAlertDays">Alerte passeport (jours)</label>
                <input id="passportAlertDays" name="passportAlertDays" type="number" min={1} max={3650} defaultValue={cfg.passportAlertDays ?? 180} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="defaultClientView">Vue clients par défaut</label>
                <select id="defaultClientView" name="defaultClientView" defaultValue={cfg.defaultClientView ?? "active"} className="input">
                  <option value="active">Actifs</option>
                  <option value="all">Tous</option>
                  <option value="archived">Archives</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="autoArchiveLostLeads" defaultChecked={!!cfg.autoArchiveLostLeads} />
                  Archiver automatiquement les prospects perdus après conversion manuelle
                </label>
              </div>
            </div>

            <button className="btn-primary">Enregistrer les paramètres agence</button>
          </form>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="card p-5">
          <h2 className="font-semibold text-navy mb-4">Compagnies et navires</h2>
          <form action={addCruiseLine} className="flex gap-2 mb-5">
            <label htmlFor="new-line" className="sr-only">Nom de la compagnie</label>
            <input id="new-line" name="name" required className="input flex-1" placeholder="Nouvelle compagnie (ex. : Princess Cruises)" />
            <button className="btn-secondary">Ajouter</button>
          </form>
          <div className="space-y-4">
            {lines.map((line) => (
              <div key={line.id}>
                <h3 className="text-sm font-semibold text-navy">{line.name}</h3>
                <ul className="mt-1 space-y-1">
                  {line.ships.map((s) => {
                    const remove = deleteShip.bind(null, s.id);
                    return (
                      <li key={s.id} className="flex items-center justify-between text-sm text-slate-600 pl-3">
                        <span>⛴ {s.name}</span>
                        <form action={remove}>
                          <button className="text-xs text-slate-400 hover:text-red-600" title="Retirer">✕</button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
                <form action={addShip} className="flex gap-2 mt-2 pl-3">
                  <input type="hidden" name="cruiseLineId" value={line.id} />
                  <label htmlFor={`ship-${line.id}`} className="sr-only">Nom du navire</label>
                  <input id={`ship-${line.id}`} name="name" required className="input flex-1 text-sm" placeholder="Ajouter un navire…" />
                  <button className="btn-secondary text-xs">+</button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-navy mb-4">Sécurité du compte</h2>
            <form action={updateMyPassword} className="grid sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="label" htmlFor="currentPassword">Mot de passe actuel</label>
                <input id="currentPassword" name="currentPassword" type="password" required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="newPassword">Nouveau mot de passe</label>
                <input id="newPassword" name="newPassword" type="password" minLength={8} required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirmer</label>
                <input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required className="input" />
              </div>
              <div className="sm:col-span-3">
                <button className="btn-secondary">Mettre à jour mon mot de passe</button>
              </div>
            </form>
          </section>

          {user.role === "ADMIN" && (
            <section className="card p-5">
              <h2 className="font-semibold text-navy mb-4">Équipe</h2>
              <ul className="divide-y divide-slate-100 mb-5">
                {users.map((u) => (
                  <li key={u.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-navy truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${u.role === "ADMIN" ? "bg-navy text-white" : "bg-slate-100 text-slate-600"}`}>
                        {u.role === "ADMIN" ? "Admin" : "Agent"}
                      </span>
                      <ResetUserPasswordModal
                        userLabel={`${u.name} (${u.email})`}
                        action={resetUserPassword.bind(null, u.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <form action={createUser} className="space-y-3">
                <h3 className="text-sm font-semibold text-navy">Ajouter un agent</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="u-name">Nom</label>
                    <input id="u-name" name="name" required className="input" />
                  </div>
                  <div>
                    <label className="label" htmlFor="u-email">Courriel</label>
                    <input id="u-email" name="email" type="email" required className="input" />
                  </div>
                  <div>
                    <label className="label" htmlFor="u-pass">Mot de passe (8+ caractères)</label>
                    <input id="u-pass" name="password" type="password" minLength={8} required className="input" />
                  </div>
                  <div>
                    <label className="label" htmlFor="u-role">Rôle</label>
                    <select id="u-role" name="role" className="input">
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary">Créer l&apos;utilisateur</button>
              </form>
            </section>
          )}

          <section className="card p-5">
            <h2 className="font-semibold text-navy mb-4">Journal d&apos;audit (paramètres & sécurité)</h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune entrée d&apos;audit pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <li key={log.id} className="py-3 text-sm">
                    <p className="font-medium text-navy">{log.summary}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(log.createdAt).toLocaleString("fr-CA")} · {log.actorUser?.name ?? log.actorUser?.email ?? "Utilisateur supprimé"}
                      {log.target ? ` · ${log.target}` : ""}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Action: {log.action}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-navy mb-2">Fournisseurs de données</h2>
            <p className="text-sm text-slate-600">
              Le CRM est prêt à recevoir des fournisseurs d&apos;itinéraires externes (Traveltek, Widgety, GDS…).
              L&apos;architecture se trouve dans <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">src/lib/providers/</code> :
              implémentez l&apos;interface <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">CruiseProvider</code> et
              enregistrez-la dans le registre pour importer des croisières réelles.
            </p>
            <p className="text-sm text-slate-500 mt-3">Fournisseur actif : Catalogue interne (itinéraires manuels).</p>
          </section>
        </div>
      </div>
    </div>
  );
}
