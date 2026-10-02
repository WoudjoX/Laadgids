import { describe, expect, it } from "vitest";
import { analyticsConfig } from "./index";

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe("analyticsConfig", () => {
  it("geen provider zonder env, en lege waarden tellen als niet gezet", () => {
    expect(analyticsConfig(env({}))).toBeNull();
    expect(analyticsConfig(env({ NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "", NEXT_PUBLIC_UMAMI_WEBSITE_ID: " " }))).toBeNull();
  });
  it("Plausible met standaardhost, ook als de host-variabele leeg doorgegeven wordt", () => {
    const c = analyticsConfig(env({ NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "laadgids.be", NEXT_PUBLIC_PLAUSIBLE_HOST: "" }));
    expect(c?.provider).toBe("plausible");
    expect(c?.scriptSrc).toBe("https://plausible.io/js/script.tagged-events.js");
    expect(c?.attrs["data-domain"]).toBe("laadgids.be");
  });
  it("Umami als Plausible niet gezet is; eigen host zonder slash op het einde", () => {
    const c = analyticsConfig(env({ NEXT_PUBLIC_UMAMI_WEBSITE_ID: "abc", NEXT_PUBLIC_UMAMI_HOST: "https://stats.example.com/" }));
    expect(c?.provider).toBe("umami");
    expect(c?.scriptSrc).toBe("https://stats.example.com/script.js");
  });
});
