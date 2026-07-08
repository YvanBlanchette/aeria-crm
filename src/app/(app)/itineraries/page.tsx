import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { ItinerariesFiltersForm } from "@/components/ItinerariesFiltersForm";

export const dynamic = "force-dynamic";

const NIGHTS_PRESETS: Array<{ value: string; label: string; min?: number; max?: number }> = [
  { value: "", label: "Toutes les durees" },
  { value: "1-3", label: "1 a 3 nuits", min: 1, max: 3 },
  { value: "4-7", label: "4 a 7 nuits", min: 4, max: 7 },
  { value: "8-10", label: "8 a 10 nuits", min: 8, max: 10 },
  { value: "11-14", label: "11 a 14 nuits", min: 11, max: 14 },
  { value: "15+", label: "15 nuits et +", min: 15 },
];

const CREATED_PRESETS: Array<{ value: string; label: string; days?: number }> = [
  { value: "", label: "Toutes les dates" },
  { value: "7d", label: "7 derniers jours", days: 7 },
  { value: "30d", label: "30 derniers jours", days: 30 },
  { value: "90d", label: "90 derniers jours", days: 90 },
  { value: "365d", label: "12 derniers mois", days: 365 },
];

type SortBy = "createdAt" | "nights" | "line";
type SortDir = "asc" | "desc";
type FilterField = "line" | "shipId" | "departure" | "destination" | "nights" | "created";

type FilterState = {
  line: string;
  shipId: string;
  departure: string;
  destination: string;
  nightsPreset: string;
  createdPreset: string;
};

function normalizeSortBy(value: string | undefined): SortBy {
  if (value === "nights" || value === "line") return value;
  return "createdAt";
}

function normalizeSortDir(value: string | undefined): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function getNightsRange(nightsPreset: string) {
  const selectedNights = NIGHTS_PRESETS.find((p) => p.value === nightsPreset) ?? NIGHTS_PRESETS[0];
  return {
    min: selectedNights.min,
    max: selectedNights.max,
  };
}

function getCreatedFromDate(createdPreset: string) {
  const selectedCreated =
    CREATED_PRESETS.find((p) => p.value === createdPreset) ?? CREATED_PRESETS[0];
  if (!selectedCreated.days) return null;
  const createdFrom = new Date();
  createdFrom.setDate(createdFrom.getDate() - selectedCreated.days);
  return createdFrom;
}

function buildWhere(
  filters: FilterState,
  exclude?: FilterField,
): Prisma.ItineraryWhereInput | undefined {
  const andConditions: Prisma.ItineraryWhereInput[] = [];

  if (filters.line && exclude !== "line") {
    andConditions.push({ ship: { cruiseLine: { name: filters.line } } });
  }

  if (filters.shipId && exclude !== "shipId") {
    andConditions.push({ shipId: filters.shipId });
  }

  if (filters.departure && exclude !== "departure") {
    andConditions.push({ departurePort: { equals: filters.departure, mode: "insensitive" } });
  }

  if (filters.destination && exclude !== "destination") {
    andConditions.push({
      OR: [
        { departurePort: { equals: filters.destination, mode: "insensitive" } },
        { arrivalPort: { equals: filters.destination, mode: "insensitive" } },
        { days: { some: { port: { equals: filters.destination, mode: "insensitive" } } } },
        { days: { some: { country: { equals: filters.destination, mode: "insensitive" } } } },
      ],
    });
  }

  if (exclude !== "nights") {
    const nightsRange = getNightsRange(filters.nightsPreset);
    if (nightsRange.min !== undefined || nightsRange.max !== undefined) {
      andConditions.push({
        nights: {
          ...(nightsRange.min !== undefined ? { gte: nightsRange.min } : {}),
          ...(nightsRange.max !== undefined ? { lte: nightsRange.max } : {}),
        },
      });
    }
  }

  if (exclude !== "created") {
    const createdFrom = getCreatedFromDate(filters.createdPreset);
    if (createdFrom) {
      andConditions.push({ createdAt: { gte: createdFrom } });
    }
  }

  return andConditions.length > 0 ? { AND: andConditions } : undefined;
}

export default async function ItinerariesPage({
  searchParams,
}: {
  searchParams: {
    line?: string;
    ship?: string;
    departure?: string;
    destination?: string;
    nights?: string;
    created?: string;
    sortBy?: string;
    sortDir?: string;
  };
}) {
  await requireUser();
  const line = searchParams.line?.trim() ?? "";
  const shipId = searchParams.ship?.trim() ?? "";
  const departure = searchParams.departure?.trim() ?? "";
  const destination = searchParams.destination?.trim() ?? "";
  const nightsPreset = searchParams.nights ?? "";
  const createdPreset = searchParams.created ?? "";
  const sortBy = normalizeSortBy(searchParams.sortBy);
  const sortDir = normalizeSortDir(searchParams.sortDir);
  const filters: FilterState = {
    line,
    shipId,
    departure,
    destination,
    nightsPreset,
    createdPreset,
  };

  const where = buildWhere(filters);
  const whereForLine = buildWhere(filters, "line");
  const whereForShip = buildWhere(filters, "shipId");
  const whereForDeparture = buildWhere(filters, "departure");
  const whereForDestination = buildWhere(filters, "destination");
  const whereForNights = buildWhere(filters, "nights");
  const whereForCreated = buildWhere(filters, "created");

  const [
    rawItineraries,
    cruiseLines,
    ships,
    departurePorts,
    destinationCountries,
    destinationPorts,
    availableNights,
    availableCreatedDates,
  ] = await Promise.all([
    prisma.itinerary.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ship: { include: { cruiseLine: true } },
        days: { orderBy: { dayNumber: "asc" } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.cruiseLine.findMany({
      where: { ships: { some: { itineraries: { some: whereForLine ?? {} } } } },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.ship.findMany({
      where: { itineraries: { some: whereForShip ?? {} } },
      orderBy: [{ cruiseLine: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        cruiseLine: { select: { name: true } },
      },
    }),
    prisma.itinerary.findMany({
      where: {
        ...(whereForDeparture ?? {}),
        departurePort: { not: "" },
      },
      select: { departurePort: true },
      distinct: ["departurePort"],
      orderBy: { departurePort: "asc" },
    }),
    prisma.itineraryDay.findMany({
      where: {
        country: { not: null },
        itinerary: whereForDestination,
      },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
    prisma.itineraryDay.findMany({
      where: {
        port: { not: "" },
        isSeaDay: false,
        itinerary: whereForDestination,
      },
      select: { port: true },
      distinct: ["port"],
      orderBy: { port: "asc" },
      take: 250,
    }),
    prisma.itinerary.findMany({
      where: whereForNights,
      select: { nights: true },
      distinct: ["nights"],
      orderBy: { nights: "asc" },
    }),
    prisma.itinerary.findMany({
      where: whereForCreated,
      select: { createdAt: true },
    }),
  ]);

  const itineraries = [...rawItineraries].sort((a, b) => {
    const factor = sortDir === "asc" ? 1 : -1;
    if (sortBy === "nights") {
      return (a.nights - b.nights) * factor;
    }
    if (sortBy === "line") {
      const aLine = a.ship?.cruiseLine.name ?? "";
      const bLine = b.ship?.cruiseLine.name ?? "";
      return aLine.localeCompare(bLine, "fr", { sensitivity: "base" }) * factor;
    }
    return (a.createdAt.getTime() - b.createdAt.getTime()) * factor;
  });

  const destinationCountryOptions = destinationCountries
    .map((item) => item.country)
    .filter((value): value is string => Boolean(value));
  const destinationPortOptions = destinationPorts.map((item) => item.port);
  const shipOptions = ships.map((ship) => ({
    value: ship.id,
    label: `${ship.cruiseLine.name} · ${ship.name}`,
  }));
  const availableNightsValues = new Set(availableNights.map((item) => item.nights));
  const nightSelectOptions = NIGHTS_PRESETS.filter((preset) => {
    if (!preset.value) return availableNightsValues.size > 0 || nightsPreset === "";
    const hasMatch = Array.from(availableNightsValues).some((n) => {
      if (preset.min !== undefined && n < preset.min) return false;
      if (preset.max !== undefined && n > preset.max) return false;
      return true;
    });
    return hasMatch || preset.value === nightsPreset;
  });

  const nowMs = Date.now();
  const createdTimestamps = availableCreatedDates.map((item) => item.createdAt.getTime());
  const createdSelectOptions = CREATED_PRESETS.filter((preset) => {
    if (!preset.value) return createdTimestamps.length > 0 || createdPreset === "";
    if (!preset.days) return true;
    const cutoff = nowMs - preset.days * 24 * 60 * 60 * 1000;
    const hasMatch = createdTimestamps.some((timestamp) => timestamp >= cutoff);
    return hasMatch || preset.value === createdPreset;
  });

  const makeSortHref = (targetSortBy: SortBy) => {
    const params = new URLSearchParams();
    if (line) params.set("line", line);
    if (shipId) params.set("ship", shipId);
    if (departure) params.set("departure", departure);
    if (destination) params.set("destination", destination);
    if (nightsPreset) params.set("nights", nightsPreset);
    if (createdPreset) params.set("created", createdPreset);

    const nextSortDir = sortBy === targetSortBy ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    params.set("sortBy", targetSortBy);
    params.set("sortDir", nextSortDir);
    return `/itineraries?${params.toString()}`;
  };

  const getSortIndicator = (targetSortBy: SortBy) => {
    if (sortBy !== targetSortBy) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="space-y-5">
      <ItinerariesFiltersForm
        line={line}
        shipId={shipId}
        departure={departure}
        destination={destination}
        nightsPreset={nightsPreset}
        createdPreset={createdPreset}
        sortBy={sortBy}
        sortDir={sortDir}
        resultCount={itineraries.length}
        cruiseLines={cruiseLines.map((cl) => cl.name)}
        ships={shipOptions}
        departurePorts={departurePorts.map((item) => item.departurePort)}
        destinationCountries={destinationCountryOptions}
        destinationPorts={destinationPortOptions}
        nightSelectOptions={nightSelectOptions.map((preset) => ({
          value: preset.value,
          label: preset.label,
        }))}
        createdSelectOptions={createdSelectOptions.map((preset) => ({
          value: preset.value,
          label: preset.label,
        }))}
      />

      {itineraries.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">Aucun itineraire ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* ITINERARIES TABLE */}
          <div className="max-h-[80vh] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-navy border-b border-navy-700">
                <tr>
                  <th className="table-th">Itinéraire</th>
                  <th className="table-th">
                    <Link href={makeSortHref("line")} className="hover:text-ocean">
                      Compagnie
                      <span className="text-[10px] text-slate-300">{getSortIndicator("line")}</span>
                    </Link>
                  </th>
                  <th className="table-th">Navire</th>
                  <th className="table-th">
                    <Link href={makeSortHref("nights")} className="hover:text-ocean">
                      Nuits
                      <span className="text-[10px] text-slate-300">
                        {getSortIndicator("nights")}
                      </span>
                    </Link>
                  </th>
                  <th className="table-th">Départ / Arrivée</th>
                  <th className="table-th">Parcours</th>
                  <th className="table-th">
                    <Link href={makeSortHref("createdAt")} className="hover:text-ocean">
                      Date d'ajout
                      <span className="text-[10px] text-slate-300">
                        {getSortIndicator("createdAt")}
                      </span>
                    </Link>
                  </th>
                  <th className="table-th">Réservations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itineraries.map((it, index) => {
                  const ports = it.days.filter((d) => !d.isSeaDay).map((d) => d.port);
                  return (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className={`table-td ${index % 2 === 0 ? "bg-slate-100" : ""}`}>
                        <Link
                          href={`/itineraries/${it.id}`}
                          className="font-semibold text-navy hover:text-ocean"
                        >
                          {it.name}
                        </Link>
                      </td>
                      <td
                        className={`table-td text-slate-600 ${index % 2 === 0 ? "bg-slate-100" : ""}`}
                      >
                        {it.ship?.cruiseLine.name ?? "-"}
                      </td>
                      <td
                        className={`table-td text-slate-600 ${index % 2 === 0 ? "bg-slate-100" : ""}`}
                      >
                        {it.ship?.name ?? "-"}
                      </td>
                      <td className={`table-td ${index % 2 === 0 ? "bg-slate-100" : ""}`}>
                        {it.nights}
                      </td>
                      <td
                        className={`table-td text-slate-600 ${index % 2 === 0 ? "bg-slate-100" : ""}`}
                      >
                        {it.departurePort}
                        {it.arrivalPort ? ` / ${it.arrivalPort}` : ""}
                      </td>
                      <td
                        className={`table-td max-w-xs text-slate-500 truncate ${index % 2 === 0 ? "bg-slate-100" : ""}`}
                        title={ports.join(" -> ")}
                      >
                        {ports.slice(0, 6).join(" -> ")}
                        {ports.length > 6 ? " -> ..." : ""}
                      </td>
                      <td
                        className={`table-td text-slate-600 ${index % 2 === 0 ? "bg-slate-100" : ""}`}
                      >
                        {fmtDate(it.createdAt)}
                      </td>
                      <td className={`table-td ${index % 2 === 0 ? "bg-slate-100" : ""}`}>
                        {it._count.bookings}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
