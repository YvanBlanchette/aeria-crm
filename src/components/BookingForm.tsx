import { BOOKING_STATUS_LABELS, CABIN_LABELS } from "@/lib/format";

type Option = { id: string; label: string };
type BookingLike = {
  clientId?: string; itineraryId?: string | null; sailingDate?: Date; returnDate?: Date | null;
  cabinType?: string; cabinNumber?: string | null; passengers?: number;
  totalPrice?: unknown; deposit?: unknown; commission?: unknown;
  balanceDueDate?: Date | null; status?: string; notes?: string | null;
};

function d(v?: Date | null) {
  return v ? new Date(v).toISOString().slice(0, 10) : "";
}
function n(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

export function BookingForm({
  clients, itineraries, booking, action, submitLabel, defaultClientId, lockClient,
}: {
  clients: Option[];
  itineraries: Option[];
  booking?: BookingLike;
  action: (fd: FormData) => void;
  submitLabel: string;
  defaultClientId?: string;
  lockClient?: boolean;
}) {
  return (
    <form action={action} className="card p-6 space-y-5 max-w-3xl">
      {!lockClient && (
        <div>
          <label className="label" htmlFor="clientId">Client *</label>
          <select id="clientId" name="clientId" required defaultValue={booking?.clientId ?? defaultClientId ?? ""} className="input">
            <option value="" disabled>Choisir un client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="itineraryId">Itinéraire</label>
        <select id="itineraryId" name="itineraryId" defaultValue={booking?.itineraryId ?? ""} className="input">
          <option value="">— Sans itinéraire (à définir) —</option>
          {itineraries.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
        </select>
        <p className="text-xs text-slate-500 mt-1">La date de retour se calcule automatiquement à partir des nuits de l&apos;itinéraire si laissée vide.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label" htmlFor="sailingDate">Date de départ *</label>
          <input id="sailingDate" name="sailingDate" type="date" required defaultValue={d(booking?.sailingDate)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="returnDate">Date de retour</label>
          <input id="returnDate" name="returnDate" type="date" defaultValue={d(booking?.returnDate)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="passengers">Passagers</label>
          <input id="passengers" name="passengers" type="number" min="1" defaultValue={booking?.passengers ?? 2} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cabinType">Type de cabine</label>
          <select id="cabinType" name="cabinType" defaultValue={booking?.cabinType ?? "BALCONY"} className="input">
            {Object.entries(CABIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cabinNumber">Numéro de cabine</label>
          <input id="cabinNumber" name="cabinNumber" defaultValue={booking?.cabinNumber ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="status">Statut</label>
          <select id="status" name="status" defaultValue={booking?.status ?? "OPTION"} className="input">
            {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="totalPrice">Prix total (CAD) *</label>
          <input id="totalPrice" name="totalPrice" type="number" min="0" step="0.01" required defaultValue={n(booking?.totalPrice)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="deposit">Dépôt reçu</label>
          <input id="deposit" name="deposit" type="number" min="0" step="0.01" defaultValue={n(booking?.deposit)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="commission">Commission</label>
          <input id="commission" name="commission" type="number" min="0" step="0.01" defaultValue={n(booking?.commission)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="balanceDueDate">Solde dû le</label>
          <input id="balanceDueDate" name="balanceDueDate" type="date" defaultValue={d(booking?.balanceDueDate)} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={booking?.notes ?? ""} className="input"
          placeholder="Demandes spéciales, forfait boissons, excursions réservées…" />
      </div>
      <button className="btn-primary">{submitLabel}</button>
    </form>
  );
}
