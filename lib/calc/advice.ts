import type { Region } from "@/lib/db/types";
import type { CapacityTariffParams } from "@/lib/rules/schemas";
import { capacityImpact, type CapacityImpactResult } from "./capacityImpact";
import { chargeTimeTable, type ChargeTimeOptions, type ChargeTimeRow } from "./chargeTime";
import type { ConnectionKey, VersionInput } from "./types";

/** Codes, geen tekst. De copy-laag vertaalt (CLAUDE.md 6.2). */
export type ReasonCode =
  | "recommended_matches_car_max" // aanbevolen aansluiting benut het volledige AC-vermogen
  | "small_battery_74_enough" // batterij < 45 kWh: 7,4 kW volstaat voor een nacht
  | "full_overnight_on_recommended"; // 20 naar 80 % past in een nacht op de aanbevolen aansluiting

export type WarningCode =
  | "single_phase_car_no_gain_3f" // 1F-auto: 3F-paal geeft geen tijdwinst, wel toekomstvast
  | "peak_capacity_tariff" // 11 kW of meer in Vlaanderen: capaciteitstarief
  | "no_gain_above_recommended"; // duurdere aansluitingen leveren niets op

export interface AdviceResult {
  recommended_connection: ConnectionKey;
  recommended_w: number;
  reasons: ReasonCode[];
  warnings: WarningCode[];
  table: ChargeTimeRow[];
  capacity: CapacityImpactResult | null;
}

export interface AdviceContext {
  region: Region | null;
  /** Geldende capaciteitstarief-regel; null als het gewest er geen heeft. */
  capacity_rule: CapacityTariffParams | null;
  charge?: ChargeTimeOptions;
}

export const SMALL_BATTERY_WH = 45_000;
export const OVERNIGHT_SECONDS = 8 * 3600;

export function advice(version: VersionInput, ctx: AdviceContext): AdviceResult {
  const table = chargeTimeTable(version, ctx.charge);
  const reasons: ReasonCode[] = [];
  const warnings: WarningCode[] = [];

  // 1. Kleinste aansluiting die het volledige AC-vermogen benut; anders de snelste.
  let rec = table.find((r) => r.effective_w === version.ac_max_w);
  if (!rec) rec = table.reduce((a, b) => (b.effective_w > a.effective_w ? b : a));
  reasons.push("recommended_matches_car_max");

  // 2. 1F-auto: 3F geeft geen tijdwinst.
  if (version.ac_phases === 1) warnings.push("single_phase_car_no_gain_3f");

  // 3. Capaciteitstarief: alleen als het gewest een regel heeft. Piekwaarschuwing vanaf 11 kW.
  let capacity: CapacityImpactResult | null = null;
  if (ctx.capacity_rule && ctx.region === "VLA") {
    capacity = capacityImpact(version, ctx.capacity_rule);
    if (version.ac_max_w >= 11000) warnings.push("peak_capacity_tariff");
  }

  // 4. Kleine batterij: 7,4 kW volstaat meestal voor een nacht.
  if (version.battery_net_wh < SMALL_BATTERY_WH) reasons.push("small_battery_74_enough");

  if (rec.seconds <= OVERNIGHT_SECONDS) reasons.push("full_overnight_on_recommended");
  if (table.some((r) => r.no_gain && r.max_w > rec.max_w)) warnings.push("no_gain_above_recommended");

  return {
    recommended_connection: rec.connection,
    recommended_w: rec.effective_w,
    reasons,
    warnings,
    table,
    capacity,
  };
}
