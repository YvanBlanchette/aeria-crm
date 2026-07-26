import path from "node:path";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import "dotenv/config";
import { disconnectItinerariesImporter, importItineraries } from "./import-itineraries";

function run(command: string, args: string[], label: string) {
  console.log(`\n[${label}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}`);
  }
}

type ScrapedPortCall = {
  ship_name: string;
  ship_id: string;
  cruise_line: string;
  start_date: string;
  date: string;
  port_name: string;
  arrival: string;
  departure: string;
};

function resolvePythonCommand() {
  const configured = process.env.ITINERARIES_PYTHON?.trim();
  if (configured) {
    const [cmd, ...prefixArgs] = configured.split(/\s+/);
    return { cmd, prefixArgs };
  }

  const localPython = path.resolve(
    process.cwd(),
    process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python",
  );
  if (existsSync(localPython)) {
    return { cmd: localPython, prefixArgs: [] };
  }

  if (process.platform === "win32") {
    return { cmd: "py", prefixArgs: ["-3"] };
  }

  return { cmd: "python3", prefixArgs: [] };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDatabaseStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /database system is starting up|can'?t reach database server|ECONNREFUSED|connection refused|P1001/i.test(
    message,
  );
}

async function importItinerariesWithRetry(csvPath: string) {
  const attempts = Number(process.env.ITINERARIES_IMPORT_RETRIES ?? 10);
  const delayMs = Number(process.env.ITINERARIES_IMPORT_RETRY_DELAY_MS ?? 3000);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await importItineraries(csvPath);
    } catch (error) {
      if (!isDatabaseStartupError(error) || attempt === attempts) {
        throw error;
      }

      console.log(
        `[import] database not ready (${attempt}/${attempts}); retrying in ${Math.round(
          delayMs / 1000,
        )}s...`,
      );
      await sleep(delayMs);
    }
  }

  throw new Error("Import failed before it could start.");
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function convertEscalesToLegacyCsv(inputPath: string, outputPath: string) {
  const raw = await readFile(inputPath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as ScrapedPortCall[];

  const header = [
    "Itinerary Id",
    "Cruise Line",
    "Ship Name",
    "Date",
    "Time",
    "Port",
    "Max Passengers",
    "Crew",
  ];

  const out = [header.map(csvCell).join(",")];
  for (const row of rows) {
    const shipId = String(row.ship_id ?? "").trim();
    const startDate = String(row.start_date ?? "").trim();
    const date = String(row.date ?? "").trim();
    if (!shipId || !startDate || !date) continue;

    const arrival = String(row.arrival ?? "").trim();
    const departure = String(row.departure ?? "").trim();
    const time = arrival && departure ? `${arrival} - ${departure}` : arrival || departure;

    out.push(
      [
        `${shipId}-${startDate}`,
        row.cruise_line,
        row.ship_name,
        date,
        time,
        row.port_name,
        "",
        "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  await writeFile(outputPath, `${out.join("\n")}\n`, "utf8");
  return out.length - 1;
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "src/lib/scripts/itineraries.csv");
  const scrapeScript = path.resolve(process.cwd(), "scripts/cruisemapper_scraper.py");
  const workDir = path.resolve(process.cwd(), ".cache/itineraries-sync");
  const shipsPath = path.join(workDir, "ships.txt");
  const discoverPages = process.env.ITINERARIES_DISCOVER_PAGES?.trim() || "110";
  const scraperDelay = process.env.ITINERARIES_SCRAPER_DELAY?.trim() || "2.5";

  await mkdir(workDir, { recursive: true });

  const { cmd, prefixArgs } = resolvePythonCommand();
  run(
    cmd,
    [
      ...prefixArgs,
      scrapeScript,
      "--cache",
      path.join(workDir, "html-cache"),
      "--delay",
      scraperDelay,
      "--no-robots",
      "discover",
      "--out",
      shipsPath,
      "--pages",
      discoverPages,
    ],
    "discover",
  );
  run(
    cmd,
    [
      ...prefixArgs,
      scrapeScript,
      "--cache",
      path.join(workDir, "html-cache"),
      "--delay",
      scraperDelay,
      "--no-robots",
      "scrape",
      "--ships",
      shipsPath,
      "--out",
      workDir,
    ],
    "scrape",
  );

  const rowsWritten = await convertEscalesToLegacyCsv(path.join(workDir, "escales.csv"), csvPath);
  console.log(`\n[convert] ${rowsWritten} rows -> ${csvPath}`);

  try {
    const summary = await importItinerariesWithRetry(csvPath);
    console.log("\n[import] summary");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await disconnectItinerariesImporter();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});