# Seed-data

Lokale seed voor ontwikkeling en voor `pnpm seed` naar Supabase. Zonder Supabase-omgevingsvariabelen leest de app rechtstreeks uit deze bestanden.

**Status: niet geverifieerd.** Alle specs en tarieven zijn ingevuld uit publieke fabrikantenpagina's en de marktcijfers uit CLAUDE.md, maar nog niet door Erwin nagekeken tegen de prijslijst met datum (definition of done, punt 5). Regels en tarieven met `TODO(verify)` in `notes` houden de afhankelijke pagina's op `noindex`: `scripts/recalc-pages.ts` zet ze niet op `index`.

- `makes.json`, `vehicles.json`, `versions.json`: 11 versies. Onbekende velden zijn `null`, niet geraden. `dc_max_w` en catalogusprijzen ontbreken vaak; die zijn niet nodig voor `charger_for_model`.
- `rules.json`: VLA capaciteitstarief 2026 (placeholder uit de range 52 tot 60 euro/kW/jaar in CLAUDE.md 1), 6 % btw BE, bijtelling NL 2026 tot 2028, ISDE 2026. Geen VAA-, aftrekbaarheids- of CREG-regel: die cijfers zijn niet geverifieerd en dus niet ingevuld.
- `tariffs.json`: 4 BE-tarieven, all-in gemiddelden, placeholder tot de CREG-boordtabel gecheckt is.
- `installers.json`: één testinstallateur. Vervangen door gecontracteerde installateurs vóór livegang.
- `sources.json`: bronnenlijst uit CLAUDE.md 11.
