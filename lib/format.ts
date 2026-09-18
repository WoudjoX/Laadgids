// Afronden en formatteren gebeurt hier, niet in lib/calc (CLAUDE.md §6, §10).
import type { Locale } from "@/lib/db/types";

const intlLocale: Record<Locale, string> = { "nl-BE": "nl-BE", "fr-BE": "fr-BE", "nl-NL": "nl-NL" };

/** Eurocent naar "€ 1.234" (hele euro's) of "€ 12,34" (met decimalen). */
export function euro(cents: number, locale: Locale, opts: { decimals?: 0 | 2 } = {}): string {
  const decimals = opts.decimals ?? (Math.abs(cents) < 10_000 ? 2 : 0);
  const n = new Intl.NumberFormat(intlLocale[locale], { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(
    cents / 100,
  );
  return `€ ${n}`;
}

/** Watt naar "11 kW" of "7,4 kW". */
export function kw(w: number, locale: Locale): string {
  const k = w / 1000;
  const digits = Number.isInteger(k) ? 0 : 1;
  return `${new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(k)} kW`;
}

/** Wh naar "77 kWh" of "57,5 kWh". */
export function kwh(wh: number, locale: Locale): string {
  const k = wh / 1000;
  const digits = Number.isInteger(k) ? 0 : 1;
  return `${new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(k)} kWh`;
}

/** Seconden naar "4 u 40 min" (nl) of "4 h 40 min" (fr). Afronden op 5 minuten. */
export function duration(seconds: number, locale: Locale): string {
  const totalMin = Math.round(seconds / 60 / 5) * 5;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const hu = locale === "fr-BE" ? "h" : "u";
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ${hu}`;
  return `${h} ${hu} ${String(m).padStart(2, "0")} min`;
}

/** Compacte vorm voor metric cards: { value: "3:30", unit: "u" }. Afronden op 5 minuten. */
export function durationCompact(seconds: number, locale: Locale): { value: string; unit: string } {
  const totalMin = Math.round(seconds / 60 / 5) * 5;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { value: `${h}:${String(m).padStart(2, "0")}`, unit: locale === "fr-BE" ? "h" : "u" };
}

/** Kost per 100 km als euro met twee decimalen: "€ 7,30". */
export function euroPer100Km(cents_per_100km: number, locale: Locale): string {
  return euro(cents_per_100km, locale, { decimals: 2 });
}

export function int(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 0 }).format(n);
}

export function pct(fraction: number, locale: Locale, digits = 0): string {
  return `${new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(fraction * 100)} %`;
}

/** ISO-datum naar "9 september 2026" / "9 septembre 2026". */
export function dateLong(iso: string, locale: Locale): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}
