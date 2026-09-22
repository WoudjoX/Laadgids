import { describe, expect, it } from "vitest";
import type { VersionRow } from "@/lib/db/types";
import { decidePageStatus } from "./status";

const base: VersionRow = {
  id: 1,
  vehicle_id: 1,
  slug: "x",
  trim: "Pro",
  model_year: 2025,
  battery_gross_wh: 62000,
  battery_net_wh: 59000,
  wltp_range_km: 434,
  consumption_wh_per_km: 152,
  ac_max_w: 11000,
  ac_phases: 3,
  dc_max_w: null,
  towing_kg: null,
  catalog_price_be_cents: null,
  catalog_price_nl_cents: null,
  co2_wltp_g_km: 0,
  sold_in: ["BE"],
  spec_source_url: "https://example.com",
  spec_source_date: "2026-09-01",
  verified_at: "2026-09-22",
  spec_notes: null,
};

describe("decidePageStatus", () => {
  it("index alleen als alles klopt en Erwin geverifieerd heeft", () => {
    expect(decidePageStatus(base, "nl-BE", "charger_for_model").status).toBe("index");
  });
  it("noindex zonder verified_at", () => {
    const d = decidePageStatus({ ...base, verified_at: null }, "nl-BE", "charger_for_model");
    expect(d.status).toBe("noindex");
    expect(d.reasons.join()).toMatch(/verified_at/);
  });
  it("noindex als het model niet in het land verkocht wordt of een bron een TODO heeft", () => {
    expect(decidePageStatus(base, "nl-NL", "charger_for_model").status).toBe("noindex");
    expect(decidePageStatus(base, "nl-BE", "charger_for_model", { unverified: true }).status).toBe("noindex");
  });
  it("draft als de berekening onmogelijk is", () => {
    expect(decidePageStatus({ ...base, battery_net_wh: 0 }, "nl-BE", "charger_for_model").status).toBe("draft");
  });
});
