-- Create table for static JSON datasets persisted in DB for API consumption
CREATE TABLE "StaticDataset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceFile" TEXT,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaticDataset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaticDataset_slug_key" ON "StaticDataset"("slug");
