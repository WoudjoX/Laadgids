import { describe, expect, it } from "vitest";
import type { VersionFull } from "@/lib/db/types";
import { classifyBatteryLabel, compareExtraction, conflictingVariantTokens, renderReport, renderVerificationCsv, sampleForHumanCheck, toCandidate } from "./compare";
import { htmlToText, isPdf, loadRegistry, registrySchema, type OemDocument } from "./documents";
import { extractionSchema, type ExtractedVariant } from "./extract";

const doc: OemDocument = { id: "volvo-ex30-pricelist-ie-my25-5", make: "volvo", models: ["EX30"], market: "IE", kind: "price_list", url: "https://example.com/ex30.pdf" };
const state = { sha256: "abcdef1234567890" };

function variant(over: Partial<ExtractedVariant> = {}): ExtractedVariant {
  return {
    make: "Volvo",
    model: "EX30",
    variant: "Single Motor Extended Range",
    model_year: 2025,
    battery: [
      { label: "Battery Size - nominal, kWh", kwh: 69, page: 9, quote: "Battery Size - nominal, kWh 51 69 69" },
      { label: "Battery Size - usable, kWh", kwh: 65, page: 9, quote: "Battery Size - usable, kWh 49 65 65" },
    ],
    consumption_kwh_100km: { min: 17.0, max: null, page: 9, quote: "Electric Consumption, (kWh/100km) 17.1 17.0 17.5" },
    ac_charging: { kw: 11, phases: 3, standard: true, page: 4, quote: "3-Phase On Board Charger - 11kW" },
    ac_option_kw: 22,
    dc_max_kw: 153,
    range_km: { min: 476, max: null },
    notes: "",
    ...over,
  };
}

function version(over: Partial<VersionFull> = {}): VersionFull {
  return {
    id: 12,
    vehicle_id: 12,
    slug: "volvo-ex30-single-motor-extended-range-2025",
    trim: "Single Motor Extended Range",
    model_year: 2025,
    battery_gross_wh: 69000,
    battery_net_wh: 65000,
    wltp_range_km: 475,
    consumption_wh_per_km: 170,
    ac_max_w: 11000,
    ac_phases: 3,
    dc_max_w: 153000,
    towing_kg: null,
    catalog_price_be_cents: null,
    catalog_price_nl_cents: null,
    co2_wltp_g_km: 0,
    sold_in: ["BE", "NL"],
    spec_source_url: "https://example.com/ex30.pdf",
    spec_source_date: "2026-10-02",
    verified_at: "2026-10-02",
    vehicle: { id: 12, make_id: 10, slug: "volvo-ex30", model: "EX30", generation: null, powertrain: "bev", segment: "b-suv" },
    make: { id: 10, slug: "volvo", name: "Volvo" },
    ...over,
  } as VersionFull;
}

describe("documents", () => {
  it("de registry is geldig, zonder dubbele id's", async () => {
    const docs = await loadRegistry();
    expect(docs.length).toBeGreaterThan(20);
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });
  it("weigert een registry met een ongeldige markt of url", () => {
    expect(() => registrySchema.parse({ documents: [{ ...doc, market: "FR" }] })).toThrow();
    expect(() => registrySchema.parse({ documents: [{ ...doc, url: "not a url" }] })).toThrow();
  });
  it("htmlToText houdt tekst, verwijdert script en stijl en vertaalt entiteiten", () => {
    const t = htmlToText("<html><head><style>p{}</style><script>var x=1</script></head><body><h1>Elroq</h1><p>61 kWh &amp; 15 - 17&nbsp;kWh/100km</p><table><tr><td>AC</td><td>11 kW</td></tr></table></body></html>");
    expect(t).toContain("Elroq");
    expect(t).toContain("61 kWh & 15 - 17 kWh/100km");
    expect(t).toContain("AC 11 kW");
    expect(t).not.toContain("var x");
  });
  it("herkent een PDF aan de magische bytes of het contenttype", () => {
    expect(isPdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), null, "https://x/y")).toBe(true);
    expect(isPdf(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]), "text/html", "https://x/y.pdf")).toBe(true);
    expect(isPdf(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]), "text/html", "https://x/y")).toBe(false);
  });
});

describe("extract schema", () => {
  it("valideert een volledige uittrekking en weigert een verkeerde vorm", () => {
    expect(extractionSchema.parse({ document_title: "x", valid_from: null, market: null, model_year: null, variants: [variant()] }).variants).toHaveLength(1);
    expect(() => extractionSchema.parse({ document_title: "x", variants: [{ make: "Volvo" }] })).toThrow();
  });
});

describe("compare", () => {
  it("classificeert batterijlabels in drie talen", () => {
    expect(classifyBatteryLabel("Netto capaciteit (kWh / Ah)")).toBe("net");
    expect(classifyBatteryLabel("Battery Size - usable, kWh")).toBe("net");
    expect(classifyBatteryLabel("Bruikbare HV batterijcapaciteit (kWu)")).toBe("net");
    expect(classifyBatteryLabel("Bruto Accu capaciteit")).toBe("gross");
    expect(classifyBatteryLabel("Batterijenergie (nominaal)")).toBe("gross");
    expect(classifyBatteryLabel("Accucapaciteit (kWh)")).toBe("unlabeled");
    expect(classifyBatteryLabel("Battery Size - nominal / useable,KWh")).toBe("mixed");
  });
  it("toCandidate: twee cijfers onder een gemengd label 'nominal / useable' worden bruto en netto", () => {
    const { candidate, notes } = toCandidate(doc, state, variant({ battery: [
      { label: "Battery Size - nominal / useable,KWh", kwh: 82, page: 9, quote: "82/79" },
      { label: "Battery Size - nominal / useable,KWh", kwh: 79, page: 9, quote: "82/79" },
      { label: "Lithium-Ion Battery", kwh: 82, page: 4, quote: "+ Lithium-Ion Battery 82KWh" },
    ] }));
    expect(candidate.battery_gross_wh).toBe(82000);
    expect(candidate.battery_net_wh).toBe(79000);
    expect(notes.join(" ")).toContain("nominaal en bruikbaar samen");
  });
  it("toCandidate: netto en bruto uit labels, verbruiksbereik naar het midden, optie en notities", () => {
    const { candidate, notes } = toCandidate(doc, state, variant({ consumption_kwh_100km: { min: 14.1, max: 18.4, page: null, quote: "14,1 - 18,4" } }));
    expect(candidate.battery_net_wh).toBe(65000);
    expect(candidate.battery_gross_wh).toBe(69000);
    expect(candidate.consumption_wh_per_km).toBe(163);
    expect(candidate.ac_max_w).toBe(11000);
    expect(candidate.ac_phases).toBe(3);
    expect(notes.join(" ")).toContain("bereik 14.1 tot 18.4");
    expect(notes.join(" ")).toContain("22 kW");
    expect(candidate.source_version).toBe("volvo-ex30-pricelist-ie-my25-5@abcdef123456");
  });
  it("toCandidate: één ongelabeld cijfer wordt netto met een notitie (regel voor Dacia, Hyundai, Mercedes EQA)", () => {
    const { candidate, notes } = toCandidate(doc, state, variant({ battery: [{ label: "Accucapaciteit (kWh)", kwh: 70, page: 21, quote: "Accucapaciteit (kWh) 70" }] }));
    expect(candidate.battery_net_wh).toBe(70000);
    expect(candidate.battery_gross_wh).toBeNull();
    expect(notes[0]).toContain("zonder label");
  });
  it("bevestigd als alles binnen 3 % ligt", () => {
    const f = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant()] }, [version()]);
    expect(f).toHaveLength(1);
    expect(f[0]!.kind).toBe("bevestigd");
    expect(f[0]!.version?.slug).toBe("volvo-ex30-single-motor-extended-range-2025");
    expect(f[0]!.pages).toEqual([4, 9]);
  });
  it("afwijking als batterij, verbruik, AC of fasen buiten de marge vallen", () => {
    const f = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant({ consumption_kwh_100km: { min: 18.6, max: null, page: 9, quote: "18.6" } })] }, [version()]);
    expect(f[0]!.kind).toBe("afwijking");
    expect(f[0]!.diffs.find((d) => d.field === "consumption_wh_per_km")?.conflict).toBe(true);
  });
  it("nieuw als er geen rij is; onvolledig als het verbruik of AC ontbreekt", () => {
    const v = variant({ variant: "Twin Motor Performance", battery: [{ label: "Battery Size - usable, kWh", kwh: 65, page: 9, quote: "q" }] });
    const [nieuw] = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [v] }, [version()]);
    expect(nieuw!.kind).toBe("nieuw");
    const [onv] = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [{ ...v, ac_charging: null }] }, [version()]);
    expect(onv!.kind).toBe("onvolledig");
  });
  it("rij met alleen nominale capaciteit vergelijkt met het bruto-cijfer van het document", () => {
    const v = version({ battery_net_wh: null, battery_gross_wh: 69000 });
    const f = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant({ battery: [{ label: "Batterijenergie (nominaal)", kwh: 69, page: null, quote: "q" }] })] }, [v]);
    expect(f[0]!.kind).toBe("bevestigd");
  });
  it("matcht exact op uitvoering, en anders alleen bij gedeelde woorden én dezelfde batterij", () => {
    const sm = version({ id: 36, slug: "volvo-ex30-single-motor-2025", trim: "Single Motor", battery_net_wh: 49000, battery_gross_wh: 51000 });
    const [a] = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant({ variant: "Single Motor", battery: [{ label: "usable", kwh: 49, page: 9, quote: "q" }] })] }, [version(), sm]);
    expect(a!.version?.slug).toBe("volvo-ex30-single-motor-2025");
    const [b] = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant({ variant: "Single Motor", battery: [{ label: "usable", kwh: 49, page: 9, quote: "q" }] })] }, [version()]);
    expect(b!.kind).toBe("nieuw");
  });
  it("koppelt nooit uitvoeringen met een ander getal of een andere aandrijving", () => {
    expect(conflictingVariantTokens("Electric 45", "Electric 65")).toBe(true);
    expect(conflictingVariantTokens("Premium Extended Range AWD", "Extended Range RWD")).toBe(true);
    expect(conflictingVariantTokens("Long range Dual motor", "Long Range Single Motor")).toBe(true);
    expect(conflictingVariantTokens("Single Motor Extended Range", "Single Motor Extended Range")).toBe(false);
    expect(conflictingVariantTokens("85", "85")).toBe(false);
    expect(conflictingVariantTokens("Pro 4MOTION", "Pro")).toBe(true);
    expect(conflictingVariantTokens("Pro", "Pro 4MOTION")).toBe(false);
    const dual = variant({ variant: "Long range Dual motor", battery: [{ label: "usable", kwh: 65, page: null, quote: "q" }] });
    const [f] = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [dual] }, [version()]);
    expect(f!.kind).toBe("nieuw");
  });
  it("steekproef is deterministisch en minstens één", () => {
    const fs = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant(), variant({ variant: "Single Motor" })] }, [version()]);
    const a = sampleForHumanCheck(fs);
    const b = sampleForHumanCheck(fs);
    expect(a).toHaveLength(1);
    expect(a[0]!.candidate.external_id).toBe(b[0]!.candidate.external_id);
  });
  it("rapport en CSV bevatten de uitvoering, de pagina's en het citaat", () => {
    const fs = compareExtraction(doc, state, { document_title: "t", valid_from: null, market: null, model_year: null, variants: [variant({ variant: "Twin Motor Performance", consumption_kwh_100km: { min: 17.5, max: null, page: 9, quote: "17.5" } })] }, [version()]);
    const md = renderReport({ date: "2026-10-06", documents: [{ doc, state: undefined }], findings: fs, orphanVersions: [], sample: fs });
    expect(md).toContain("Nieuwe uitvoeringen, klaar voor import (1)");
    expect(md).toContain("p. 4, 9");
    expect(md).toContain("Battery Size - usable, kWh");
    const csv = renderVerificationCsv(fs);
    expect(csv.split("\n")[1]).toMatch(/^volvo-ex30-twin-motor-performance-2025;65.0;69.0;17.5;11.0;22.0;3;nee;https:\/\/example.com\/ex30.pdf;/);
  });
});
