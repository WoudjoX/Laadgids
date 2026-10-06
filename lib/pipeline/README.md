# lib/pipeline — verificatiepijplijn

Automatiseert het opzoeken, niet het beslissen. Drie stappen, elk apart te draaien met `pnpm verify <stap>`:

| Stap | Doet | Input | Output |
|---|---|---|---|
| `fetch` | Haalt elk document uit `data/sources/oem-documents.json` op (of leest het lokale bestand uit `file`), berekent een vingerafdruk, bewaart ruw bestand en tekst | registry | `data/sources/cache/` (niet in git), `data/sources/oem-documents.state.json` (wel in git) |
| `extract` | Laat Claude per uitvoering de cijfers uittrekken, met label, paginanummer en citaat; alleen voor documenten die sinds de vorige keer veranderd zijn | cache | `data/pipeline/extracted/<id>.json` (in git) |
| `review` | Legt de uittreksels naast `versions`, meldt bronnen die onbereikbaar zijn, kiest een steekproef van 10 % | uittreksels + database | `data/import/review/pipeline-<datum>.md` en `.csv` |

`pnpm verify run` doet de drie na elkaar.

## Wat de uitkomsten betekenen

- **nieuw**: geen rij in `versions`; alle vereiste cijfers staan in het document. Staat als rij in de CSV, klaar voor Erwin.
- **afwijking**: er is een rij, maar batterij, verbruik, AC-vermogen of fasen verschillen meer dan 3 %. Ook in de CSV.
- **bevestigd**: binnen 3 %. Alleen in het rapport.
- **onvolledig**: geen rij, en het document geeft niet alle vereiste cijfers. Niet importeerbaar; een tweede document is nodig.
- **bronnen met een probleem**: rijen waarvan het brondocument onbereikbaar is (na 30 dagen noindex, CLAUDE.md §8) of niet in de registry staat.

## Regels die de code volgt

- Labels worden letterlijk overgenomen; `classifyBatteryLabel` zet ze pas in de vergelijking om naar netto of bruto. Eén ongelabeld cijfer telt als netto met een notitie, zoals bij Dacia en Hyundai; een rij met alleen een nominale capaciteit wordt vergeleken op het bruto-cijfer.
- Een verbruiksbereik wordt het midden, met het bereik in de notitie.
- Het model mag niets afleiden: geen cijfer in de tekst betekent `null`. Een laadduur zonder kW is geen vermogen.
- Niets gaat automatisch naar `versions`. De CSV gaat door Erwin, daarna `pnpm import-specs` en `pnpm recalc-pages`.
- De steekproef in het rapport is deterministisch: dezelfde uittreksels geven dezelfde keuze, zodat Erwin ze zelf opent.

## Vereisten

- `ANTHROPIC_API_KEY` in `.env.local` voor `extract`. Model: `claude-opus-5-5`, te overschrijven met `PIPELINE_MODEL`.
- Documenten die geautomatiseerd ophalen blokkeren (Mercedes, Tesla, Volvo België, BMW) blijven in de registry staan met een notitie. Download ze in de browser naar `data/import/` en zet het pad in het veld `file`.

## Een document toevoegen

Eén regel in `data/sources/oem-documents.json`: `id` (kleine letters en streepjes), `make` (slug uit `makes`), `models`, `market` (BE, NL, IE, INT), `kind` (price_list, spec_page, press_kit, offer_page), `url` en eventueel `file` en `note`. De test in `pipeline.test.ts` weigert dubbele id's en ongeldige waarden.

## Wekelijkse run op GitHub Actions

`.github/workflows/verify-pipeline.yml` draait `pnpm verify fetch`, `extract` en `review` elke maandag om 07:00 Belgische tijd, zet rapport en CSV in `reports/pipeline/` en opent een pull request naar main. Zonder Supabase-sleutels valt `review` terug op `data/seed/versions.json`, wat dezelfde inhoud heeft. Nodig: de repository secret `ANTHROPIC_API_KEY` (GitHub → Settings → Secrets and variables → Actions). Documenten met een lokaal bestand (Mercedes) behouden daar hun vorige toestand. Handmatig starten kan via "Run workflow" in het tabblad Actions.

Een fetch waarbij meer dan de helft van de online documenten onbereikbaar is, wordt als netwerkprobleem behandeld: de toestand wordt dan niet overschreven en het script stopt met een fout.
