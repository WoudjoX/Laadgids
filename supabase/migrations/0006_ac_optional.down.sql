alter table versions drop constraint if exists versions_ac_optional_gt;
alter table versions drop column if exists ac_max_w_optional;
