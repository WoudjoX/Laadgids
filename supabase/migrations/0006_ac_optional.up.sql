-- 0006: optionele (of uitvoeringsafhankelijke) boordlader, bv. 22 kW bij sommige Volvo EX30-uitvoeringen.
-- ac_max_w blijft het standaardvermogen waarmee gerekend wordt; dit veld voedt alleen een waarschuwing. Idempotent.
alter table versions add column if not exists ac_max_w_optional int;
alter table versions drop constraint if exists versions_ac_optional_gt;
alter table versions add constraint versions_ac_optional_gt check (ac_max_w_optional is null or ac_max_w_optional > ac_max_w);
