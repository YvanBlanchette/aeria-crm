import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney, BOOKING_STATUS_LABELS } from "@/lib/format";
import { decryptPassportNumber } from "@/lib/passport";
import { updateClient, deleteClient, restoreClient } from "../actions";
import { ClientForm } from "@/components/ClientForm";
import { ConfirmActionForm } from "@/components/ConfirmActionForm";
import { PassportReveal } from "@/components/PassportReveal";

function getStringField(source: unknown, key: string) {
  if (!source || typeof source !== "object") return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function formatAddress(parts: {
  street?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zipCode?: string | null;
}) {
  const value = [parts.street, parts.city, parts.province, parts.country, parts.zipCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  return value || "—";
}

export const dynamic = "force-dynamic";

export default async function ClientDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string; restored?: string };
}) {
  await requireUser();
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      bookings: {
        orderBy: { sailingDate: "desc" },
        include: { itinerary: { include: { ship: true } } },
      },
      leads: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!client) notFound();

  const clientAddress = {
    street: getStringField(client, "street"),
    city: getStringField(client, "city"),
    province: getStringField(client, "province"),
    country: getStringField(client, "country"),
    zipCode: getStringField(client, "zipCode"),
  };
  const billingAddress = {
    street: getStringField(client, "billingStreet"),
    city: getStringField(client, "billingCity"),
    province: getStringField(client, "billingProvince"),
    country: getStringField(client, "billingCountry"),
    zipCode: getStringField(client, "billingZipCode"),
  };

  const editing = searchParams.edit === "1";
  const updateAction = updateClient.bind(null, client.id);
  const deleteAction = deleteClient.bind(null, client.id);
  const restoreAction = restoreClient.bind(null, client.id);
  const hasEmergency = !!(
    client.emergencyContactName ||
    client.emergencyContactPhone ||
    client.emergencyContactEmail
  );
  const hasLoyalty = !!(
    client.cruiseLoyaltyPrograms ||
    client.airlineLoyaltyPrograms ||
    client.hotelLoyaltyPrograms
  );
  const hasTravelFlags = !!(
    client.knownTravelerNumber ||
    client.tsaPrecheckNumber ||
    client.redressNumber
  );
  const hasPreferences = !!(
    client.roomPreferences ||
    client.dietaryRestrictions ||
    client.accessibilityNeeds ||
    client.specialOccasions
  );
  const hasBilling = !!(
    client.billingCompany ||
    client.billingTaxNumber ||
    billingAddress.street ||
    billingAddress.city ||
    billingAddress.province ||
    billingAddress.country ||
    billingAddress.zipCode
  );
  const hasInsurance = !!(client.travelInsuranceProvider || client.travelInsurancePolicyNumber);
  const clientForForm = {
    ...client,
    passportNumber: decryptPassportNumber(client.passportNumber),
  };

  return (
    <div className="space-y-5 overflow-y-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/clients" className="text-sm text-slate-500 hover:text-ocean">
            ← Clients
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-1">
            {client.firstName} {client.lastName}
          </h1>
        </div>
        <div className="flex gap-2">
          {!editing && !client.archivedAt && (
            <Link href={`/clients/${client.id}?edit=1`} className="btn-secondary">
              Modifier
            </Link>
          )}
          {client.archivedAt ? (
            <form action={restoreAction}>
              <button className="btn-primary">Restaurer</button>
            </form>
          ) : (
            <ConfirmActionForm
              action={deleteAction}
              buttonLabel="Archiver"
              buttonClassName="btn-danger"
              title="Archiver ce contact client ?"
              message="Le contact sera retire des listes actives, sans perte d'historique."
              confirmLabel="Oui, archiver"
            />
          )}
        </div>
      </div>

      {client.archivedAt && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Ce contact est archive depuis le {fmtDate(client.archivedAt)}. Vous pouvez le restaurer
          quand vous voulez.
        </p>
      )}

      {searchParams.restored === "1" && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          Contact restaure avec succes.
        </p>
      )}

      {editing ? (
        <ClientForm client={clientForForm} action={updateAction} submitLabel="Enregistrer" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* BASIC INFORMATIONS */}
          <section className="card p-5 space-y-3">
            <h2 className="font-semibold text-navy">Coordonnées</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="label">Autre prénoms</dt>
                <dd>{client.middleName ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Courriel</dt>
                <dd>{client.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Courriel secondaire</dt>
                <dd>{client.secondaryEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Téléphone</dt>
                <dd>{client.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Telephone secondaire</dt>
                <dd>{client.secondaryPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Adresse</dt>
                <dd>{formatAddress(clientAddress)}</dd>
              </div>
              <div>
                <dt className="label">Date de naissance</dt>
                <dd>{fmtDate(client.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="label">Langue preferee</dt>
                <dd>{client.preferredLanguage ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Canal prefere</dt>
                <dd>{client.preferredContactMethod ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Consentement email</dt>
                <dd>{client.emailOptIn ? "Oui" : "Non"}</dd>
              </div>
              <div>
                <dt className="label">Consentement SMS</dt>
                <dd>{client.smsOptIn ? "Oui" : "Non"}</dd>
              </div>
            </dl>
          </section>

          {/* PASSPORT INFORMATIONS */}
          <section className="card p-5 space-y-3">
            <h2 className="font-semibold text-navy">Documents de voyage</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="label">Nationalité</dt>
                <dd>{client.nationality ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Passeport</dt>
                <dd>
                  <PassportReveal clientId={client.id} hasValue={!!client.passportNumber} />
                </dd>
              </div>
              <div>
                <dt className="label">Pays d'emission</dt>
                <dd>{client.passportIssueCountry ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Date d'emission</dt>
                <dd>{fmtDate(client.passportIssueDate)}</dd>
              </div>
              <div>
                <dt className="label">Lieu de naissance</dt>
                <dd>{client.passportPlaceOfBirth ?? "—"}</dd>
              </div>
              <div>
                <dt className="label">Expiration</dt>
                <dd>
                  {fmtDate(client.passportExpiry)}
                  {client.passportExpiry &&
                    client.passportExpiry < new Date(Date.now() + 1000 * 60 * 60 * 24 * 180) && (
                      <span className="badge bg-amber-100 text-amber-800 ml-2">
                        Expire dans moins de 6 mois
                      </span>
                    )}
                </dd>
              </div>
              {hasTravelFlags && (
                <>
                  <div>
                    <dt className="label">Known Traveler</dt>
                    <dd>{client.knownTravelerNumber ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="label">TSA PreCheck</dt>
                    <dd>{client.tsaPrecheckNumber ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="label">Redress number</dt>
                    <dd>{client.redressNumber ?? "—"}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          {/* PREFERENCES & NOTES */}
          <section className="card p-5 space-y-3">
            <h2 className="font-semibold text-navy">Préférences &amp; notes</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="label">Préférences croisière</dt>
                <dd className="whitespace-pre-wrap">{client.preferences ?? "—"}</dd>
              </div>
              {hasPreferences && (
                <>
                  <div>
                    <dt className="label">Preferences cabine/chambre</dt>
                    <dd className="whitespace-pre-wrap">{client.roomPreferences ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="label">Restrictions alimentaires</dt>
                    <dd className="whitespace-pre-wrap">{client.dietaryRestrictions ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="label">Accessibilite / mobilite</dt>
                    <dd className="whitespace-pre-wrap">{client.accessibilityNeeds ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="label">Occasions speciales</dt>
                    <dd className="whitespace-pre-wrap">{client.specialOccasions ?? "—"}</dd>
                  </div>
                </>
              )}
              <div>
                <dt className="label">Notes internes</dt>
                <dd className="whitespace-pre-wrap">{client.notes ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {/* LOYALTY PROGRAMS */}
      {!editing && (hasLoyalty || hasEmergency || hasBilling || hasInsurance) && (
        <div className="grid lg:grid-cols-2 gap-5">
          {hasLoyalty && (
            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Programmes de fidelite</h2>
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="label">Croisieres</dt>
                  <dd className="whitespace-pre-wrap">{client.cruiseLoyaltyPrograms ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Airlines</dt>
                  <dd className="whitespace-pre-wrap">{client.airlineLoyaltyPrograms ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Hotels</dt>
                  <dd className="whitespace-pre-wrap">{client.hotelLoyaltyPrograms ?? "—"}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* EMERGENCY CONTACT */}
          {hasEmergency && (
            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Contact d'urgence</h2>
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="label">Nom</dt>
                  <dd>{client.emergencyContactName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Relation</dt>
                  <dd>{client.emergencyContactRelation ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Telephone</dt>
                  <dd>{client.emergencyContactPhone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Courriel</dt>
                  <dd>{client.emergencyContactEmail ?? "—"}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* ENTERPRISE BILLING */}
          {hasBilling && (
            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Facturation</h2>
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="label">Entreprise</dt>
                  <dd>{client.billingCompany ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Numero fiscal</dt>
                  <dd>{client.billingTaxNumber ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Adresse de facturation</dt>
                  <dd>{formatAddress(billingAddress)}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* TRAVEL INSURANCE */}
          {hasInsurance && (
            <section className="card p-5 space-y-3">
              <h2 className="font-semibold text-navy">Assurance voyage</h2>
              <dl className="text-sm space-y-2">
                <div>
                  <dt className="label">Fournisseur</dt>
                  <dd>{client.travelInsuranceProvider ?? "—"}</dd>
                </div>
                <div>
                  <dt className="label">Police</dt>
                  <dd>{client.travelInsurancePolicyNumber ?? "—"}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      )}

      {/* BOOKING HISTORY */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy">Historique des croisières</h2>
          <Link href={`/bookings/new?clientId=${client.id}`} className="btn-primary text-xs">
            + Réservation
          </Link>
        </div>
        {client.bookings.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aucune réservation pour ce client.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="table-th">Référence</th>
                <th className="table-th">Croisière</th>
                <th className="table-th">Départ</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="font-medium text-ocean hover:underline"
                    >
                      {b.reference}
                    </Link>
                  </td>
                  <td className="table-td text-slate-600">
                    {b.itinerary?.name ?? "—"}
                    {b.itinerary?.ship ? ` · ${b.itinerary.ship.name}` : ""}
                  </td>
                  <td className="table-td">{fmtDate(b.sailingDate)}</td>
                  <td className="table-td">{fmtMoney(b.totalPrice)}</td>
                  <td className="table-td">{BOOKING_STATUS_LABELS[b.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
