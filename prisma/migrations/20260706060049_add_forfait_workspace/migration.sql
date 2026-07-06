-- CreateTable
CREATE TABLE "ForfaitWorkspace" (
    "userId" TEXT NOT NULL,
    "constants" JSONB,
    "autosaveName" TEXT,
    "autosaveState" JSONB,
    "autosaveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForfaitWorkspace_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ForfaitDossier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForfaitDossier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForfaitDossier_userId_updatedAt_idx" ON "ForfaitDossier"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ForfaitWorkspace" ADD CONSTRAINT "ForfaitWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForfaitDossier" ADD CONSTRAINT "ForfaitDossier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
