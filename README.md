# Laadgids

pSEO-site voor thuisladen en EV-fiscaliteit in de Benelux. Spec: [CLAUDE.md](CLAUDE.md), visueel systeem: [DESIGN.md](DESIGN.md).

## Starten

PowerShell (Windows):

```powershell
pnpm install
Copy-Item .env.example .env.local   # leeg laten = lokale seed-data, geen Supabase nodig
pnpm dev                            # http://localhost:3000/nl-be
pnpm test                           # calc, rules, hreflang, related, lead-matching
pnpm typecheck; pnpm lint
```

Bash / macOS / Linux:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm test
pnpm typecheck && pnpm lint
```

Voorbeeldpagina's zonder database:

- `/nl-be/laadpaal-voor/tesla-model-3-rwd-2025` (11 kW, capaciteitstarief Vlaanderen)
- `/nl-be/laadpaal-voor/peugeot-e-208-51-2025` (7,4 kW 1-fasig: twee rijen "geen winst")
- `/fr-be/borne-pour/renault-zoe-r135-52-2023` (22 kW, Wallonië: geen piekblok)
- `/design-lab` (alle componenten met voorbeelddata)

## Supabase

1. Voer `supabase/migrations/0001_init.up.sql` uit (idempotent; down-migratie ernaast).
2. Zet de env-variabelen uit `.env.example`.
3. `pnpm seed` laadt `data/seed/*.json`; `pnpm recalc-pages` zet `pages.status` volgens het indexatiebeleid (CLAUDE.md 4.3) en triggert revalidate.

Regels en tarieven met `TODO(verify` in `notes` houden alle afhankelijke pagina's op `noindex`. Verwijder de TODO pas na controle bij de bron.

## Structuur

| Map | Inhoud |
|---|---|
| `lib/calc/` | Pure rekenfuncties + tests, zie [lib/calc/README.md](lib/calc/README.md) |
| `lib/rules/` | Zod-schema's voor `rules.params`, regelselectie op datum |
| `lib/copy/` | Alle tekst per locale (nl-BE, fr-BE, nl-NL) |
| `lib/seo/` | hreflang (`alternates.ts`), interne links (`related.ts`) |
| `lib/db/` | Repo-interface, Supabase-implementatie, lokale seed-implementatie, gecachte loaders met tags |
| `lib/pages/` | Indexatiebeleid (`status.ts`), assemblage P1-pagina (`charger.ts`), route-helper |
| `lib/lead/` | Zod-schema, installateursmatching, rate-limit, Resend-mails |
| `components/` | UI-componenten volgens DESIGN.md; alleen `LeadForm` is client-side |
| `app/[locale]/(pseo)/` | `laadpaal-voor/[slug]` (nl) en `borne-pour/[slug]` (fr) |
| `app/api/revalidate` | On-demand revalidate, `Authorization: Bearer <REVALIDATE_SECRET>` |
| `scripts/` | seed, import-specs, recalc-pages, audit-sources, screenshot |

## On-demand revalidate

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "$env:NEXT_PUBLIC_SITE_URL/api/revalidate" `
  -Headers @{ authorization = "Bearer $env:REVALIDATE_SECRET" } -ContentType "application/json" `
  -Body '{"tags":["rules:BE","tariffs:BE","pages"]}'
```

Bash:

```bash
curl -X POST $NEXT_PUBLIC_SITE_URL/api/revalidate \
  -H "authorization: Bearer $REVALIDATE_SECRET" -H "content-type: application/json" \
  -d '{"tags":["rules:BE","tariffs:BE","pages"]}'
```

Tags: `version:{slug}`, `rules:{BE|NL}`, `tariffs:{BE|NL}`, `pages:{locale}`, `pages`, `versions`.

## Open data als staging voor specs

Open bronnen landen in `spec_candidates` (migratie 0002), nooit rechtstreeks in `versions`. Zonder Supabase-env schrijven de scripts naar `data/import/candidates/`.

```powershell
pnpm fetch-open-ev-data                                            # laatste release naar data/import/
pnpm import-open-ev-data data/import/open-ev-data-v1.24.0.json   # github.com/open-ev-data/open-ev-data-dataset
pnpm review-candidates --make tesla                                # of zonder filter
```

`review-candidates` schrijft `data/import/review/report.txt` (matches en conflicten per bestaande versie, drempel 3 %, fasen exact) en `data/import/review/new-versions.csv` voor onbekende modellen. Die CSV heeft het formaat van `import-specs`, maar zonder `spec_source_url` en `spec_source_date`: die vul je in vanuit de fabrikantenprijslijst voor je importeert. De dataset bevat geen WLTP-verbruik; dat veld blijft leeg tot de prijslijst het invult. De kolom `oem_source_url_suggested` is de fabrikantenbron die de dataset opgeeft: een startpunt om te controleren, geen bewijs.

### EEA-inschrijvingen als prioriteit

```powershell
pnpm import-eea data/import/eea-cars-2025.csv --year 2025 --min 5
pnpm review-candidates
```

`import-eea` streamt het jaarbestand van de EEA Datahub ("CO2 emissions from new passenger cars"), houdt alleen BE en NL en elektrische of hybride aandrijvingen over, en telt inschrijvingen per variant. `review-candidates` gebruikt die tellingen om `new-versions.csv` op volume te sorteren en vult de kolommen `registrations_be` en `registrations_nl`. Kolomnamen wijken per jaargang af; pas ze zo nodig aan in `lib/specs/eea.ts`.

### Regelpagina's en statische pagina's

Regelpagina's (template `rule`) bestaan alleen als er een entry staat in `lib/content/rules.ts`; de tekst is handgeschreven, met bronnen en datum. Over, contact en privacy staan in `lib/content/static.ts`.
