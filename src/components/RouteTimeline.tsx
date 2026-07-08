type Day = {
  id: string;
  dayNumber: number;
  port: string;
  country?: string | null;
  arrival?: string | null;
  departure?: string | null;
  isSeaDay: boolean;
  notes?: string | null;
};

/**
 * Ligne de route : visualisation verticale des escales d'une croisière.
 * Les ports sont des nœuds pleins, les journées en mer des nœuds en pointillé —
 * comme un carnet de navigation.
 */
export function RouteTimeline({
  days,
  actions,
}: {
  days: Day[];
  actions?: (day: Day) => React.ReactNode;
}) {
  if (days.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aucune escale. Ajoutez le premier jour de l&apos;itinéraire.
      </p>
    );
  }
  return (
    <ol className="relative ml-3">
      {days.map((d, i) => (
        <li key={d.id} className="relative pl-8 pb-6 last:pb-0">
          {i < days.length - 1 && (
            <span
              aria-hidden
              className={`absolute left-[7px] top-5 bottom-0 w-0.5 ${d.isSeaDay || days[i + 1].isSeaDay ? "border-l-2 border-dashed border-ocean/40" : "bg-ocean/60"}`}
            />
          )}
          <span
            aria-hidden
            className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${
              d.isSeaDay ? "border-dashed border-ocean/50 bg-white" : "border-ocean bg-ocean-100"
            }`}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Jour {d.dayNumber}
              </p>
              <p
                className={`text-sm font-medium ${d.isSeaDay ? "text-slate-500 italic" : "text-navy"}`}
              >
                {d.port}
                {d.country && <span className="text-slate-400 font-normal"> · {d.country}</span>}
              </p>
              {(d.arrival || d.departure) && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {d.arrival && <>Arrivée {d.arrival}</>}
                  {d.arrival && d.departure && " — "}
                  {d.departure && <>Départ {d.departure}</>}
                </p>
              )}
              {d.notes && <p className="text-xs text-slate-500 mt-1">{d.notes}</p>}
            </div>
            {actions && <div className="shrink-0">{actions(d)}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
