// Privacyvriendelijke analytics zonder cookiebanner (CLAUDE.md §7): Plausible of Umami, gekozen via env.
// Events: lead_submitted, energy_cta_click, calc_interaction. Geen van beide actief zonder env → niets geladen.

export type AnalyticsEvent = "lead_submitted" | "energy_cta_click" | "calc_interaction";

export interface AnalyticsConfig {
  provider: "plausible" | "umami";
  scriptSrc: string;
  /** Attributen voor de <script>-tag. */
  attrs: Record<string, string>;
}

export function analyticsConfig(env: NodeJS.ProcessEnv = process.env): AnalyticsConfig | null {
  const plausibleDomain = env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (plausibleDomain) {
    const host = (env.NEXT_PUBLIC_PLAUSIBLE_HOST ?? "https://plausible.io").replace(/\/$/, "");
    // tagged-events: events via class="plausible-event-name=..." zonder eigen JS.
    return { provider: "plausible", scriptSrc: `${host}/js/script.tagged-events.js`, attrs: { "data-domain": plausibleDomain } };
  }
  const umamiId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (umamiId) {
    const host = (env.NEXT_PUBLIC_UMAMI_HOST ?? "https://cloud.umami.is").replace(/\/$/, "");
    return { provider: "umami", scriptSrc: `${host}/script.js`, attrs: { "data-website-id": umamiId } };
  }
  return null;
}

/**
 * Attributen voor een element waarvan de klik of submit als event moet tellen.
 * Werkt voor beide providers tegelijk; zonder provider zijn ze onschadelijk.
 */
export function eventAttrs(event: AnalyticsEvent, extraClass = ""): { className: string; "data-umami-event": string; "data-event": string } {
  return {
    className: [extraClass, `plausible-event-name=${event}`].filter(Boolean).join(" "),
    "data-umami-event": event,
    "data-event": event,
  };
}
