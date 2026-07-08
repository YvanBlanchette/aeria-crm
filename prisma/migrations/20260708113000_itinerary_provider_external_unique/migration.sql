-- Clean duplicate external provider itineraries before adding a unique constraint.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "providerName", "externalId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "Itinerary"
  WHERE "providerName" IS NOT NULL
    AND "externalId" IS NOT NULL
)
DELETE FROM "Itinerary"
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX "Itinerary_providerName_externalId_key"
ON "Itinerary"("providerName", "externalId");
