import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.warn("[prepare-standalone] Standalone output not found. Skipping asset copy.");
  process.exit(0);
}

const copies = [
  {
    from: path.join(root, ".next", "static"),
    to: path.join(standaloneDir, ".next", "static"),
    label: ".next/static -> .next/standalone/.next/static",
  },
  {
    from: path.join(root, "public"),
    to: path.join(standaloneDir, "public"),
    label: "public -> .next/standalone/public",
  },
];

for (const item of copies) {
  if (!existsSync(item.from)) {
    console.warn(`[prepare-standalone] Source missing, skipped: ${item.label}`);
    continue;
  }

  mkdirSync(path.dirname(item.to), { recursive: true });
  cpSync(item.from, item.to, { recursive: true, force: true });
  console.log(`[prepare-standalone] Copied: ${item.label}`);
}
