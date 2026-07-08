import { PrismaClient, Prisma } from "@prisma/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { normalizeDatasetPayload, slugFromFilename } from "../src/lib/datasets";

const prisma = new PrismaClient();

async function main() {
  const dataDir = path.resolve(process.cwd(), "src/lib/data");
  const entries = await readdir(dataDir, { withFileTypes: true });
  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

  for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file.name);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const slug = slugFromFilename(file.name);
    const payload = normalizeDatasetPayload(parsed, slug, file.name) as Prisma.InputJsonValue;

    await prisma.staticDataset.upsert({
      where: { slug },
      update: { sourceFile: file.name, payload },
      create: { slug, sourceFile: file.name, payload },
    });
  }

  console.log(`Datasets synced: ${jsonFiles.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
