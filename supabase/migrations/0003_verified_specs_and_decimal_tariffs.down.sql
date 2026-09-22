-- 0003 down: kolommen en tariefwijzigingen terugdraaien. Verwijderde tariefrijen komen niet terug (herstel via seed).
delete from rules where rule_type = 'creg_tariff' and valid_from in ('2026-07-01', '2026-10-01');
alter table tariffs alter column price_cents_per_kwh type int using round(price_cents_per_kwh)::int;
alter table versions drop column if exists spec_notes;
alter table versions drop column if exists verified_at;
