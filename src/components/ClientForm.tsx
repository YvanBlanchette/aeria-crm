type ClientLike = {
  firstName?: string; lastName?: string; email?: string | null; phone?: string | null;
  dateOfBirth?: Date | null; nationality?: string | null; passportNumber?: string | null;
  passportExpiry?: Date | null; address?: string | null; preferences?: string | null; notes?: string | null;
};

function d(v?: Date | null) {
  return v ? new Date(v).toISOString().slice(0, 10) : "";
}

export function ClientForm({ client, action, submitLabel }: { client?: ClientLike; action: (fd: FormData) => void; submitLabel: string }) {
  return (
    <form action={action} className="card p-6 space-y-5 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="firstName">Prénom *</label>
          <input id="firstName" name="firstName" required defaultValue={client?.firstName} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom *</label>
          <input id="lastName" name="lastName" required defaultValue={client?.lastName} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Courriel</label>
          <input id="email" name="email" type="email" defaultValue={client?.email ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Téléphone</label>
          <input id="phone" name="phone" defaultValue={client?.phone ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="dateOfBirth">Date de naissance</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={d(client?.dateOfBirth)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="nationality">Nationalité</label>
          <input id="nationality" name="nationality" defaultValue={client?.nationality ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="passportNumber">Numéro de passeport</label>
          <input id="passportNumber" name="passportNumber" defaultValue={client?.passportNumber ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="passportExpiry">Expiration du passeport</label>
          <input id="passportExpiry" name="passportExpiry" type="date" defaultValue={d(client?.passportExpiry)} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address">Adresse</label>
        <input id="address" name="address" defaultValue={client?.address ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="preferences">Préférences croisière</label>
        <textarea id="preferences" name="preferences" rows={2} defaultValue={client?.preferences ?? ""} className="input"
          placeholder="Type de cabine, compagnies favorites, allergies, mobilité réduite…" />
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes internes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} className="input" />
      </div>
      <button type="submit" className="btn-primary">{submitLabel}</button>
    </form>
  );
}
