-- CreateTable
CREATE TABLE "AgencySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "agencyName" TEXT NOT NULL DEFAULT 'ÆRIA Voyages',
    "legalName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'CAD',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'fr',
    "bookingPrefix" TEXT NOT NULL DEFAULT 'CR',
    "defaultDepositPct" INTEGER NOT NULL DEFAULT 25,
    "balanceDueDays" INTEGER NOT NULL DEFAULT 45,
    "passportAlertDays" INTEGER NOT NULL DEFAULT 180,
    "defaultClientView" TEXT NOT NULL DEFAULT 'active',
    "autoArchiveLostLeads" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencySettings_pkey" PRIMARY KEY ("id")
);
