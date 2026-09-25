import { describe, expect, it } from "vitest";
import { matchPicks, resolvePick } from "./pick";

const items = [
  { slug: "tesla-model-3-rwd-2025", label: "Tesla Model 3 RWD (2025)" },
  { slug: "tesla-model-y-long-range-rwd-2025", label: "Tesla Model Y Long Range RWD (2025)" },
  { slug: "volkswagen-id4-pro-2025", label: "Volkswagen ID.4 Pro (2025)" },
  { slug: "volkswagen-id3-pro-2025", label: "Volkswagen ID.3 Pro (2025)" },
];

describe("resolvePick", () => {
  it("vindt een exact label, ongeacht hoofdletters en leestekens", () => {
    expect(resolvePick("tesla model 3 rwd (2025)", items)?.slug).toBe("tesla-model-3-rwd-2025");
    expect(resolvePick("Volkswagen ID.4 Pro (2025)", items)?.exact).toBe(true);
  });
  it("vindt een unieke gedeeltelijke match", () => {
    expect(resolvePick("id.4", items)?.slug).toBe("volkswagen-id4-pro-2025");
    expect(resolvePick("model y", items)?.slug).toBe("tesla-model-y-long-range-rwd-2025");
  });
  it("geeft null bij meerdere of geen matches", () => {
    expect(resolvePick("tesla", items)).toBeNull();
    expect(resolvePick("kona", items)).toBeNull();
    expect(resolvePick("", items)).toBeNull();
  });
  it("matchPicks geeft alle kandidaten", () => {
    expect(matchPicks("tesla", items).map((i) => i.slug)).toHaveLength(2);
    expect(matchPicks("id", items)).toHaveLength(2);
  });
});
