import path from "node:path";
import { spawnSync } from "node:child_process";
import "dotenv/config";
import { importItineraries } from "./import-itineraries";

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

function resolvePythonCommand() {
  const configured = process.env.ITINERARIES_PYTHON?.trim();
  if (configured) {
    const [cmd, ...prefixArgs] = configured.split(/\s+/);
    return { cmd, prefixArgs };
  }

  if (process.platform === "win32") {
    return { cmd: "py", prefixArgs: ["-3"] };
  }

  return { cmd: "python3", prefixArgs: [] };
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "src/lib/scripts/itineraries.csv");
  const scrapeScript = path.resolve(process.cwd(), "src/lib/scripts/scrape.py");

  const { cmd, prefixArgs } = resolvePythonCommand();
  run(cmd, [...prefixArgs, scrapeScript, "--output", csvPath], "scrape");

  const summary = await importItineraries(csvPath);
  console.log("\n[import] summary");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
