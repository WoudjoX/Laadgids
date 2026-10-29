import { describe, expect, it } from "vitest";
import { costPath, tariffPathSlug } from "@/lib/copy";

describe("costPath", () => {
  it("Franse adressen krijgen een Franse tariefslug, Nederlandse houden de dataslug", () => {
    expect(costPath("fr-BE", "tesla-model-3-rwd-2025", "vast-dag")).toBe("/fr-be/cout-recharge/tesla-model-3-rwd-2025/fixe-jour");
    expect(costPath("nl-BE", "tesla-model-3-rwd-2025", "vast-dag")).toBe("/nl-be/laadkosten/tesla-model-3-rwd-2025/vast-dag");
    expect(tariffPathSlug("nl-NL", "dynamisch-slim")).toBe("dynamisch-slim");
  });
  it("onbekende tariefslug blijft ongewijzigd (randgeval)", () => {
    expect(tariffPathSlug("fr-BE", "nieuw-tarief")).toBe("nieuw-tarief");
  });
});
