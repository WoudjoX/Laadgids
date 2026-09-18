import { describe, expect, it } from "vitest";
import type { InstallerRow } from "@/lib/db/types";
import { matchInstallers, regionForBePostal } from "./match";

const installers: InstallerRow[] = [
  { id: 1, name: "Gent", regions: ["90"], contact_email: "a@x", price_per_lead_cents: null, active: true },
  { id: 2, name: "Oost-Vl", regions: ["9"], contact_email: "b@x", price_per_lead_cents: null, active: true },
  { id: 3, name: "Vlaanderen", regions: ["VLA"], contact_email: "c@x", price_per_lead_cents: null, active: true },
  { id: 4, name: "Wallonie", regions: ["WAL"], contact_email: "d@x", price_per_lead_cents: null, active: true },
  { id: 5, name: "Inactief", regions: ["9"], contact_email: "e@x", price_per_lead_cents: null, active: false },
];

describe("regionForBePostal", () => {
  it("wijst gewesten toe", () => {
    expect(regionForBePostal("1000")).toBe("BRU");
    expect(regionForBePostal("1300")).toBe("WAL");
    expect(regionForBePostal("2000")).toBe("VLA");
    expect(regionForBePostal("4000")).toBe("WAL");
    expect(regionForBePostal("9000")).toBe("VLA");
    expect(regionForBePostal("12345")).toBeNull();
  });
});

describe("matchInstallers", () => {
  it("rangschikt op specificiteit van de prefix, dan gewest, en negeert inactieve", () => {
    expect(matchInstallers(installers, "9000").map((i) => i.id)).toEqual([1, 2, 3]);
  });
  it("valt terug op gewest", () => {
    expect(matchInstallers(installers, "3500").map((i) => i.id)).toEqual([3]);
    expect(matchInstallers(installers, "5000").map((i) => i.id)).toEqual([4]);
  });
  it("geeft leeg voor onbekende postcode", () => {
    expect(matchInstallers(installers, "1234AB")).toEqual([]);
  });
});
