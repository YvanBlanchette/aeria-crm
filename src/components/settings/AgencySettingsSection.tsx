import { saveAgencySettings } from "@/app/(app)/settings/actions";

type AgencySettingsSectionProps = {
  cfg: {
    agencyName: string;
    legalName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    street: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zipCode: string | null;
    timezone: string;
    defaultCurrency: string;
    defaultLanguage: string;
    bookingPrefix: string;
    defaultDepositPct: number;
    balanceDueDays: number;
    passportAlertDays: number;
    defaultClientView: string;
    autoArchiveLostLeads: boolean;
  };
};

export default function AgencySettingsSection({ cfg }: AgencySettingsSectionProps) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-navy mb-4">Profil agence &amp; règles opérationnelles</h2>
      <form action={saveAgencySettings} className="space-y-4">
        <input type="hidden" name="returnTab" value="agency" />
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="agencyName">
              Nom commercial *
            </label>
            <input
              id="agencyName"
              name="agencyName"
              required
              defaultValue={cfg.agencyName ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="legalName">
              Raison sociale
            </label>
            <input
              id="legalName"
              name="legalName"
              defaultValue={cfg.legalName ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="contactEmail">
              Courriel de contact
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={cfg.contactEmail ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="contactPhone">
              Téléphone de contact
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              defaultValue={cfg.contactPhone ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="website">
              Site web
            </label>
            <input id="website" name="website" defaultValue={cfg.website ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="timezone">
              Fuseau horaire
            </label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={cfg.timezone ?? "America/Toronto"}
              className="input"
            >
              <option value="America/Toronto">America/Toronto</option>
              <option value="America/Montreal">America/Montreal</option>
              <option value="Europe/Paris">Europe/Paris</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="label" htmlFor="street">
              Rue agence
            </label>
            <input id="street" name="street" defaultValue={cfg.street ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="city">
              Ville
            </label>
            <input id="city" name="city" defaultValue={cfg.city ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="province">
              Province
            </label>
            <input
              id="province"
              name="province"
              defaultValue={cfg.province ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="country">
              Pays
            </label>
            <input id="country" name="country" defaultValue={cfg.country ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="zipCode">
              Code postal
            </label>
            <input id="zipCode" name="zipCode" defaultValue={cfg.zipCode ?? ""} className="input" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="defaultCurrency">
              Devise par défaut
            </label>
            <select
              id="defaultCurrency"
              name="defaultCurrency"
              defaultValue={cfg.defaultCurrency ?? "CAD"}
              className="input"
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="defaultLanguage">
              Langue par défaut
            </label>
            <select
              id="defaultLanguage"
              name="defaultLanguage"
              defaultValue={cfg.defaultLanguage ?? "fr"}
              className="input"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bookingPrefix">
              Préfixe réservations
            </label>
            <input
              id="bookingPrefix"
              name="bookingPrefix"
              maxLength={6}
              defaultValue={cfg.bookingPrefix ?? "CR"}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="defaultDepositPct">
              Dépôt par défaut (%)
            </label>
            <input
              id="defaultDepositPct"
              name="defaultDepositPct"
              type="number"
              min={0}
              max={100}
              defaultValue={cfg.defaultDepositPct ?? 25}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="balanceDueDays">
              Solde dû (jours avant départ)
            </label>
            <input
              id="balanceDueDays"
              name="balanceDueDays"
              type="number"
              min={0}
              max={365}
              defaultValue={cfg.balanceDueDays ?? 45}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="passportAlertDays">
              Alerte passeport (jours)
            </label>
            <input
              id="passportAlertDays"
              name="passportAlertDays"
              type="number"
              min={1}
              max={3650}
              defaultValue={cfg.passportAlertDays ?? 180}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="defaultClientView">
              Vue clients par défaut
            </label>
            <select
              id="defaultClientView"
              name="defaultClientView"
              defaultValue={cfg.defaultClientView ?? "active"}
              className="input"
            >
              <option value="active">Actifs</option>
              <option value="all">Tous</option>
              <option value="archived">Archives</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="autoArchiveLostLeads"
                defaultChecked={!!cfg.autoArchiveLostLeads}
              />
              Archiver automatiquement les prospects perdus après conversion manuelle
            </label>
          </div>
        </div>

        <button className="btn-primary">Enregistrer les paramètres agence</button>
      </form>
    </section>
  );
}
