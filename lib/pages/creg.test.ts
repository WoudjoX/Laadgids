import { describe, expect, it } from "vitest";
import type { RuleRow, VersionFull } from "@/lib/db/types";
import { cregReimbursement } from "./creg";

const v = { make: { id: 1, slug: "tesla", name: "Tesla" }, vehicle: { model: "Model 3" } } as unknown as VersionFull;
const rule = (from: string, to: string, quarter: string, rates: Record<string, number>, id = 1): RuleRow => ({
  id, country: "BE", region: null, rule_type: "creg_tariff", valid_from: from, valid_to: to,
  params: { cents_per_kwh_by_region: rates, quarter }, source_url: "https://www.creg.be/x", source_checked_at: "2026-10-30", notes: null,
}) as RuleRow;
const rules = [rule("2026-07-01", "2026-09-30", "2026-Q3", { VLA: 32.22, WAL: 37.83 }, 7), rule("2026-10-01", "2026-12-31", "2026-Q4", { VLA: 32.25, WAL: 37.79 }, 8)];

describe("cregReimbursement", () => {
  it("rekent kWh per jaar maal het CREG-tarief van het gewest van de locale, in het geldende kwartaal", () => {
    const nl = cregReimbursement(v, rules, "nl-BE", 2_000_000, 12000, "2026-10-30")!;
    expect(nl.vars.quarter).toBe("Q4 2026");
    expect(nl.vars.region).toBe("Vlaanderen");
    expect(nl.vars.kwh).toBe("2.000");
    expect(nl.vars.perYear).toBe("€ 645"); // 2000 × 32,25 c
    const fr = cregReimbursement(v, rules, "fr-BE", 2_000_000, 12000, "2026-10-30")!;
    expect(fr.vars.rate).toBe("37,79 centimes");
    expect(cregReimbursement(v, rules, "nl-BE", 2_000_000, 12000, "2026-08-01")!.vars.quarter).toBe("Q3 2026");
  });
  it("null in Nederland en zonder geldige regel (randgeval)", () => {
    expect(cregReimbursement(v, rules, "nl-NL", 2_000_000, 12000, "2026-10-30")).toBeNull();
    expect(cregReimbursement(v, rules, "nl-BE", 2_000_000, 12000, "2027-01-15")).toBeNull();
  });
});
