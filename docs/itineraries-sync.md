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

Python dependencies:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

The sync command auto-detects `.venv/bin/python` on Linux and `.venv\Scripts\python.exe` on Windows. Optional Python command override (if needed):

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

Before the first run after deploy:

```bash
cd /var/www/aeria-crm
git pull
npm ci
npx prisma migrate deploy
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
npm run itineraries:sync
```

Make sure `DATABASE_URL` in `.env` points to the VPS PostgreSQL database and that PostgreSQL is running before the import starts. The sync retries briefly while the database is starting.

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
