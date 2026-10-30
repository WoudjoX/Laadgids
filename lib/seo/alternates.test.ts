import { afterEach, describe, expect, it } from "vitest";
import type { PageRow } from "@/lib/db/types";
import { alternatesFor, assertValidHreflangKeys, fitDescription, fitTitle, pickTitle, sectionAlternates, siteUrl } from "./alternates";

const base = "https://laadgids.test";

function page(over: Partial<PageRow>): PageRow {
  return {
    id: 0,
    locale: "nl-BE",
    template: "charger_for_model",
    entity_id: 1,
    secondary_id: null,
    path: "/nl-be/laadpaal-voor/x",
    status: "index",
    completeness_score: 1,
    last_calculated_at: null,
    last_published_at: null,
    ...over,
  };
}

const nl = page({ id: 1, locale: "nl-BE", path: "/nl-be/laadpaal-voor/tesla-model-3-rwd-2025" });
const fr = page({ id: 2, locale: "fr-BE", path: "/fr-be/borne-pour/tesla-model-3-rwd-2025" });
const nlnl = page({ id: 3, locale: "nl-NL", path: "/nl-nl/laadpaal-voor/tesla-model-3-rwd-2025", status: "noindex" });
const draft = page({ id: 4, locale: "nl-NL", entity_id: 2, path: "/nl-nl/laadpaal-voor/draft", status: "draft" });
const other = page({ id: 5, locale: "fr-BE", entity_id: 2, path: "/fr-be/borne-pour/other" });

describe("alternatesFor", () => {
  it("koppelt laadkostenpagina's op het soort tarief, ook met een eigen tariefrij per gewest", () => {
    const cnl = page({ id: 10, template: "charging_cost", entity_id: 7, secondary_id: 1, path: "/nl-be/laadkosten/tesla-model-3-rwd-2025/vast-dag" });
    const cfr = page({ id: 11, locale: "fr-BE", template: "charging_cost", entity_id: 7, secondary_id: 2, path: "/fr-be/cout-recharge/tesla-model-3-rwd-2025/fixe-jour" });
    const night = page({ id: 12, locale: "fr-BE", template: "charging_cost", entity_id: 7, secondary_id: 3, path: "/fr-be/cout-recharge/tesla-model-3-rwd-2025/fixe-nuit" });
    const a = alternatesFor(cnl, [cnl, cfr, night], base);
    expect(a.languages["fr-BE"]).toBe(base + cfr.path);
    expect(alternatesFor(cfr, [cnl, cfr, night], base).languages["nl-BE"]).toBe(base + cnl.path);
  });
  it("verwijst alleen naar tegenhangers op index, met regio-codes", () => {
    const a = alternatesFor(nl, [nl, fr, nlnl, draft, other], base);
    expect(a.languages["nl-BE"]).toBe(base + nl.path);
    expect(a.languages["fr-BE"]).toBe(base + fr.path);
    expect(a.languages["x-default"]).toBe(base + nl.path);
    expect(Object.keys(a.languages)).not.toContain("nl");
    expect(() => assertValidHreflangKeys(a.languages as Record<string, string>)).not.toThrow();
  });
  it("geen hreflang naar een noindex-tegenhanger, wel in de taalwissel", () => {
    const a = alternatesFor(nl, [nl, fr, nlnl], base);
    expect(a.languages["nl-NL"]).toBeUndefined();
    expect(a.ogAlternateLocales).toEqual(["fr_BE"]);
    expect(a.switcher["nl-NL"]).toBe(nlnl.path);
    expect(a.switcher["fr-BE"]).toBe(fr.path);
  });
  it("een noindex-pagina verwijst niet naar zichzelf, wel naar tegenhangers op index", () => {
    const a = alternatesFor(nlnl, [nl, fr, nlnl], base);
    expect(a.languages["nl-NL"]).toBeUndefined();
    expect(a.languages["nl-BE"]).toBe(base + nl.path);
    expect(a.languages["x-default"]).toBe(base + nl.path);
  });
  it("zonder enige pagina op index is er geen hreflang en geen x-default", () => {
    const a = alternatesFor(nlnl, [nlnl], base);
    expect(a.languages).toEqual({});
    expect(a.canonical).toBe(base + nlnl.path);
  });
  it("laat een locale weg als er geen pagina voor bestaat", () => {
    const a = alternatesFor(nl, [nl, fr], base);
    expect(a.languages["nl-NL"]).toBeUndefined();
    expect(a.switcher["nl-NL"]).toBeUndefined();
  });
  it("negeert draft-pagina's", () => {
    const a = alternatesFor(other, [other, draft], base);
    expect(a.languages["nl-NL"]).toBeUndefined();
    expect(a.switcher["nl-NL"]).toBeUndefined();
    expect(a.languages["x-default"]).toBe(base + other.path);
  });
  it("x-default valt terug op de pagina zelf als nl-BE ontbreekt", () => {
    const a = alternatesFor(fr, [fr, nlnl], base);
    expect(a.languages["x-default"]).toBe(base + fr.path);
    expect(a.ogLocale).toBe("fr_BE");
    expect(a.ogAlternateLocales).toEqual([]);
  });
  it("canonical is de eigen URL", () => {
    expect(alternatesFor(nlnl, [nl, fr, nlnl], base).canonical).toBe(base + nlnl.path);
  });
  it("assertValidHreflangKeys weigert kale taalcodes", () => {
    expect(() => assertValidHreflangKeys({ nl: "x" })).toThrow();
  });
});

describe("sectionAlternates", () => {
  const paths = { "nl-BE": "/nl-be", "fr-BE": "/fr-be", "nl-NL": "/nl-nl" } as const;
  it("alleen locales met pagina's op index krijgen hreflang; de taalwissel kent ze alle drie", () => {
    const a = sectionAlternates(paths, "fr-BE", ["nl-BE", "fr-BE"], base);
    expect(a.canonical).toBe(base + "/fr-be");
    expect(a.languages).toEqual({ "nl-BE": base + "/nl-be", "fr-BE": base + "/fr-be", "x-default": base + "/nl-be" });
    expect(a.switcher["nl-NL"]).toBe("/nl-nl");
    expect(a.ogAlternateLocales).toEqual(["nl_BE"]);
    expect(() => assertValidHreflangKeys(a.languages as Record<string, string>)).not.toThrow();
  });
  it("een locale zonder pagina's op index krijgt geen eigen hreflang-regel", () => {
    const a = sectionAlternates(paths, "nl-NL", ["nl-BE", "fr-BE"], base);
    expect(a.languages["nl-NL"]).toBeUndefined();
    expect(a.canonical).toBe(base + "/nl-nl");
  });
});

describe("fitTitle", () => {
  it("houdt de sitenaam als het binnen 60 tekens past", () => {
    expect(fitTitle("Laadpaal voor Volvo: 6 modellen berekend | Laadgids", "Laadgids")).toBe("Laadpaal voor Volvo: 6 modellen berekend | Laadgids");
    expect(fitTitle("Laadpaal per model", "Laadgids")).toBe("Laadpaal per model | Laadgids");
  });
  it("laat de sitenaam weg bij een lange titel", () => {
    const t = fitTitle("Laadpaal voor Volvo EX30 Single Motor: 11 kW of niet? | Laadgids", "Laadgids");
    expect(t).toBe("Laadpaal voor Volvo EX30 Single Motor: 11 kW of niet?");
  });
});

describe("siteUrl", () => {
  const env = process.env;
  afterEach(() => {
    process.env = env;
  });
  it("voegt https toe als het schema ontbreekt en verwijdert de slash", () => {
    process.env = { ...env, NEXT_PUBLIC_SITE_URL: "laadgids.be/" };
    expect(siteUrl()).toBe("https://laadgids.be");
  });
  it("laat een volledige URL ongemoeid", () => {
    process.env = { ...env, NEXT_PUBLIC_SITE_URL: "http://localhost:3000" };
    expect(siteUrl()).toBe("http://localhost:3000");
  });
  it("valt terug op VERCEL_URL en daarna localhost", () => {
    process.env = { ...env, NEXT_PUBLIC_SITE_URL: "", VERCEL_URL: "laadgids-abc.vercel.app" };
    expect(siteUrl()).toBe("https://laadgids-abc.vercel.app");
    process.env = { ...env, NEXT_PUBLIC_SITE_URL: "", VERCEL_URL: "" };
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("pickTitle", () => {
  it("neemt de volledige titel met sitenaam als die past", () => {
    expect(pickTitle(["Laadkosten Kia EV3 58,3 kWh: € 6,10 per 100 km | Laadgids", "Laadkosten Kia EV3 58,3 kWh"], "Laadgids")).toBe("Laadkosten Kia EV3 58,3 kWh: € 6,10 per 100 km | Laadgids");
  });
  it("valt terug op de korte variant bij een lange uitvoeringsnaam", () => {
    const t = pickTitle(["Laadpaal voor Ford Mustang Mach-E Premium Extended Range AWD: 11 kW of niet? | Laadgids", "Laadpaal voor Ford Mustang Mach-E Premium Extended Range AWD"], "Laadgids");
    expect(t).toBe("Laadpaal voor Ford Mustang Mach-E Premium Extended Range AWD");
    expect(t.length).toBeLessThanOrEqual(65);
  });
  it("geeft de kortste variant als niets binnen 65 past (randgeval)", () => {
    expect(pickTitle(["x".repeat(90), "y".repeat(70)], "Laadgids")).toBe("y".repeat(70));
  });
});

describe("fitDescription", () => {
  it("laat korte beschrijvingen ongemoeid", () => {
    expect(fitDescription("Kort en goed.")).toBe("Kort en goed.");
  });
  it("houdt hele zinnen zolang ze binnen 160 tekens passen", () => {
    const d = fitDescription("Volvo EX30 laadt thuis op maximaal 11 kW. Laadtijd per aansluiting, kosten per tarief en impact op het capaciteitstarief, met bronnen en datum erbij. Bijgewerkt voor Vlaanderen in oktober 2026.");
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith(".")).toBe(true);
    expect(d.startsWith("Volvo EX30 laadt thuis op maximaal 11 kW.")).toBe(true);
  });
  it("kapt een te lange eerste zin af op een woordgrens", () => {
    const d = fitDescription("woord ".repeat(60).trim() + ".");
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
  });
  it("knipt niet op een punt in een getal of naam (12.000, ID.4)", () => {
    const text = "Wat thuisladen kost per 100 km en per jaar, voor elke uitvoering op de site. Gerekend met vast tarief van 32,25 cent per kWh, 10 % laadverlies en 12.000 km per jaar. Klik op een model.";
    expect(fitDescription(text)).toBe("Wat thuisladen kost per 100 km en per jaar, voor elke uitvoering op de site.");
    const id4 = "Le coût de recharge d'une Volkswagen ID.4 Pro 4MOTION est de 5,90 € par 100 km avec le tarif fixe, tout compris (32,25 centimes par kWh). Une phrase de plus pour dépasser la limite.";
    expect(fitDescription(id4).startsWith("Le coût de recharge d'une Volkswagen ID.4 Pro")).toBe(true);
  });
});

