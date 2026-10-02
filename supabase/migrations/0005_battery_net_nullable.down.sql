-- Terug naar verplichte bruikbare capaciteit. Rijen zonder netto-waarde krijgen de nominale waarde terug in dat veld,
-- zodat de not null-constraint weer kan gelden (dat is de toestand van voor 0005).
alter table versions drop constraint if exists versions_battery_present;
update versions set battery_net_wh = battery_gross_wh where battery_net_wh is null and battery_gross_wh is not null;
alter table versions alter column battery_net_wh set not null;
