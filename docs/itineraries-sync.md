# Itineraries Sync (CSV -> DB)

This project now supports a full itinerary sync pipeline:

1. Scrape latest itineraries into `src/lib/scripts/itineraries.csv`
2. Import/update into PostgreSQL (`Itinerary`, `ItineraryDay`, `Ship`, `CruiseLine`)
3. Search via API: `GET /api/itineraries/search`

## Commands

- Import only from existing CSV:

```bash
npm run itineraries:import
```

- Scrape then import:

```bash
npm run itineraries:sync
```

Optional Python command override (if `py -3` or `python3` differs):

```bash
ITINERARIES_PYTHON="python" npm run itineraries:sync
```

## API Search

Endpoint:

```text
GET /api/itineraries/search?q=utopia&provider=CruiseMapper&limit=20
```

Query params:

- `q`: full-text search over itinerary/ship/cruise line/ports/external id
- `provider`: defaults to `CruiseMapper`
- `limit`: defaults to `20`, max `100`

## Production Schedule (Linux VPS)

Use cron for daily sync at 03:30.

```cron
30 3 * * * cd /var/www/aeria-crm && /usr/bin/npm run itineraries:sync >> /var/log/aeria-itineraries-sync.log 2>&1
```

If Python path is custom:

```cron
30 3 * * * cd /var/www/aeria-crm && ITINERARIES_PYTHON=/usr/bin/python3 /usr/bin/npm run itineraries:sync >> /var/log/aeria-itineraries-sync.log 2>&1
```

## Local Schedule (Windows Task Scheduler)

Action example:

- Program/script: `powershell.exe`
- Add arguments:

```powershell
-NoProfile -ExecutionPolicy Bypass -Command "Set-Location 'C:\dev\AERIA\aeria-crm'; $env:ITINERARIES_PYTHON='py -3'; npm run itineraries:sync"
```

Recommended trigger: daily during off-hours.

## Notes

- Import is idempotent: records are upserted by `(providerName, externalId)`.
- Existing itinerary days are replaced on update to reflect latest scrape.
- Migration adds a unique index on `(providerName, externalId)`.
