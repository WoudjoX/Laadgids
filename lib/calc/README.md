# lib/calc — rekenlaag

Pure functies, geen I/O, geen tekst. Input zijn rijen uit het datamodel (`lib/db/types.ts`) en geparste `rules.params` (`lib/rules/schemas.ts`). Output zijn getypeerde objecten met **niet-afgeronde** getallen; afronden gebeurt in `lib/format.ts` bij het renderen.

| Functie | Spec | Opmerking |
|---|---|---|
| `chargeTime`, `chargeTimeTable` | 6.1 | Default 20 naar 80 %, laadverlies 10 %. Fase-mismatch cap op 7 400 W volgens spec. `no_gain` vergelijkt met de vorige, goedkopere aansluiting. |
| `advice` | 6.2 | Geeft codes (`ReasonCode`, `WarningCode`), geen zinnen. Copy staat in `lib/copy/{locale}.ts`. |
| `capacityImpact` | 6.3 | Alleen renderen als er een `capacity_tariff`-regel voor het gewest is. Kosten in eurocent, mogelijk fractioneel. Laders boven het AC-maximum van de auto worden weggelaten. |
| `chargingCost`, `compareTariffs` | 6.4 | Realiteitsfactor 1,15 als parameter. Baseline is `vast-dag`. |
| `vaaBE` | 6.5 | Parameters per aanslagjaar uit `rules`. Er is geen VAA-regel geseed: eerst verifiëren bij FOD Financiën. |
| `bijtellingNL` | 6.6 | Percentages uit `rules` per registratiejaar. |
| `deductibilityBE` | 6.7 | Geeft `null` als het jaar niet in de regel zit. |
| `completeness` | 6.8 | Vereiste velden per template in `REQUIRED_FIELDS`. |

Tests: `pnpm test`. Elke functie heeft minstens de gevallen 7,4 kW-auto, 11 kW-auto, 22 kW-auto, 1F-auto op 3F-paal en een randgeval met ontbrekende velden.

Bekende vereenvoudiging: een 3F-auto met 16 A per fase aan een 1F-32A-aansluiting krijgt volgens de spec 7 400 W. In de praktijk hangt dat af van de onboard-lader. De spec is leidend tot Erwin anders beslist.

Indexatiebeleid (CLAUDE.md 4.3) staat niet hier maar in `lib/pages/status.ts`, omdat het `sold_in` en de locale nodig heeft.
