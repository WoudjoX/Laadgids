-- 0005: de bruikbare capaciteit mag leeg blijven als de fabrikant alleen de nominale waarde publiceert.
-- De nominale waarde staat dan in battery_gross_wh; de rekenlaag (lib/calc/battery.ts) valt daarop terug en markeert dat.
-- Idempotent.
alter table versions alter column battery_net_wh drop not null;

alter table versions drop constraint if exists versions_battery_present;
alter table versions add constraint versions_battery_present check (battery_net_wh is not null or battery_gross_wh is not null);
