import type { ReactNode } from "react";
import { addCruiseLine, addShip, deleteShip } from "@/app/(app)/settings/actions";
import DatasetsUploader from "@/components/DatasetsUploader";

type DataSettingsSectionProps = {
  activeSubtab: string;
  lines: Array<{
    id: string;
    name: string;
    ships: Array<{ id: string; name: string }>;
  }>;
  itineraries: Array<{
    id: string;
    name: string;
    nights: number;
    departurePort: string;
    arrivalPort: string | null;
    source: string;
    providerName: string | null;
    externalId: string | null;
    ship: { name: string } | null;
  }>;
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-navy">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DataSettingsSection({
  activeSubtab,
  lines,
  itineraries,
}: DataSettingsSectionProps) {
  if (activeSubtab === "ships") {
    return (
      <SectionCard
        title="Navires"
        description="Ajoutez ou retirez les navires rattachés à chaque compagnie."
      >
        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.id} className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-navy">{line.name}</h3>
              <ul className="mt-2 space-y-2">
                {line.ships.map((ship) => {
                  const remove = deleteShip.bind(null, ship.id);
                  return (
                    <li
                      key={ship.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <span>⛴ {ship.name}</span>
                      <form action={remove}>
                        <input type="hidden" name="returnTab" value="data" />
                        <input type="hidden" name="returnSubtab" value="ships" />
                        <button
                          className="text-xs text-slate-400 hover:text-red-600"
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
              <form action={addShip} className="mt-3 flex gap-2">
                <input type="hidden" name="cruiseLineId" value={line.id} />
                <input type="hidden" name="returnTab" value="data" />
                <input type="hidden" name="returnSubtab" value="ships" />
                <label htmlFor={`ship-${line.id}`} className="sr-only">
                  Nom du navire
                </label>
                <input
                  id={`ship-${line.id}`}
                  name="name"
                  required
                  className="input flex-1 text-sm"
                  placeholder="Ajouter un navire…"
                />
                <button className="btn-secondary text-xs">+</button>
              </form>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  if (activeSubtab === "itineraries") {
    return (
      <div className="space-y-6">
        <SectionCard
          title="Itinéraires"
          description="Consultez vos itinéraires importés et préparez les datasets de croisière."
        >
          {itineraries.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun itinéraire trouvé.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Nuits</th>
                    <th className="px-4 py-3">Départ</th>
                    <th className="px-4 py-3">Navire</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {itineraries.map((itinerary) => (
                    <tr key={itinerary.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-navy">{itinerary.name}</td>
                      <td className="px-4 py-3 text-slate-600">{itinerary.nights}</td>
                      <td className="px-4 py-3 text-slate-600">{itinerary.departurePort}</td>
                      <td className="px-4 py-3 text-slate-600">{itinerary.ship?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {itinerary.source === "API" ? (itinerary.providerName ?? "API") : "Manuel"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Fournisseurs de données"
          description="Le CRM est prêt à recevoir des fournisseurs d'itinéraires externes."
        >
          <p className="text-sm text-slate-600">
            L&apos;architecture se trouve dans{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">src/lib/providers/</code>.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Fournisseur actif : Catalogue interne (itinéraires manuels).
          </p>
        </SectionCard>

        <SectionCard
          title="Datasets JSON"
          description="Chargez ou remplacez les datasets importés par le CRM."
        >
          <DatasetsUploader />
        </SectionCard>
      </div>
    );
  }

  return (
    <SectionCard
      title="Compagnies"
      description="Gérez les compagnies de croisière de votre catalogue interne."
    >
      <form action={addCruiseLine} className="flex gap-2 mb-5">
        <input type="hidden" name="returnTab" value="data" />
        <input type="hidden" name="returnSubtab" value="cruise-lines" />
        <label htmlFor="new-line" className="sr-only">
          Nom de la compagnie
        </label>
        <input
          id="new-line"
          name="name"
          required
          className="input flex-1"
          placeholder="Nouvelle compagnie (ex. : Princess Cruises)"
        />
        <button className="btn-secondary">Ajouter</button>
      </form>

      <div className="space-y-4">
        {lines.map((line) => (
          <div key={line.id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-navy">{line.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{line.ships.length} navire(s)</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
