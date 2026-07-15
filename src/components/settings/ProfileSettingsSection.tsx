import { updateMyPassword } from "@/app/(app)/settings/actions";

type ProfileSettingsSectionProps = {
  returnTab: string;
};

export default function ProfileSettingsSection({ returnTab }: ProfileSettingsSectionProps) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-navy mb-4">Sécurité du compte</h2>
      <form action={updateMyPassword} className="grid sm:grid-cols-3 gap-3 items-end">
        <input type="hidden" name="returnTab" value={returnTab} />
        <div>
          <label className="label" htmlFor="currentPassword">
            Mot de passe actuel
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">
            Nouveau mot de passe
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={8}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirmer
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={8}
            required
            className="input"
          />
        </div>
        <div className="sm:col-span-3">
          <button className="btn-secondary">Mettre à jour mon mot de passe</button>
        </div>
      </form>
    </section>
  );
}
