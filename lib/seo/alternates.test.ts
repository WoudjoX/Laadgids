import { afterEach, describe, expect, it } from "vitest";
import type { PageRow } from "@/lib/db/types";
import { alternatesFor, assertValidHreflangKeys, fitTitle, sectionAlternates, siteUrl } from "./alternates";

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
