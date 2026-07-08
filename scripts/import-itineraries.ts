import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient, ItinerarySource } from "@prisma/client";

const prisma = new PrismaClient();

type CsvRow = {
  "Itinerary Id": string;
  "Cruise Line": string;
  "Ship Name": string;
  Date: string;
  Time: string;
  Port: string;
  "Max Passengers": string;
  Crew: string;
};

type NormalizedDay = {
  date: string;
  port: string;
  arrival: string | null;
  departure: string | null;
  isSeaDay: boolean;
  country: string | null;
};

type ImportSummary = {
  csvPath: string;
  rowsRead: number;
  itinerariesProcessed: number;
  itinerariesCreated: number;
  itinerariesUpdated: number;
};

function toInt(value: string | null | undefined) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parsePortCountry(port: string) {
  const tokens = port
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length < 2) return null;
  return tokens[tokens.length - 1] ?? null;
}

function parseTimeRange(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return { arrival: null, departure: null };

  if (raw.includes("-")) {
    const [left, right] = raw.split("-").map((part) => part.trim());
    return {
      arrival: left || null,
      departure: right || null,
    };
  }

  return { arrival: raw, departure: null };
}

function normalizeDay(row: CsvRow): NormalizedDay {
  const port = String(row.Port ?? "").trim();
  const time = parseTimeRange(row.Time);
  return {
    date: String(row.Date ?? "").trim(),
    port,
    arrival: time.arrival,
    departure: time.departure,
    isSeaDay: /^at sea$/i.test(port),
    country: parsePortCountry(port),
  };
}

function groupRows(rows: CsvRow[]) {
  const groups = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const itineraryId = String(row["Itinerary Id"] ?? "").trim();
    if (!itineraryId) continue;
    if (!groups.has(itineraryId)) groups.set(itineraryId, []);
    groups.get(itineraryId)?.push(row);
  }
  return groups;
}

function dedupeAndSortDays(rows: CsvRow[]) {
  const byDate = new Map<string, NormalizedDay>();

  for (const row of rows) {
    const day = normalizeDay(row);
    if (!day.date) continue;
    if (!byDate.has(day.date)) {
      byDate.set(day.date, day);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function getOrCreateShip(cruiseLineId: string, shipName: string, capacity: number | null) {
  const existing = await prisma.ship.findFirst({
    where: {
      cruiseLineId,
      name: shipName,
    },
    select: { id: true },
  });

  if (existing) {
    if (capacity !== null) {
      await prisma.ship.update({
        where: { id: existing.id },
        data: { capacity },
      });
    }
    return existing.id;
  }

  const created = await prisma.ship.create({
    data: {
      cruiseLineId,
      name: shipName,
      capacity,
    },
    select: { id: true },
  });

  return created.id;
}

export async function importItineraries(csvPathInput?: string): Promise<ImportSummary> {
  const csvPath = path.resolve(process.cwd(), csvPathInput ?? "src/lib/scripts/itineraries.csv");

  const raw = await readFile(csvPath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CsvRow[];

  const grouped = groupRows(rows);

  let itinerariesCreated = 0;
  let itinerariesUpdated = 0;

  for (const [externalId, itineraryRows] of Array.from(grouped.entries())) {
    if (!itineraryRows.length) continue;

    const first = itineraryRows[0];
    const cruiseLineName = String(first["Cruise Line"] ?? "").trim();
    const shipName = String(first["Ship Name"] ?? "").trim();
    if (!cruiseLineName || !shipName) continue;

    const cruiseLine = await prisma.cruiseLine.upsert({
      where: { name: cruiseLineName },
      update: {},
      create: { name: cruiseLineName },
      select: { id: true },
    });

    const shipId = await getOrCreateShip(cruiseLine.id, shipName, toInt(first["Max Passengers"]));

    const days = dedupeAndSortDays(itineraryRows);
    if (!days.length) continue;

    const departurePort = days[0]?.port ?? "Unknown";
    const arrivalPort = days[days.length - 1]?.port ?? null;
    const nights = Math.max(days.length - 1, 0);
    const itineraryName = `${shipName} - ${departurePort}`;

    const existing = await prisma.itinerary.findUnique({
      where: {
        providerName_externalId: {
          providerName: "CruiseMapper",
          externalId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      itinerariesUpdated += 1;
    } else {
      itinerariesCreated += 1;
    }

    const itinerary = await prisma.itinerary.upsert({
      where: {
        providerName_externalId: {
          providerName: "CruiseMapper",
          externalId,
        },
      },
      update: {
        name: itineraryName,
        nights,
        departurePort,
        arrivalPort,
        source: ItinerarySource.API,
        providerName: "CruiseMapper",
        externalId,
        shipId,
        description: `Imported from itineraries.csv (${new Date().toISOString()})`,
      },
      create: {
        name: itineraryName,
        nights,
        departurePort,
        arrivalPort,
        source: ItinerarySource.API,
        providerName: "CruiseMapper",
        externalId,
        shipId,
        description: `Imported from itineraries.csv (${new Date().toISOString()})`,
      },
      select: { id: true },
    });

    await prisma.itineraryDay.deleteMany({ where: { itineraryId: itinerary.id } });

    await prisma.itineraryDay.createMany({
      data: days.map((day, index) => ({
        itineraryId: itinerary.id,
        dayNumber: index + 1,
        port: day.port,
        country: day.country,
        arrival: day.arrival,
        departure: day.departure,
        isSeaDay: day.isSeaDay,
      })),
    });
  }

  return {
    csvPath,
    rowsRead: rows.length,
    itinerariesProcessed: grouped.size,
    itinerariesCreated,
    itinerariesUpdated,
  };
}

async function main() {
  const summary = await importItineraries(process.argv[2]);
  console.log("Itineraries import complete:");
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
