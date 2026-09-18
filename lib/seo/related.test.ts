import { describe, expect, it } from "vitest";
import type { PageRow, VersionFull } from "@/lib/db/types";
import { chargerPath } from "@/lib/copy";
import { relatedFor } from "./related";

function v(id: number, slug: string, makeId: number, vehicleId: number, segment: string): VersionFull {
  return {
    id,
    vehicle_id: vehicleId,
    slug,
    trim: "T",
    model_year: 2025,
    battery_gross_wh: null,
    battery_net_wh: 60000,
    wltp_range_km: null,
    consumption_wh_per_km: 150,
    ac_max_w: 11000,
    ac_phases: 3,
    dc_max_w: null,
    towing_kg: null,
    catalog_price_be_cents: null,
    catalog_price_nl_cents: null,
    co2_wltp_g_km: 0,
    sold_in: ["BE"],
    spec_source_url: "https://x",
    spec_source_date: "2026-01-01",
    vehicle: { id: vehicleId, make_id: makeId, slug: `veh-${vehicleId}`, model: `M${vehicleId}`, generation: null, powertrain: "bev", segment },
    make: { id: makeId, slug: `make-${makeId}`, name: `Make${makeId}` },
  };
}

const all = [
  v(1, "a-1", 1, 1, "d-suv"),
  v(2, "b-2", 2, 2, "d-suv"),
  v(3, "c-3", 3, 3, "d-suv"),
  v(4, "d-4", 1, 4, "c-hatch"),
  v(5, "e-5", 4, 5, "d-suv"),
];

function pagesFor(slugs: string[]): PageRow[] {
  return slugs.map((s, i) => ({
    id: i,
    locale: "nl-BE",
    template: "charger_for_model",
    entity_id: i,
    secondary_id: null,
    path: chargerPath("nl-BE", s),
    status: "index",
    completeness_score: 1,
    last_calculated_at: null,
    last_published_at: null,
  }));
}

describe("relatedFor", () => {
  it("is deterministisch en linkt alleen naar bestaande pagina's", () => {
    const pages = pagesFor(["b-2", "c-3", "d-4"]);
    const r1 = relatedFor(all[0]!, all, "nl-BE", pages);
    const r2 = relatedFor(all[0]!, all, "nl-BE", pages);
    expect(r1).toEqual(r2);
    expect(r1.map((l) => l.path)).toEqual([chargerPath("nl-BE", "b-2"), chargerPath("nl-BE", "c-3"), chargerPath("nl-BE", "d-4")]);
    expect(r1.map((l) => l.kind)).toEqual(["sister", "sister", "same_make"]);
  });
  it("laat pagina's weg die niet bestaan (e-5)", () => {
    const r = relatedFor(all[0]!, all, "nl-BE", pagesFor(["b-2"]));
    expect(r.map((l) => l.path)).toEqual([chargerPath("nl-BE", "b-2")]);
  });
  it("voegt regelpagina's toe als ze bestaan, maximaal 2", () => {
    const pages: PageRow[] = [
      ...pagesFor(["b-2"]),
      ...["btw-6", "capaciteitstarief", "melding-netbeheerder"].map((t, i) => ({
        id: 100 + i,
        locale: "nl-BE" as const,
        template: "rule" as const,
        entity_id: null,
        secondary_id: null,
        path: `/nl-be/regels/vla/${t}`,
        status: "index" as const,
        completeness_score: 1,
        last_calculated_at: null,
        last_published_at: null,
      })),
    ];
    const r = relatedFor(all[0]!, all, "nl-BE", pages, { ruleTopics: ["btw-6", "capaciteitstarief", "melding-netbeheerder"] });
    expect(r.filter((l) => l.kind === "rule")).toHaveLength(2);
  });
});
