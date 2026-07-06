import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addCruiseLine, addShip, deleteShip, createUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [lines, users] = await Promise.all([
    prisma.cruiseLine.findMany({ orderBy: { name: "asc" }, include: { ships: { orderBy: { name: "asc" } } } }),
    user.role === "ADMIN" ? prisma.user.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Paramètres</h1>

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
          {user.role === "ADMIN" && (
            <section className="card p-5">
              <h2 className="font-semibold text-navy mb-4">Équipe</h2>
              <ul className="divide-y divide-slate-100 mb-5">
                {users.map((u) => (
                  <li key={u.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-navy">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <span className={`badge ${u.role === "ADMIN" ? "bg-navy text-white" : "bg-slate-100 text-slate-600"}`}>
                      {u.role === "ADMIN" ? "Admin" : "Agent"}
                    </span>
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
