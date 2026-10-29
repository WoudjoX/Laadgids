import { describe, expect, it } from "vitest";
import type { ModelCardItem } from "@/components/ModelCards";
import { getCopy } from "@/lib/copy";
import type { TariffRow, VersionFull } from "@/lib/db/types";
import { joinList } from "@/lib/format";
import type { CostRow } from "./costRows";
import { makeFaqVars } from "./makeHub";

let nextId = 1;
function item(model: string, trim: string, ac_max_w: number, ac_phases: 1 | 3, battery_net_wh: number | null = 60000): ModelCardItem {
  const v = {
    id: nextId++, vehicle_id: 0, slug: `x-${model}-${trim}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), trim, model_year: 2025,
    battery_gross_wh: battery_net_wh ? null : 64000, battery_net_wh, wltp_range_km: null, consumption_wh_per_km: 160, ac_max_w, ac_phases, dc_max_w: null,
    towing_kg: null, catalog_price_be_cents: null, catalog_price_nl_cents: null, co2_wltp_g_km: 0, sold_in: ["BE"],
    spec_source_url: "https://x", spec_source_date: "2026-10-01",
    vehicle: { id: 0, make_id: 0, slug: model.toLowerCase(), model, generation: null, powertrain: "bev", segment: null },
    make: { id: 1, slug: "merk", name: "Merk" },
  } as VersionFull;
  return { path: `/nl-be/laadpaal-voor/${v.slug}`, v };
}

const tariff = { id: 1, country: "BE", region: null, slug: "vast-dag", label: { nl: "vast tarief", fr: "tarif fixe" }, price_cents_per_kwh: 30, charging_loss_pct: 10, source_url: "https://x", source_checked_at: "2026-10-01", notes: null } as TariffRow;
const cost = (i: ModelCardItem, per100: number): CostRow => ({ path: `/c/${i.v.slug}`, v: i.v, tariff, per100, perYear: per100 * 120 });

const c74 = item("A", "1F", 7400, 1, 40000);
const c11 = item("B", "Standard", 11000, 3, 60000);
const c22 = item("C", "Long Range", 22000, 3, 80000);
const nominal = item("D", "Nominaal", 11000, 3, null);
const nl = getCopy("nl-BE");

describe("makeFaqVars", () => {
  it("groepeert per aanbevolen aansluiting, hoogste vermogen eerst, en noemt de 1-fasige uitvoeringen", () => {
    const f = makeFaqVars([c74, c11, c22], [cost(c74, 500), cost(c11, 560), cost(c22, 620)], "nl-BE", nl);
    expect(f.groups.map((g) => g.names)).toEqual(["C Long Range", "B Standard", "A 1F"]);
    expect(f.groups[0]!.connection).toBe(nl.connections["3f_32a_22000"]);
    expect(f.singlePhase).toEqual({ count: 1, names: "A 1F", power: "7,4 kW" });
    expect(f.cost?.minName).toBe("A 1F");
    expect(f.cost?.maxName).toBe("C Long Range");
    expect(f.time.minName).not.toBe(f.time.maxName);
  });
  it("één groep voor 11 kW-auto's (ook met nominale batterij), geen 1-fasige", () => {
    const f = makeFaqVars([c11, nominal], [], "nl-BE", nl);
    expect(f.groups).toHaveLength(1);
    expect(f.groups[0]!.names).toBe("B Standard en D Nominaal");
    expect(f.singlePhase).toBeNull();
  });
  it("geen kostvraag zonder kosten voor elke uitvoering (randgeval)", () => {
    expect(makeFaqVars([c11, c22], [cost(c11, 560)], "nl-BE", nl).cost).toBeNull();
    const faq = nl.makeHub.faq(makeFaqVars([c11, c22], [], "nl-BE", nl));
    expect(faq.map((q) => q.q)).not.toContain("Wat kost thuisladen van een Merk?");
  });
  it("FAQ-teksten in beide talen bevatten de cijfers", () => {
    const fr = getCopy("fr-BE");
    const items = [c74, c11];
    const costs = [cost(c74, 500), cost(c11, 560)];
    const faqNl = nl.makeHub.faq(makeFaqVars(items, costs, "nl-BE", nl));
    const faqFr = fr.makeHub.faq(makeFaqVars(items, costs, "fr-BE", fr));
    expect(faqNl).toHaveLength(4);
    expect(faqFr).toHaveLength(4);
    expect(faqNl[1]!.a).toContain("Niet allemaal. A 1F laadt 1-fasig, tot 7,4 kW");
    expect(faqFr[1]!.a).toContain("Pas toutes. A 1F charge en monophasé");
    expect(faqNl[2]!.a).toContain("(A 1F)");
  });
});

describe("joinList", () => {
  it("voegt samen met 'en' of 'et'", () => {
    expect(joinList(["a"], "nl-BE")).toBe("a");
    expect(joinList(["a", "b", "c"], "nl-BE")).toBe("a, b en c");
    expect(joinList(["a", "b"], "fr-BE")).toBe("a et b");
    expect(joinList([], "fr-BE")).toBe("");
  });
});
