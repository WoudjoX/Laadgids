import { describe, expect, it } from "vitest";
import type { VersionFull } from "@/lib/db/types";
import { bestMatch, diffCandidate, matchKey, norm, variantScore } from "./normalize";
import { toCandidate, versionFromFilename } from "./openEvData";

const tesla: VersionFull = {
  id: 1,
  vehicle_id: 1,
  slug: "tesla-model-3-rwd-2025",
  trim: "RWD",
  model_year: 2025,
  battery_gross_wh: 60000,
  battery_net_wh: 57500,
  wltp_range_km: 513,
  consumption_wh_per_km: 132,
  ac_max_w: 11000,
  ac_phases: 3,
  dc_max_w: 170000,
  towing_kg: null,
  catalog_price_be_cents: null,
  catalog_price_nl_cents: null,
  co2_wltp_g_km: 0,
  sold_in: ["BE"],
  spec_source_url: "https://www.tesla.com/nl_be/model3",
  spec_source_date: "2026-09-01",
  vehicle: { id: 1, make_id: 1, slug: "tesla-model-3", model: "Model 3", generation: null, powertrain: "bev", segment: "d-sedan" },
  make: { id: 1, slug: "tesla", name: "Tesla" },
};
const skoda: VersionFull = {
  ...tesla,
  id: 2,
  slug: "skoda-enyaq-85-2025",
  trim: "85",
  battery_net_wh: 77000,
  vehicle: { id: 2, make_id: 2, slug: "skoda-enyaq", model: "Enyaq", generation: null, powertrain: "bev", segment: "d-suv" },
  make: { id: 2, slug: "skoda", name: "Škoda" },
};

// Record in het formaat van open-ev-data-dataset schema 1.0.0
const rawTesla = {
  unique_code: "tesla:model_3:2024:model_3_rwd",
  make: { slug: "tesla", name: "Tesla" },
  model: { slug: "model_3", name: "Model 3" },
  year: 2024,
  trim: { slug: "rwd", name: "RWD" },
  vehicle_type: "passenger_car",
  battery: { pack_capacity_kwh_gross: 60, pack_capacity_kwh_net: 57.5 },
  charging: { ac: { max_power_kw: 11, phases: 3 }, dc: { max_power_kw: 170 } },
  range: { rated: [{ cycle: "wltp", range_km: 513 }, { cycle: "epa", range_km: 438 }] },
  sources: [{ type: "oem", url: "https://www.tesla.com/model3", accessed_at: "2025-12-28T00:00:00Z" }],
  markets: ["US", "DE"],
};

describe("norm / keys", () => {
  it("verwijdert accenten en leestekens", () => {
    expect(norm("Škoda")).toBe("skoda");
    expect(norm("ID.3 Pro")).toBe("id 3 pro");
    expect(matchKey("Tesla", "Model 3", "RWD")).toBe("tesla|model 3|rwd");
  });
  it("variantScore is token-overlap", () => {
    expect(variantScore("RWD", "RWD")).toBe(1);
    expect(variantScore("Pro", "Pro S")).toBe(0.5);
    expect(variantScore(null, "")).toBe(1);
    expect(variantScore("85", "RWD")).toBe(0);
  });
});

describe("toCandidate", () => {
  it("zet kWh naar Wh, leest WLTP-range en de OEM-bron", () => {
    const c = toCandidate(rawTesla, "v1.24.0", "2025-12-30")!;
    expect(c.battery_net_wh).toBe(57500);
    expect(c.battery_gross_wh).toBe(60000);
    expect(c.ac_max_w).toBe(11000);
    expect(c.ac_phases).toBe(3);
    expect(c.dc_max_w).toBe(170000);
    expect(c.wltp_range_km).toBe(513);
    expect(c.consumption_wh_per_km).toBeNull();
    expect(c.oem_source_url).toBe("https://www.tesla.com/model3");
    expect(c.external_id).toBe("tesla:model_3:2024:model_3_rwd");
    expect(c.match_key).toBe("tesla|model 3|rwd");
    expect(c.review_notes).toBeNull();
  });
  it("combineert trim en variant, en markeert ontbrekende fasen", () => {
    const c = toCandidate({ ...rawTesla, variant: { name: "Highland", kind: "trim_level" }, charging: { ac: { max_power_kw: 11 } } }, "v1", "2025-01-01")!;
    expect(c.variant).toBe("RWD Highland");
    expect(c.ac_phases).toBeNull();
    expect(c.review_notes).toMatch(/fasen/);
  });
  it("slaat andere voertuigtypes en ongeldige records over", () => {
    expect(toCandidate({ ...rawTesla, vehicle_type: "other" }, "v1", "2025-01-01")).toBeNull();
    expect(toCandidate({ make: { name: "X" } }, "v1", "2025-01-01")).toBeNull();
  });
  it("leest de versie uit de bestandsnaam", () => {
    expect(versionFromFilename("open-ev-data-v1.24.0.json")).toBe("v1.24.0");
    expect(versionFromFilename("ev-data.json")).toBeNull();
  });
});

describe("bestMatch / diffCandidate", () => {
  it("matcht op merk, model, variant en batterij", () => {
    const c = toCandidate(rawTesla, "v1.24.0", "2025-12-30")!;
    const m = bestMatch(c, [skoda, tesla]);
    expect(m?.version.id).toBe(1);
    expect(m!.score).toBeGreaterThan(1);
  });
  it("geeft null voor een onbekend model of een andere uitvoering", () => {
    const c = toCandidate({ ...rawTesla, model: { name: "Cybertruck" } }, "v1", "2025-01-01")!;
    expect(bestMatch(c, [tesla, skoda])).toBeNull();
    const lr = toCandidate({ ...rawTesla, trim: { name: "Long Range AWD" } }, "v1", "2025-01-01")!;
    expect(bestMatch(lr, [tesla, skoda])).toBeNull();
  });
  it("markeert afwijkingen boven 3 % als conflict, fasen exact", () => {
    const c = toCandidate(
      { ...rawTesla, battery: { pack_capacity_kwh_net: 62.3 }, charging: { ac: { max_power_kw: 11, phases: 1 }, dc: { max_power_kw: 170 } } },
      "v1",
      "2025-01-01",
    )!;
    const d = diffCandidate(tesla, c);
    expect(d.find((x) => x.field === "battery_net_wh")?.conflict).toBe(true);
    expect(d.find((x) => x.field === "ac_phases")?.conflict).toBe(true);
    expect(d.find((x) => x.field === "ac_max_w")?.conflict).toBe(false);
    expect(d.find((x) => x.field === "consumption_wh_per_km")?.rel).toBeNull();
  });
});
