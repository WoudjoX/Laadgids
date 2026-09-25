-- 0004: gemarkeerde schatting van de batterijcapaciteit (Tesla, Kia): de fabrikant publiceert geen netto cijfer.
-- Alleen uitvoeren als Erwin beslist dat zulke pagina's met een zichtbare markering gepubliceerd mogen worden.
alter table versions add column if not exists battery_estimated boolean not null default false;
