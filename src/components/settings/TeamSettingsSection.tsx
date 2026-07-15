import { createUser, resetUserPassword } from "@/app/(app)/settings/actions";
import { ResetUserPasswordModal } from "@/components/ResetUserPasswordModal";

type TeamSettingsSectionProps = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "AGENT";
  }>;
  returnTab: string;
};

export default function TeamSettingsSection({ users, returnTab }: TeamSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-semibold text-navy mb-4">Équipe</h2>
        <ul className="divide-y divide-slate-100 mb-5">
          {users.map((user) => (
            <li key={user.id} className="py-3 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-navy truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${user.role === "ADMIN" ? "bg-navy text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {user.role === "ADMIN" ? "Admin" : "Agent"}
                </span>
                <ResetUserPasswordModal
                  userLabel={`${user.name} (${user.email})`}
                  returnTab={returnTab}
                  action={resetUserPassword.bind(null, user.id)}
                />
              </div>
            </li>
          ))}
        </ul>
        <form action={createUser} className="space-y-3">
          <input type="hidden" name="returnTab" value={returnTab} />
          <h3 className="text-sm font-semibold text-navy">Ajouter un agent</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="u-name">
                Nom
              </label>
              <input id="u-name" name="name" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="u-email">
                Courriel
              </label>
              <input id="u-email" name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="u-pass">
                Mot de passe (8+ caractères)
              </label>
              <input
                id="u-pass"
                name="password"
                type="password"
                minLength={8}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="u-role">
                Rôle
              </label>
              <select id="u-role" name="role" className="input">
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <button className="btn-primary">Créer l&apos;utilisateur</button>
        </form>
      </section>
    </div>
  );
}
