// Alle tekst op pSEO-pagina's komt uit lib/copy/{locale}.ts. Geen hardcoded strings in components.
import type { AdviceResult, ChargeTimeRow, ConnectionKey, ReasonCode, TariffComparison, WarningCode } from "@/lib/calc";
import type { CapacityScenario } from "@/lib/calc/capacityImpact";
import type { Locale, Region } from "@/lib/db/types";

/** Alles wat de copy-functies nodig hebben om zinnen te bouwen. Al geformatteerd waar het om getallen gaat. */
export interface ChargerPageVars {
  locale: Locale;
  make: string;
  model: string;
  trim: string;
  model_year: number | null;
  fullName: string; // "Tesla Model 3 RWD (2025)"
  region: Region | null;
  batteryNet: string; // "57,5 kWh"
  acMax: string; // "11 kW"
  acPhases: 1 | 3;
  recommendedLabel: string; // "3-fasig 16 A (11 kW)"
  recommendedKw: string; // "11 kW"
  recommendedTime: string; // "4 u 40 min"
  fromPct: number;
  toPct: number;
  advice: AdviceResult;
  cost: TariffComparison | null;
  cheapestLabel: string | null;
  cheapestFull: string | null; // "€ 9,20"
  savingYear: string | null; // "€ 260"
  kmPerYear: string; // "12.000"
  capacity11: CapacityScenario | null;
  capacity74: CapacityScenario | null;
  capacityDelta: string | null; // "€ 616"
  capacityDeltaLb: string | null; // "€ 420"
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Copy {
  locale: Locale;
  site: {
    name: string;
    tagline: string;
    langSwitch: { locale: Locale; label: string }[];
    home: string;
    footerAbout: string;
    footerContact: string;
    footerPrivacy: string;
    updated: string; // "Bijgewerkt"
    regionLabel: Record<Region, string>;
    regionNone: string;
    homeIntro: string;
    cardRecommended: string; // "aanbevolen"
    cardAc: string; // "AC max."
    cardBattery: string; // "batterij"
  };
  connections: Record<ConnectionKey, string>;
  charger: {
    sectionSlug: string; // "laadpaal-voor"
    breadcrumbSection: string;
    h1: (v: ChargerPageVars) => string;
    metaTitle: (v: ChargerPageVars) => string;
    metaDescription: (v: ChargerPageVars) => string;
    shortAnswerLabel: string;
    shortAnswer: (v: ChargerPageVars) => string; // 2 tot 4 zinnen
    metrics: { acMax: string; battery: string; time: (v: ChargerPageVars) => string };
    table: {
      heading: (v: ChargerPageVars) => string;
      colConnection: string;
      colPower: string;
      colTime: string;
      recommended: string;
      noGain: string;
      note: (v: ChargerPageVars) => string;
    };
    diagram: {
      title: string;
      meter: string; // "meter"
      charger: string; // "laadpaal"
      car: string; // "auto"
      single: string; // "1-fasig 32 A"
      three: string; // "3-fasig 16 A"
      caption: (v: ChargerPageVars) => string;
    };
    reasons: Record<ReasonCode, (v: ChargerPageVars) => string>;
    warnings: Record<WarningCode, (v: ChargerPageVars) => string>;
    cost: {
      heading: (v: ChargerPageVars) => string;
      perFull: string;
      perKm: string; // "per 100 km"
      perYear: (v: ChargerPageVars) => string;
      saving: (v: ChargerPageVars) => string;
      cta: string;
      unavailable: string;
    };
    peak: {
      heading: string;
      intro: (v: ChargerPageVars) => string;
      without: string;
      with: string;
      perYear: string;
      scenario: (kw: string) => string;
      verify: string;
      chartBaseline: string; // "huishouden"
      chartCharger: string; // "lader"
      chartMin: string; // "minimum 2,5 kW"
      chartRows: { without: string; with: string; withLb: string }; // "zonder lader", ...
    };
    lead: {
      heading: string;
      intro: (v: ChargerPageVars) => string;
      postal: string;
      postalPlaceholder: string;
      step1Button: string;
      connection: string;
      connectionOptions: { value: "1F" | "3F" | "unknown"; label: string }[];
      ampere: string;
      power: string;
      powerOptions: { value: number; label: string }[];
      homeOld: string;
      companyCar: string;
      email: string;
      phone: string;
      consent: string;
      submit: string;
      footnote: string;
      success: string;
      errors: { postal: string; email: string; consent: string; generic: string; rate: string };
    };
    companyCar: { heading: string; text: string; link: string };
    faq: { heading: string; items: (v: ChargerPageVars) => FaqItem[] };
    related: { heading: string; sisters: string; cost: string; rules: string };
    sources: { heading: string; checked: string };
  };
  rulesPages: Record<string, string>; // topic-slug → titel, voor related links
  compare: {
    sectionSlug: string; // "vergelijk"
    title: string;
    intro: string;
    metaDescription: string;
    pickA: string;
    pickB: string;
    submit: string;
    same: string; // twee keer hetzelfde model gekozen
    linkFromModel: string; // "Vergelijk met een ander model"
    linkFromIndex: string; // "Twee modellen vergelijken"
    colModel: string;
    rows: {
      acMax: string;
      battery: string;
      range: string;
      recommended: string;
      timeRecommended: string;
      time74: string;
      time11: string;
      costFullCheapest: string;
      costFullDay: string;
      cost100Cheapest: string;
      capacity11: string;
    };
    note: string;
  };
}

export function connectionLabel(copy: Copy, row: Pick<ChargeTimeRow, "connection">): string {
  return copy.connections[row.connection];
}
