import { describe, expect, it } from "vitest";
import type { ModelCardItem } from "@/components/ModelCards";
import type { VersionFull } from "@/lib/db/types";
import { exceptionKind, makeTiles, modelExceptions } from "./homeOverview";

function item(make: string, model: string, trim: string, ac_max_w: number, ac_phases: 1 | 3, battery_net_wh = 60000): ModelCardItem {
  const v = {
    id: 0, vehicle_id: 0, slug: `${make}-${model}-${trim}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), trim, model_year: 2025,
    battery_gross_wh: null, battery_net_wh, wltp_range_km: null, consumption_wh_per_km: 160, ac_max_w, ac_phases, dc_max_w: null,
    towing_kg: null, catalog_price_be_cents: null, catalog_price_nl_cents: null, co2_wltp_g_km: 0, sold_in: ["BE"],
    spec_source_url: "https://x", spec_source_date: "2026-10-01",
    vehicle: { id: 0, make_id: 0, slug: model.toLowerCase(), model, generation: null, powertrain: "bev", segment: null },
    make: { id: 0, slug: make.toLowerCase(), name: make },
  } as VersionFull;
  return { path: `/nl-be/laadpaal-voor/${v.slug}`, v };
}

const car74 = item("Citroën", "ë-C3", "30 kWh", 7400, 1, 30300);
const car11 = item("Volvo", "EX30", "Single Motor", 11000, 3, 49000);
const car11b = item("Volvo", "EX40", "Extended Range", 11000, 3, 79000);
const car22 = item("Renault", "Zoe", "R135", 22000, 3, 52000);
const car105 = item("Hyundai", "Kona", "65 kWh", 10500, 3, 65400);
const oneOn3 = item("Dacia", "Spring", "Electric 65", 7000, 1, 26800);

describe("makeTiles", () => {
  it("één tegel per merk, alfabetisch, met aantal en laadtijdspreiding", () => {
    const t = makeTiles([car11b, car74, car11, car22]);
    expect(t.map((x) => x.name)).toEqual(["Citroën", "Renault", "Volvo"]);
    const volvo = t.find((x) => x.slug === "volvo")!;
    expect(volvo.count).toBe(2);
    expect(volvo.minSeconds).toBeLessThan(volvo.maxSeconds);
  });
  it("lege lijst geeft geen tegels (randgeval)", () => {
    expect(makeTiles([])).toEqual([]);
  });
});

describe("modelExceptions", () => {
  it("de gewone 11 kW-driefasige auto is geen uitzondering", () => {
    expect(exceptionKind(car11.v)).toBeNull();
  });
  it("1-fasig, boven en onder 11 kW worden apart herkend (7,4 kW, 22 kW, 10,5 kW, 1F-auto)", () => {
    expect(exceptionKind(car74.v)).toBe("one_phase");
    expect(exceptionKind(oneOn3.v)).toBe("one_phase");
    expect(exceptionKind(car22.v)).toBe("above_11");
    expect(exceptionKind(car105.v)).toBe("below_11");
  });
  it("sorteert eerst 1-fasig, dan boven, dan onder 11 kW, binnen de soort op naam", () => {
    const e = modelExceptions([car105, car11, car22, oneOn3, car74]);
    expect(e.map((x) => x.item.v.make.name)).toEqual(["Citroën", "Dacia", "Renault", "Hyundai"]);
  });
});
