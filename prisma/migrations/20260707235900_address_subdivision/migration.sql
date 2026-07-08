-- Add structured address fields for clients, hotels, and agency settings.
ALTER TABLE "Client"
ADD COLUMN     "street" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "zipCode" TEXT,
ADD COLUMN     "billingStreet" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingProvince" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingZipCode" TEXT;

ALTER TABLE "HotelSegment"
ADD COLUMN     "street" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "zipCode" TEXT;

ALTER TABLE "AgencySettings"
ADD COLUMN     "street" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- Keep legacy data by moving free-text addresses to street when possible.
UPDATE "Client"
SET "street" = COALESCE("street", "address")
WHERE "address" IS NOT NULL;

UPDATE "Client"
SET "billingStreet" = COALESCE("billingStreet", "billingAddress")
WHERE "billingAddress" IS NOT NULL;

UPDATE "HotelSegment"
SET "street" = COALESCE("street", "address")
WHERE "address" IS NOT NULL;

UPDATE "AgencySettings"
SET "street" = COALESCE("street", "address")
WHERE "address" IS NOT NULL;

ALTER TABLE "Client"
DROP COLUMN "address",
DROP COLUMN "billingAddress";

ALTER TABLE "HotelSegment"
DROP COLUMN "address";

ALTER TABLE "AgencySettings"
DROP COLUMN "address";
