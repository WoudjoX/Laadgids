import { describe, expect, it } from "vitest";
import { EeaAggregator, detectSeparator, splitCsvLine, toCandidates } from "./eea";

const header = "ID,Country,Mk,Cn,Va,Ft,Ewltp,z (Wh/km),Electric range (km),year";
const rows = [
  "1,BE,TESLA,MODEL 3,RWD,ELECTRIC,0,132,513,2025",
  "2,BE,TESLA,MODEL 3,RWD,ELECTRIC,0,132,513,2025",
  "3,NL,TESLA,MODEL 3,RWD,ELECTRIC,0,132,513,2025",
  "4,DE,TESLA,MODEL 3,RWD,ELECTRIC,0,132,513,2025",
  "5,BE,LEAPMOTOR,C10,REEV,PETROL/ELECTRIC,10,,145,2025",
  "6,BE,VOLKSWAGEN,GOLF,,PETROL,120,,,2025",
  '7,BE,"SKODA","ENYAQ, 85",85,ELECTRIC,0,155,580,2025',
];

describe("csv helpers", () => {
  it("detecteert het scheidingsteken en respecteert aanhalingstekens", () => {
    expect(detectSeparator("a;b;c")).toBe(";");
    expect(detectSeparator(header)).toBe(",");
    expect(splitCsvLine('7,BE,"SKODA","ENYAQ, 85",85', ",")).toEqual(["7", "BE", "SKODA", "ENYAQ, 85", "85"]);
  });
});

describe("EeaAggregator", () => {
  it("telt inschrijvingen per variant voor BE en NL, negeert andere landen en brandstoffen", () => {
    const agg = new EeaAggregator(splitCsvLine(header, ","));
    for (const r of rows) agg.add(splitCsvLine(r, ","));
    const v = agg.values();
    expect(agg.rowsSeen).toBe(7);
    expect(agg.rowsKept).toBe(5);
    const tesla = v.find((x) => x.model === "Model 3")!;
    expect(tesla.be).toBe(2);
    expect(tesla.nl).toBe(1);
    expect(tesla.consumption_wh_per_km).toBe(132);
    expect(v.find((x) => x.model === "Golf")).toBeUndefined();
    expect(v[0]!.model).toBe("Model 3"); // gesorteerd op totaal
  });
  it("markeert hybrides voor handmatige bevestiging en zet CO2", () => {
    const agg = new EeaAggregator(splitCsvLine(header, ","));
    for (const r of rows) agg.add(splitCsvLine(r, ","));
    const c = toCandidates(agg.values(), "2025", "2026-09-10");
    const leap = c.find((x) => x.model_name === "C10")!;
    expect(leap.registrations_be).toBe(1);
    expect(leap.co2_wltp_g_km).toBe(10);
    expect(leap.review_notes).toMatch(/phev of erev/);
    expect(c.find((x) => x.model_name === "Model 3")!.review_notes).toBeNull();
  });
  it("gooit als een verplichte kolom ontbreekt", () => {
    expect(() => new EeaAggregator(["ID", "Mk"])).toThrow(/Country/);
  });
});
