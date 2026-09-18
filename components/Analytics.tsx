import Script from "next/script";
import { analyticsConfig } from "@/lib/analytics";

/** Laadt Plausible of Umami als de env dat vraagt. Geen cookies, geen banner. */
export function Analytics() {
  const cfg = analyticsConfig();
  if (!cfg) return null;
  return <Script src={cfg.scriptSrc} strategy="afterInteractive" defer {...cfg.attrs} />;
}
