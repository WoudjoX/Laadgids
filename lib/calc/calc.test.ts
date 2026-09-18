import { describe, expect, it } from "vitest";
import {
  CONNECTIONS,
  advice,
  bijtellingNL,
  capacityCostCents,
  capacityImpact,
  chargeTime,
  chargeTimeTable,
  chargingCost,
  compareTariffs,
  completeness,
  connection,
  deductibilityBE,
  effectivePower,
  vaaBE,
  type VersionInput,
} from "./index";
import type { CapacityTariffParams } from "@/lib/rules/schemas";

// Vaste testauto's (CLAUDE.md §10): 7,4 kW, 11 kW, 22 kW, 1F-auto op 3F-paal.
const car74: VersionInput = { battery_net_wh: 51_000, consumption_wh_per_km: 144, ac_max_w: 7400, ac_phases: 1 };
const car11: VersionInput = { battery_net_wh: 77_000, consumption_wh_per_km: 165, ac_max_w: 11000, ac_phases: 3 };
const car22: VersionInput = { battery_net_wh: 52_000, consumption_wh_per_km: 168, ac_max_w: 22000, ac_phases: 3 };
const small: VersionInput = { battery_net_wh: 37_300, consumption_wh_per_km: 148, ac_max_w: 11000, ac_phases: 3 };

const capRule: CapacityTariffParams = { cents_per_kw_year: 5600, min_kw: 2.5, household_baseline_w: 3500 };

describe("effectivePower / chargeTime", () => {
  it("7,4 kW 1F-auto op 3F 11 kW-paal laadt op 7,4 kW (1F-auto op 3F-paal)", () => {
    expect(effectivePower(car74, connection("3f_16a_11000"))).toBe(7400);
    expect(effectivePower(car74, connection("3f_32a_22000"))).toBe(7400);
  });
  it("11 kW 3F-auto op 1F 7,4 kW-aansluiting valt terug op 7,4 kW", () => {
    expect(effectivePower(car11, connection("1f_32a_7400"))).toBe(7400);
    expect(effectivePower(car11, connection("3f_16a_11000"))).toBe(11000);
    expect(effectivePower(car11, connection("3f_32a_22000"))).toBe(11000);
  });
  it("22 kW-auto benut 22 kW", () => {
    expect(effectivePower(car22, connection("3f_32a_22000"))).toBe(22000);
  });
  it("berekent energie incl. laadverlies en tijd", () => {
    const r = chargeTime(car11, connection("3f_16a_11000"), { from_pct: 20, to_pct: 80, charging_loss: 0.1 });
    // 77 kWh * 0.6 / 0.9 = 51.333 kWh; / 11 kW = 4.667 h
    expect(r.energy_needed_wh).toBeCloseTo(51_333.33, 1);
    expect(r.seconds / 3600).toBeCloseTo(4.6667, 3);
  });
  it("gooit op ongeldige invoer (ontbrekende velden)", () => {
    expect(() => chargeTime({ ...car11, battery_net_wh: 0 }, connection("3f_16a_11000"))).toThrow();
    expect(() => chargeTime(car11, connection("3f_16a_11000"), { from_pct: 80, to_pct: 20 })).toThrow();
  });
});

describe("chargeTimeTable", () => {
  it("markeert no_gain zodra het effectieve vermogen niet meer stijgt", () => {
    const rows = chargeTimeTable(car74);
    expect(rows.map((r) => r.connection)).toEqual(CONNECTIONS.map((c) => c.key));
    expect(rows.map((r) => r.no_gain)).toEqual([false, false, false, true, true]);
  });
  it("11 kW-auto: alleen 22 kW is geen winst", () => {
    expect(chargeTimeTable(car11).map((r) => r.no_gain)).toEqual([false, false, false, false, true]);
  });
  it("22 kW-auto: geen enkele rij is no_gain", () => {
    expect(chargeTimeTable(car22).every((r) => !r.no_gain)).toBe(true);
  });
});

describe("advice", () => {
  it("7,4 kW-auto: aanbevolen 1F 32 A, waarschuwing 3F geen winst", () => {
    const a = advice(car74, { region: "VLA", capacity_rule: capRule });
    expect(a.recommended_connection).toBe("1f_32a_7400");
    expect(a.warnings).toContain("single_phase_car_no_gain_3f");
    expect(a.warnings).not.toContain("peak_capacity_tariff");
    expect(a.warnings).toContain("no_gain_above_recommended");
    // 7,4 kW-auto: alleen 7,4 kW-scenario in de capaciteitsimpact
    expect(a.capacity?.scenarios.map((s) => s.charger_w)).toEqual([7400]);
  });
  it("11 kW-auto in Vlaanderen: aanbevolen 3F 16 A met piekwaarschuwing", () => {
    const a = advice(car11, { region: "VLA", capacity_rule: capRule });
    expect(a.recommended_connection).toBe("3f_16a_11000");
    expect(a.warnings).toContain("peak_capacity_tariff");
    expect(a.capacity?.scenarios.map((s) => s.charger_w)).toEqual([7400, 11000]);
  });
  it("11 kW-auto in Wallonië: geen capaciteitsblok", () => {
    const a = advice(car11, { region: "WAL", capacity_rule: null });
    expect(a.capacity).toBeNull();
    expect(a.warnings).not.toContain("peak_capacity_tariff");
  });
  it("22 kW-auto: aanbevolen 3F 32 A, geen no_gain-waarschuwing", () => {
    const a = advice(car22, { region: "VLA", capacity_rule: capRule });
    expect(a.recommended_connection).toBe("3f_32a_22000");
    expect(a.warnings).not.toContain("no_gain_above_recommended");
  });
  it("kleine batterij: reden small_battery_74_enough", () => {
    const a = advice(small, { region: null, capacity_rule: null });
    expect(a.reasons).toContain("small_battery_74_enough");
    expect(a.reasons).toContain("full_overnight_on_recommended");
  });
  it("afwijkend AC-maximum (10,5 kW) valt terug op de snelste aansluiting", () => {
    const a = advice({ ...car11, ac_max_w: 10500 }, { region: null, capacity_rule: null });
    expect(a.recommended_connection).toBe("3f_16a_11000");
    expect(a.recommended_w).toBe(10500);
  });
});

describe("capacityImpact", () => {
  it("kost is nooit negatief en respecteert het minimum van 2,5 kW", () => {
    expect(capacityCostCents(1000, capRule)).toBe(0);
    expect(capacityCostCents(2500, capRule)).toBe(0);
    expect(capacityCostCents(3500, capRule)).toBeCloseTo(5600, 6);
  });
  it("11 kW zonder load balancing: piek 14,5 kW; met: 11 kW", () => {
    const r = capacityImpact(car11, capRule);
    const s11 = r.scenarios.find((s) => s.charger_w === 11000)!;
    expect(s11.peak_with_w).toBe(14500);
    expect(s11.peak_with_lb_w).toBe(11000);
    expect(s11.delta_cents).toBeCloseTo(11 * 5600, 6);
    expect(s11.delta_lb_cents).toBeCloseTo(7.5 * 5600, 6);
  });
  it("7,4 kW-auto trekt geen 11 kW: scenario weggelaten", () => {
    const r = capacityImpact(car74, capRule);
    expect(r.scenarios.map((s) => s.charger_w)).toEqual([7400]);
  });
  it("22 kW-auto: beide scenario's, 11 kW-lader trekt 11 kW", () => {
    const r = capacityImpact(car22, capRule);
    expect(r.scenarios.map((s) => s.charger_w)).toEqual([7400, 11000]);
  });
});

describe("chargingCost", () => {
  const dag = { slug: "vast-dag", price_cents_per_kwh: 32, charging_loss_pct: 10 };
  const dyn = { slug: "dynamisch-slim", price_cents_per_kwh: 22, charging_loss_pct: 10 };
  it("berekent per jaar, per 100 km en per volle lading", () => {
    const r = chargingCost(car11, dag, { km_per_year: 12_000 });
    // 165*1.15 = 189.75 Wh/km; *12000 / 0.9 = 2530 kWh; *32 c = 80960 c
    expect(r.cents_per_year).toBeCloseTo(80_960, 0);
    expect(r.cents_per_100km).toBeCloseTo(674.67, 1);
    expect(r.full_charge_cents).toBeCloseTo(2737.78, 1);
  });
  it("vergelijkt tarieven met vast-dag als baseline", () => {
    const c = compareTariffs(car74, [dag, dyn])!;
    expect(c.cheapest.tariff_slug).toBe("dynamisch-slim");
    expect(c.baseline.tariff_slug).toBe("vast-dag");
    expect(c.saving_cents_per_year).toBeGreaterThan(0);
  });
  it("22 kW-auto en 7,4 kW-auto gebruiken dezelfde formule (vermogen speelt geen rol)", () => {
    const a = chargingCost(car22, dag);
    const b = chargingCost({ ...car22, ac_max_w: 7400, ac_phases: 1 }, dag);
    expect(a.cents_per_year).toBe(b.cents_per_year);
  });
  it("lege tarieflijst geeft null; ontbrekend verbruik gooit", () => {
    expect(compareTariffs(car11, [])).toBeNull();
    expect(() => chargingCost({ ...car11, consumption_wh_per_km: 0 }, dag)).toThrow();
  });
});

describe("vaaBE", () => {
  // Fixture-parameters, geen echte regel. Echte waarden komen uit `rules` na verificatie.
  const p = {
    base_pct: 0.055,
    ref_co2_g_km: 65,
    step_pct: 0.001,
    min_pct: 0.04,
    max_pct: 0.18,
    age_table: [1, 0.94, 0.88, 0.82, 0.76, 0.7],
    min_vaa_cents: 170_000,
    catalog_factor: 6 / 7,
    marginal_rate_default: 0.5,
  };
  it("EV valt op het minimumpercentage", () => {
    const r = vaaBE({ catalog_price_be_cents: 6_000_000, co2_wltp_g_km: 0, first_registration_year: 2026 }, p, 2026);
    expect(r.co2_pct).toBe(0.04);
    expect(r.vaa_year_cents).toBeCloseTo(6_000_000 * (6 / 7) * 0.04, 0);
    expect(r.min_applied).toBe(false);
  });
  it("goedkope wagen valt op het minimum-VAA", () => {
    const r = vaaBE({ catalog_price_be_cents: 2_000_000, co2_wltp_g_km: 0, first_registration_year: 2026 }, p, 2026);
    expect(r.min_applied).toBe(true);
    expect(r.vaa_year_cents).toBe(170_000);
  });
  it("leeftijdscoëfficiënt daalt en stopt aan het einde van de tabel", () => {
    const r = vaaBE({ catalog_price_be_cents: 4_500_000, co2_wltp_g_km: 0, first_registration_year: 2015 }, p, 2026);
    expect(r.age_coeff).toBe(0.7);
  });
  it("ontbrekende prijs gooit", () => {
    expect(() => vaaBE({ catalog_price_be_cents: 0, co2_wltp_g_km: 0, first_registration_year: 2026 }, p, 2026)).toThrow();
  });
});

describe("bijtellingNL", () => {
  const p2026 = { cap_cents: 3_000_000, low_pct: 0.18, high_pct: 0.22, fixed_months: 60, net_rates: [0.37, 0.495] };
  it("splitst onder en boven de cap", () => {
    const r = bijtellingNL(4_500_000, p2026);
    expect(r.bijtelling_year_cents).toBeCloseTo(3_000_000 * 0.18 + 1_500_000 * 0.22, 0);
    expect(r.net_per_month_by_rate).toHaveLength(2);
  });
  it("prijs onder de cap gebruikt alleen het lage percentage", () => {
    const r = bijtellingNL(2_500_000, p2026);
    expect(r.bijtelling_year_cents).toBeCloseTo(2_500_000 * 0.18, 0);
  });
  it("ontbrekende prijs gooit", () => {
    expect(() => bijtellingNL(0, p2026)).toThrow();
  });
});

describe("deductibilityBE", () => {
  const p = { by_purchase_year: { "2026": { bev: 1, phev: 0.75 } } };
  it("geeft de fractie voor bekend jaar en powertrain", () => {
    expect(deductibilityBE("bev", 2026, p)).toBe(1);
    expect(deductibilityBE("phev", 2026, p)).toBe(0.75);
  });
  it("geeft null bij onbekend jaar of powertrain", () => {
    expect(deductibilityBE("bev", 2030, p)).toBeNull();
    expect(deductibilityBE("erev", 2026, p)).toBeNull();
  });
});

describe("completeness", () => {
  const full = {
    trim: "Pro",
    model_year: 2026,
    battery_net_wh: 77_000,
    consumption_wh_per_km: 165,
    ac_max_w: 11000,
    ac_phases: 3 as const,
    spec_source_url: "https://example.com",
    spec_source_date: "2026-09-01",
  };
  it("volledig ingevuld geeft 1", () => {
    expect(completeness(full, "charger_for_model")).toBe(1);
  });
  it("ontbrekend veld verlaagt de score", () => {
    expect(completeness({ ...full, model_year: null }, "charger_for_model")).toBeCloseTo(7 / 8, 6);
    expect(completeness({ ...full, spec_source_url: "" }, "charger_for_model")).toBeCloseTo(7 / 8, 6);
  });
  it("vaa vereist catalogusprijs", () => {
    expect(completeness(full, "vaa")).toBeLessThan(1);
    expect(completeness({ ...full, catalog_price_be_cents: 4_000_000 }, "vaa")).toBe(1);
  });
  it("templates zonder vereisten geven 1", () => {
    expect(completeness({}, "rule")).toBe(1);
  });
});
