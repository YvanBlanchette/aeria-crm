"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CANADIAN_PROVINCES,
  DEFAULT_LANGUAGES,
  NATIONALITIES,
  US_STATES,
} from "@/lib/lookups/location-options";

type DatasetItem = {
  label?: string;
  value?: string;
};

type LanguagesDatasetResponse = {
  ok?: boolean;
  dataset?: {
    payload?: {
      items?: DatasetItem[];
    };
  };
};

function getDatasetLanguages(data: LanguagesDatasetResponse) {
  const items = data?.dataset?.payload?.items;
  if (!Array.isArray(items) || items.length === 0) return [];
  return items
    .map((item) => (item.label ?? item.value ?? "").trim())
    .filter((name): name is string => name.length > 0)
    .sort((a, b) => a.localeCompare(b));
}

type ClientLike = {
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  email?: string | null;
  secondaryEmail?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  preferredLanguage?: string | null;
  preferredContactMethod?: string | null;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: Date | null;
  passportIssueCountry?: string | null;
  passportIssueDate?: Date | null;
  passportPlaceOfBirth?: string | null;
  knownTravelerNumber?: string | null;
  tsaPrecheckNumber?: string | null;
  redressNumber?: string | null;
  cruiseLoyaltyPrograms?: string | null;
  airlineLoyaltyPrograms?: string | null;
  hotelLoyaltyPrograms?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactEmail?: string | null;
  street?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zipCode?: string | null;
  billingCompany?: string | null;
  billingTaxNumber?: string | null;
  billingStreet?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  billingCountry?: string | null;
  billingZipCode?: string | null;
  preferences?: string | null;
  roomPreferences?: string | null;
  dietaryRestrictions?: string | null;
  accessibilityNeeds?: string | null;
  specialOccasions?: string | null;
  travelInsuranceProvider?: string | null;
  travelInsurancePolicyNumber?: string | null;
  notes?: string | null;
};

function d(v?: Date | null) {
  return v ? new Date(v).toISOString().slice(0, 10) : "";
}

function hasValue(v?: string | null) {
  return !!v && v.trim().length > 0;
}

type OptionalSection =
  "identity" | "passport" | "loyalty" | "preferences" | "emergency" | "billing" | "insurance";

export function ClientForm({
  client,
  action,
  submitLabel,
}: {
  client?: ClientLike;
  action: (fd: FormData) => void;
  submitLabel: string;
}) {
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [selectedCountry, setSelectedCountry] = useState<string>(client?.country ?? "Canada");

  useEffect(() => {
    let active = true;

    async function loadLanguages() {
      try {
        const res = await fetch("/api/datasets?slug=languages", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as LanguagesDatasetResponse;
        if (!data.ok) return;

        const fromDataset = getDatasetLanguages(data);
        if (!fromDataset.length) return;

        if (active) setLanguages(["", ...fromDataset]);
      } catch {
        // Fallback to local language list when dataset API is unavailable.
      }
    }

    loadLanguages();
    return () => {
      active = false;
    };
  }, []);

  const initialSections = useMemo<Record<OptionalSection, boolean>>(
    () => ({
      identity:
        hasValue(client?.middleName) ||
        hasValue(client?.secondaryEmail) ||
        hasValue(client?.secondaryPhone) ||
        hasValue(client?.preferredLanguage) ||
        hasValue(client?.preferredContactMethod) ||
        !!client?.emailOptIn ||
        !!client?.smsOptIn,
      passport:
        hasValue(client?.passportIssueCountry) ||
        !!client?.passportIssueDate ||
        hasValue(client?.passportPlaceOfBirth) ||
        hasValue(client?.knownTravelerNumber) ||
        hasValue(client?.tsaPrecheckNumber) ||
        hasValue(client?.redressNumber),
      loyalty:
        hasValue(client?.cruiseLoyaltyPrograms) ||
        hasValue(client?.airlineLoyaltyPrograms) ||
        hasValue(client?.hotelLoyaltyPrograms),
      preferences:
        hasValue(client?.roomPreferences) ||
        hasValue(client?.dietaryRestrictions) ||
        hasValue(client?.accessibilityNeeds) ||
        hasValue(client?.specialOccasions),
      emergency:
        hasValue(client?.emergencyContactName) ||
        hasValue(client?.emergencyContactPhone) ||
        hasValue(client?.emergencyContactEmail) ||
        hasValue(client?.emergencyContactRelation),
      billing:
        hasValue(client?.billingCompany) ||
        hasValue(client?.billingTaxNumber) ||
        hasValue(client?.billingStreet) ||
        hasValue(client?.billingCity) ||
        hasValue(client?.billingProvince) ||
        hasValue(client?.billingCountry) ||
        hasValue(client?.billingZipCode),
      insurance:
        hasValue(client?.travelInsuranceProvider) || hasValue(client?.travelInsurancePolicyNumber),
    }),
    [client],
  );

  const [sections, setSections] = useState(initialSections);

  const toggleSection = (key: OptionalSection) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <form action={action} className="card p-6 space-y-5">
      {/* CORE IDENTITY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-semibold text-navy">Profil principal</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={`btn-secondary text-xs ${sections.passport ? "ring-2 ring-ocean/30" : ""}`}
              onClick={() => toggleSection("passport")}
            >
              Informations Passeport
            </button>
            <button
              type="button"
              className={`btn-secondary text-xs ${sections.loyalty ? "ring-2 ring-ocean/30" : ""}`}
              onClick={() => toggleSection("loyalty")}
            >
              Programmes fidélité
            </button>
            <button
              type="button"
              className={`btn-secondary text-xs ${sections.preferences ? "ring-2 ring-ocean/30" : ""}`}
              onClick={() => toggleSection("preferences")}
            >
              Préférences voyage
            </button>
            <button
              type="button"
              className={`btn-secondary text-xs ${sections.emergency ? "ring-2 ring-ocean/30" : ""}`}
              onClick={() => toggleSection("emergency")}
            >
              Contact urgence
            </button>
            <button
              type="button"
              className={`btn-secondary text-xs ${sections.billing ? "ring-2 ring-ocean/30" : ""}`}
              onClick={() => toggleSection("billing")}
            >
              Facturation
            </button>
            <button
              type="button"
              className={`btn-secondary text-xs ${sections.insurance ? "ring-2 ring-ocean/30" : ""}`}
              onClick={() => toggleSection("insurance")}
            >
              Assurance
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <div className="col-span-2 grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="firstName">
                Prenom *
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                defaultValue={client?.firstName}
                className="input"
                placeholder="Inscrire le prénom"
              />
            </div>
            <div>
              <label className="label" htmlFor="middleName">
                Autre prenoms
              </label>
              <input
                id="middleName"
                name="middleName"
                defaultValue={client?.middleName ?? ""}
                className="input"
                placeholder="Inscrire les autres prénoms"
              />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Nom *
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                defaultValue={client?.lastName}
                className="input"
                placeholder="Inscrire le nom de famille"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Courriel principal *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={client?.email ?? ""}
              className="input"
              placeholder="Inscrire le courriel principal"
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Telephone principal *
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={client?.phone ?? ""}
              className="input"
              placeholder="Inscrire le téléphone principal"
            />
          </div>
          <div>
            <label className="label" htmlFor="secondaryEmail">
              Courriel secondaire
            </label>
            <input
              id="secondaryEmail"
              name="secondaryEmail"
              type="email"
              defaultValue={client?.secondaryEmail ?? ""}
              className="input"
              placeholder="Inscrire le courriel secondaire"
            />
          </div>
          <div>
            <label className="label" htmlFor="secondaryPhone">
              Telephone secondaire
            </label>
            <input
              id="secondaryPhone"
              name="secondaryPhone"
              defaultValue={client?.secondaryPhone ?? ""}
              className="input"
              placeholder="Inscrire le téléphone secondaire"
            />
          </div>

          <div>
            <label className="label" htmlFor="dateOfBirth">
              Date de naissance
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={d(client?.dateOfBirth)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="nationality">
              Nationalité
            </label>
            <select
              id="nationality"
              name="nationality"
              defaultValue={client?.nationality ?? "Canada"}
              className="input"
            >
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* ADDRESS */}
          <div className="col-span-2 grid sm:grid-cols-2 gap-4">
            <div className="">
              <label className="label" htmlFor="street">
                Rue
              </label>
              <input
                id="street"
                name="street"
                defaultValue={client?.street ?? ""}
                className="input"
                placeholder="Inscrire la rue"
              />
            </div>
            <div>
              <label className="label" htmlFor="city">
                Ville
              </label>
              <input
                id="city"
                name="city"
                defaultValue={client?.city ?? ""}
                className="input"
                placeholder="Inscrire la ville"
              />
            </div>
            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label" htmlFor="province">
                  Province / Region
                </label>
                {selectedCountry === "Canada" ? (
                  <select
                    id="province"
                    name="province"
                    defaultValue={client?.province ?? "Québec"}
                    className="input"
                  >
                    {CANADIAN_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : selectedCountry === "United States" ? (
                  <select
                    id="province"
                    name="province"
                    defaultValue={client?.province ?? "New York"}
                    className="input"
                  >
                    {US_STATES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="province"
                    name="province"
                    defaultValue={client?.province ?? ""}
                    className="input"
                    placeholder="Inscrire la province"
                  />
                )}
              </div>
              <div>
                <label className="label" htmlFor="zipCode">
                  Code postal
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  defaultValue={client?.zipCode ?? ""}
                  className="input"
                  placeholder="Inscrire le code postal"
                />
              </div>
              <div>
                <label className="label" htmlFor="country">
                  Pays
                </label>
                <select
                  id="country"
                  name="country"
                  defaultValue={client?.country ?? "Canada"}
                  className="input"
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  {NATIONALITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="preferredLanguage">
              Langue préférée
            </label>
            <select
              id="preferredLanguage"
              name="preferredLanguage"
              defaultValue={client?.preferredLanguage ?? "French"}
              className="input"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="preferredContactMethod">
              Canal préféré
            </label>
            <select
              id="preferredContactMethod"
              name="preferredContactMethod"
              defaultValue={client?.preferredContactMethod ?? "Email"}
              className="input"
            >
              <option value="email">Email</option>
              <option value="phone">Téléphone</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="emailOptIn" defaultChecked={!!client?.emailOptIn} />
            Consentement communications marketing par email
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="smsOptIn" defaultChecked={!!client?.smsOptIn} />
            Consentement communications marketing par SMS
          </label>
        </div>
      </section>

      {/* --- PASSPORT INFORMATIONS SECTION --- */}
      {sections.passport && (
        <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <h2 className="font-semibold text-navy">Document de voyage principal</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="passportNumber">
                Numéro de passeport
              </label>
              <input
                id="passportNumber"
                name="passportNumber"
                defaultValue={client?.passportNumber ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="passportIssueDate">
                Date d'émission du passeport
              </label>
              <input
                id="passportIssueDate"
                name="passportIssueDate"
                type="date"
                defaultValue={d(client?.passportIssueDate)}
                className="input"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="passportIssueCountry">
                Pays d'émission du passeport
              </label>
              <input
                id="passportIssueCountry"
                name="passportIssueCountry"
                defaultValue={client?.passportIssueCountry ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="passportExpiry">
                Date d'expiration du passeport
              </label>
              <input
                id="passportExpiry"
                name="passportExpiry"
                type="date"
                defaultValue={d(client?.passportExpiry)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="passportPlaceOfBirth">
                Lieu de naissance (doc)
              </label>
              <input
                id="passportPlaceOfBirth"
                name="passportPlaceOfBirth"
                defaultValue={client?.passportPlaceOfBirth ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="knownTravelerNumber">
                Known Traveler Number
              </label>
              <input
                id="knownTravelerNumber"
                name="knownTravelerNumber"
                defaultValue={client?.knownTravelerNumber ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="tsaPrecheckNumber">
                TSA PreCheck
              </label>
              <input
                id="tsaPrecheckNumber"
                name="tsaPrecheckNumber"
                defaultValue={client?.tsaPrecheckNumber ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="redressNumber">
                Redress number
              </label>
              <input
                id="redressNumber"
                name="redressNumber"
                defaultValue={client?.redressNumber ?? ""}
                className="input"
              />
            </div>
          </div>
        </section>
      )}

      {/* --- LOYALTY PROGRAM SECTION ---- */}
      {sections.loyalty && (
        <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <h3 className="font-semibold text-navy">Programmes de fidelite</h3>
          <p className="text-xs text-slate-500">
            Un programme par ligne, format conseille: Compagnie - Numero - Niveau.
          </p>
          <div className="grid gap-4">
            <div>
              <label className="label" htmlFor="cruiseLoyaltyPrograms">
                Croisieres
              </label>
              <textarea
                id="cruiseLoyaltyPrograms"
                name="cruiseLoyaltyPrograms"
                rows={3}
                defaultValue={client?.cruiseLoyaltyPrograms ?? ""}
                className="input"
                placeholder="MSC Voyagers Club - 123456 - Gold"
              />
            </div>
            <div>
              <label className="label" htmlFor="airlineLoyaltyPrograms">
                Compagnies aeriennes
              </label>
              <textarea
                id="airlineLoyaltyPrograms"
                name="airlineLoyaltyPrograms"
                rows={3}
                defaultValue={client?.airlineLoyaltyPrograms ?? ""}
                className="input"
                placeholder="Air Canada Aeroplan - 99887766 - 25K"
              />
            </div>
            <div>
              <label className="label" htmlFor="hotelLoyaltyPrograms">
                Hotels
              </label>
              <textarea
                id="hotelLoyaltyPrograms"
                name="hotelLoyaltyPrograms"
                rows={3}
                defaultValue={client?.hotelLoyaltyPrograms ?? ""}
                className="input"
                placeholder="Marriott Bonvoy - 123456789 - Platinum"
              />
            </div>
          </div>
        </section>
      )}

      {/* --- TRAVEL PREFERENCES SECTION --- */}
      {sections.preferences && (
        <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <h3 className="font-semibold text-navy">Preferences voyage</h3>
          <div className="grid gap-4">
            <div>
              <label className="label" htmlFor="preferences">
                Preferences croisiere globales
              </label>
              <textarea
                id="preferences"
                name="preferences"
                rows={2}
                defaultValue={client?.preferences ?? ""}
                className="input"
                placeholder="Cabine balcon, pont haut, loin des ascenseurs..."
              />
            </div>
            <div>
              <label className="label" htmlFor="roomPreferences">
                Preferences chambre/cabine
              </label>
              <textarea
                id="roomPreferences"
                name="roomPreferences"
                rows={2}
                defaultValue={client?.roomPreferences ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="dietaryRestrictions">
                Restrictions alimentaires
              </label>
              <textarea
                id="dietaryRestrictions"
                name="dietaryRestrictions"
                rows={2}
                defaultValue={client?.dietaryRestrictions ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="accessibilityNeeds">
                Accessibilite / mobilite
              </label>
              <textarea
                id="accessibilityNeeds"
                name="accessibilityNeeds"
                rows={2}
                defaultValue={client?.accessibilityNeeds ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="specialOccasions">
                Occasions speciales
              </label>
              <textarea
                id="specialOccasions"
                name="specialOccasions"
                rows={2}
                defaultValue={client?.specialOccasions ?? ""}
                className="input"
                placeholder="Anniversaire, lune de miel, retraite..."
              />
            </div>
          </div>
        </section>
      )}

      {/* --- EMERGENCY CONTACT SECTION --- */}
      {sections.emergency && (
        <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <h3 className="font-semibold text-navy">Contact d'urgence</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="emergencyContactName">
                Nom complet
              </label>
              <input
                id="emergencyContactName"
                name="emergencyContactName"
                defaultValue={client?.emergencyContactName ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="emergencyContactRelation">
                Lien avec le client
              </label>
              <input
                id="emergencyContactRelation"
                name="emergencyContactRelation"
                defaultValue={client?.emergencyContactRelation ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="emergencyContactPhone">
                Telephone
              </label>
              <input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                defaultValue={client?.emergencyContactPhone ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="emergencyContactEmail">
                Courriel
              </label>
              <input
                id="emergencyContactEmail"
                name="emergencyContactEmail"
                type="email"
                defaultValue={client?.emergencyContactEmail ?? ""}
                className="input"
              />
            </div>
          </div>
        </section>
      )}

      {/* --- BILLING SECTION --- */}
      {sections.billing && (
        <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <h3 className="font-semibold text-navy">Facturation</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="billingCompany">
                Entreprise de facturation
              </label>
              <input
                id="billingCompany"
                name="billingCompany"
                defaultValue={client?.billingCompany ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="billingTaxNumber">
                Numero fiscal / TVQ-TPS
              </label>
              <input
                id="billingTaxNumber"
                name="billingTaxNumber"
                defaultValue={client?.billingTaxNumber ?? ""}
                className="input"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="label" htmlFor="billingStreet">
                Rue de facturation
              </label>
              <input
                id="billingStreet"
                name="billingStreet"
                defaultValue={client?.billingStreet ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="billingCity">
                Ville
              </label>
              <input
                id="billingCity"
                name="billingCity"
                defaultValue={client?.billingCity ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="billingProvince">
                Province
              </label>
              <input
                id="billingProvince"
                name="billingProvince"
                defaultValue={client?.billingProvince ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="billingCountry">
                Pays
              </label>
              <input
                id="billingCountry"
                name="billingCountry"
                defaultValue={client?.billingCountry ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="billingZipCode">
                Code postal
              </label>
              <input
                id="billingZipCode"
                name="billingZipCode"
                defaultValue={client?.billingZipCode ?? ""}
                className="input"
              />
            </div>
          </div>
        </section>
      )}

      {/* --- INSURANCE SECTION --- */}
      {sections.insurance && (
        <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <h3 className="font-semibold text-navy">Assurance voyage</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="travelInsuranceProvider">
                Fournisseur assurance
              </label>
              <input
                id="travelInsuranceProvider"
                name="travelInsuranceProvider"
                defaultValue={client?.travelInsuranceProvider ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="travelInsurancePolicyNumber">
                Numero de police
              </label>
              <input
                id="travelInsurancePolicyNumber"
                name="travelInsurancePolicyNumber"
                defaultValue={client?.travelInsurancePolicyNumber ?? ""}
                className="input"
              />
            </div>
          </div>
        </section>
      )}

      {/* --- NOTES SECTION --- */}
      <section className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
        <div>
          <label className="label" htmlFor="notes">
            Notes internes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={client?.notes ?? ""}
            className="input"
          />
        </div>
      </section>

      {/* --- SUBMIT BUTTON --- */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          className="ml-auto btn-primary uppercase tracking-wider bg-[#10243E] hover:opacity-70"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
