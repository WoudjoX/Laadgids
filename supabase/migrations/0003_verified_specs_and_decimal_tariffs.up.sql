-- 0003: verificatiedatum en voetnoot per versie, decimale tarieven, en de gegevenswijzigingen van 22/09/2026
-- (besluiten van Erwin na bronverificatie). Idempotent.

-- 1. versions: verificatiepoort en voetnoot
alter table versions add column if not exists verified_at date;
alter table versions add column if not exists spec_notes text;

-- 2. tarieven met decimalen (32,25 c/kWh)
alter table tariffs alter column price_cents_per_kwh type numeric(8,3) using price_cents_per_kwh::numeric;

-- 3. capaciteitstarief Vlaanderen 2026: VREG-gemiddelde 53,39 excl. btw; 56,59 incl. 6 % is onze berekening en wordt zo getoond.
update rules set
  params = params || jsonb_build_object(
    'cents_per_kw_year', 5659,
    'excl_vat_cents_per_kw_year', 5339,
    'vat_pct', 6,
    'is_regional_average', true,
    'min_kw', 2.5,
    'household_baseline_w', 3500),
  source_url = 'https://www.vlaamsenutsregulator.be/elektriciteit-en-aardgas/nettarieven/capaciteitstarief',
  source_checked_at = '2026-09-22',
  notes = 'VREG: gemiddeld 53,39 EUR/kW/jaar excl. btw voor 2026; verschilt per netgebied (Fluvius West 57,10 excl.). Incl. 6 % btw = 56,59 (eigen berekening, zo gelabeld op de pagina). Minimum 2,5 kW.'
where country = 'BE' and region = 'VLA' and rule_type = 'capacity_tariff' and valid_from = '2026-01-01';

-- 4. 6 % btw: permanent tarief; bron circulaire 2023/C/64 (26/06/2023) en FAQ 2023/C/65. Cijfer ongewijzigd.
update rules set
  valid_from = '2023-07-01',
  source_url = 'https://fin.belgium.be/nl/ondernemingen/btw/btw-plicht/tarieven-en-berekening/btw-tarieven',
  source_checked_at = '2026-09-22',
  notes = 'Circulaire 2023/C/64 van 26/06/2023 en FAQ 2023/C/65: verlaagd tarief permanent sinds 01/04/2023, sinds 01/07/2023 op basis van niet-zakelijk gebruik. Plaatsing laadstation valt onder renovatie privewoning (KB nr. 20, rubriek XXXVIII): woning minstens 10 jaar, aannemer, in of aan de woning, garage, carport, oprit of terras.'
where country = 'BE' and rule_type = 'vat_reduced';

-- 5. CREG-tarief terugbetaling thuisladen: Q3 2026 (geldt nu) en Q4 2026 (vanaf 1 oktober). Bron: creg.be, Q4 gepubliceerd 11/08/2026.
insert into rules (country, region, rule_type, valid_from, valid_to, params, source_url, source_checked_at, notes)
select 'BE', null, 'creg_tariff', '2026-07-01', '2026-09-30',
  '{"cents_per_kwh_by_region":{"VLA":32.22,"BRU":37.19,"WAL":37.83},"quarter":"2026-Q3"}'::jsonb,
  'https://www.creg.be/nl/consumenten/prijzen-en-tarieven/creg-tarief-voor-terugbetaling-thuisladen-bedrijfswagens',
  '2026-09-22', 'Q3 2026. Bevestigd via CREG-webpagina; PDF-check door Erwin.'
where not exists (select 1 from rules where rule_type = 'creg_tariff' and valid_from = '2026-07-01');

insert into rules (country, region, rule_type, valid_from, valid_to, params, source_url, source_checked_at, notes)
select 'BE', null, 'creg_tariff', '2026-10-01', '2026-12-31',
  '{"cents_per_kwh_by_region":{"VLA":32.25,"BRU":36.88,"WAL":37.79},"quarter":"2026-Q4","published_at":"2026-08-11"}'::jsonb,
  'https://www.creg.be/nl/consumenten/prijzen-en-tarieven/creg-tarief-voor-terugbetaling-thuisladen-bedrijfswagens',
  '2026-09-22', 'Q4 2026, geldig vanaf 1 oktober. Gepubliceerd 11/08/2026. Bevestigd via CREG-webpagina; PDF-check door Erwin.'
where not exists (select 1 from rules where rule_type = 'creg_tariff' and valid_from = '2026-10-01');

-- 6. Tarieven: één all-in referentie voor Vlaanderen (CREG-laadtarief Q4 2026). Nacht, dynamisch en zonnepanelen weg tot er een bron is.
delete from tariffs where country = 'BE' and slug in ('vast-nacht', 'dynamisch-slim', 'zonnepanelen');
update tariffs set
  price_cents_per_kwh = 32.25,
  label = '{"nl":"vast tarief, all-in","fr":"tarif fixe, tout compris"}'::jsonb,
  source_url = 'https://www.creg.be/nl/consumenten/prijzen-en-tarieven/creg-tarief-voor-terugbetaling-thuisladen-bedrijfswagens',
  source_checked_at = '2026-09-22',
  notes = 'CREG-laadtarief Vlaanderen Q4 2026 als all-in referentie (32,25 c/kWh). Marktgemiddelden september 2026: enkelvoudig 30,35, piek 31,28, dal 29,38. Bevestigd via CREG-webpagina; PDF-check door Erwin.'
where country = 'BE' and slug = 'vast-dag';

-- 7. Peugeot e-208: officiële cijfers 48,1 netto / 51 bruto, met voetnoot. Verbruik (WLTP) nog te bevestigen uit de prijslijst.
update versions set
  battery_net_wh = 48100,
  battery_gross_wh = 51000,
  spec_source_url = 'https://www.media.stellantis.com/be-nl/peugeot/press/nieuwe-100-elektrische-peugeot-e-208',
  spec_source_date = '2026-09-22',
  spec_notes = 'Peugeot communiceert 48,1 kWh netto (51 bruto). Metingen tonen dat veel e-208 156 pk sinds eind 2024 het grotere pack van 51 kWh netto (54 bruto) hebben zonder dat Peugeot dat vermeldt. Laadtijden hierboven gaan uit van het officiële cijfer.'
where slug = 'peugeot-e-208-51-2025';

-- 8. Tesla Model 3 RWD: geen fabrikantenbron voor de batterij (nieuw CATL-pack 2025, Tesla publiceert niets). Blijft noindex via verified_at = null.
update versions set
  spec_notes = 'Tesla publiceert geen batterijcapaciteit. Het cijfer hierboven is een schatting en verschilt per productiejaar; pagina blijft ongepubliceerd tot er een citeerbare bron is.'
where slug = 'tesla-model-3-rwd-2025';

-- Alle versies: verificatie door Erwin nog te doen (per model 'klopt' of correctie).
update versions set verified_at = null where verified_at is null;
