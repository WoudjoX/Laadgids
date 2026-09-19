// Copy nl-NL. Geen gewesten, geen capaciteitstarief, wel ISDE en saldering (fase 3).
import type { Copy, FaqItem } from "./types";

export const nlNL: Copy = {
  locale: "nl-NL",
  site: {
    name: "Laadgids",
    tagline: "Het juiste laadadvies voor jouw auto en jouw meter, met de cijfers erbij.",
    langSwitch: [{ locale: "nl-NL", label: "nl" }],
    home: "Home",
    footerAbout: "Over Laadgids",
    footerContact: "Contact",
    footerPrivacy: "Privacy",
    updated: "Bijgewerkt",
    regionLabel: { VLA: "Vlaanderen", WAL: "Wallonië", BRU: "Brussel" },
    regionNone: "Nederland",
    homeIntro: "Kies je model. Per versie: het maximale AC-vermogen, de aanbevolen aansluiting en de laadtijd voor een nacht.",
    cardRecommended: "aanbevolen",
    cardAc: "AC max.",
    cardBattery: "accu",
  },
  connections: {
    socket_2300: "Stopcontact (1-fase 10 A)",
    "1f_16a_3700": "1-fase 16 A",
    "1f_32a_7400": "1-fase 32 A",
    "3f_16a_11000": "3-fase 16 A",
    "3f_32a_22000": "3-fase 32 A",
  },
  charger: {
    sectionSlug: "laadpaal-voor",
    breadcrumbSection: "Laadpaal per model",
    h1: (v) => `Welke laadpaal voor een ${v.make} ${v.model} ${v.trim}?`,
    metaTitle: (v) => `Laadpaal voor ${v.make} ${v.model} ${v.trim}: ${v.recommendedKw} of niet? | Laadgids`,
    metaDescription: (v) =>
      `${v.make} ${v.model} ${v.trim} laadt thuis op maximaal ${v.acMax}. Laadtijd per aansluiting en kosten per tarief, bijgewerkt voor Nederland.`,
    shortAnswerLabel: "Kort antwoord",
    shortAnswer: (v) => {
      const s: string[] = [];
      s.push(`Neem een ${v.recommendedKw}-laadpaal (${v.recommendedLabel}).`);
      s.push(`De ${v.model} laadt op maximaal ${v.acMax}; van ${v.fromPct} naar ${v.toPct} % duurt dan ${v.recommendedTime}.`);
      if (v.advice.warnings.includes("single_phase_car_no_gain_3f")) {
        s.push("Een 3-fase laadpaal laadt deze auto niet sneller, maar is wel klaar voor een volgende auto.");
      } else if (v.advice.warnings.includes("no_gain_above_recommended")) {
        s.push(`Meer vermogen dan ${v.recommendedKw} levert niets op.`);
      }
      return s.slice(0, 4).join(" ");
    },
    metrics: {
      acMax: "Max. AC-vermogen",
      battery: "Accu (netto)",
      time: (v) => `${v.fromPct} naar ${v.toPct} % op ${v.recommendedKw}`,
    },
    table: {
      heading: (v) => `Laadtijd per aansluiting (${v.fromPct} naar ${v.toPct} %)`,
      colConnection: "Aansluiting",
      colPower: "Vermogen",
      colTime: "Laadtijd",
      recommended: "aanbevolen",
      noGain: "geen winst",
      note: (v) => `Gerekend met ${v.batteryNet} netto accu en 10 % laadverlies. Werkelijke tijden hangen af van temperatuur en laadcurve.`,
    },
    diagram: {
      title: "Hoe de stroom loopt",
      meter: "meterkast",
      charger: "laadpaal",
      car: "auto",
      single: "1-fase 32 A",
      three: "3-fase 16 A",
      caption: (v) =>
        v.acPhases === 1
          ? `De ${v.model} gebruikt één fase. Op een 3-fase aansluiting blijven twee fasen ongebruikt: zelfde ${v.acMax}.`
          : `De ${v.model} verdeelt het laden over drie fasen. Op één fase blijft er 7,4 kW over; met drie fasen ${v.acMax}.`,
    },
    reasons: {
      recommended_matches_car_max: (v) => `${v.recommendedLabel} benut het volledige AC-vermogen van de auto (${v.acMax}).`,
      small_battery_74_enough: (v) => `Met ${v.batteryNet} volstaat 7,4 kW voor een volle nacht laden.`,
      full_overnight_on_recommended: (v) => `${v.fromPct} naar ${v.toPct} % past ruim in één nacht (${v.recommendedTime}).`,
    },
    warnings: {
      single_phase_car_no_gain_3f: () =>
        "Deze auto laadt 1-fase. Een 3-fase laadpaal geeft geen tijdwinst, wel toekomstvastheid als je later een 11 kW-auto koopt.",
      peak_capacity_tariff: () => "",
      no_gain_above_recommended: (v) => `Aansluitingen boven ${v.recommendedKw} laden deze auto niet sneller.`,
    },
    cost: {
      heading: (v) => `Wat kost thuisladen voor de ${v.model}?`,
      perFull: "per volle lading",
      perKm: "per 100 km",
      perYear: (v) => `Bij ${v.kmPerYear} km per jaar, met 15 % realiteitsfactor op het WLTP-verbruik en 10 % laadverlies.`,
      saving: (v) =>
        v.savingYear && v.cheapestLabel
          ? `${v.cheapestFull} per volle lading met ${v.cheapestLabel}. Dat is ${v.savingYear} per jaar minder dan het standaardtarief.`
          : "",
      cta: "Vergelijk dynamische contracten",
      unavailable: "Er zijn nog geen geverifieerde tarieven voor Nederland. We tonen liever niets dan een verzonnen getal.",
    },
    peak: {
      heading: "",
      intro: () => "",
      without: "",
      with: "",
      perYear: "",
      scenario: (kw) => kw,
      verify: "",
      chartBaseline: "",
      chartCharger: "",
      chartMin: "",
      chartRows: { without: "", with: "", withLb: "" },
    },
    lead: {
      heading: "Offerte voor een laadpaal thuis",
      intro: (v) => `Twee tot drie erkende installateurs in je buurt sturen een offerte voor een ${v.recommendedKw}-installatie.`,
      postal: "Postcode",
      postalPlaceholder: "1234 AB",
      step1Button: "Vraag offertes aan",
      connection: "Huidige aansluiting",
      connectionOptions: [
        { value: "unknown", label: "Weet ik niet" },
        { value: "1F", label: "1-fase" },
        { value: "3F", label: "3-fase" },
      ],
      ampere: "Ampère (indien bekend)",
      power: "Gewenst vermogen",
      powerOptions: [
        { value: 7400, label: "7,4 kW" },
        { value: 11000, label: "11 kW" },
        { value: 22000, label: "22 kW" },
      ],
      homeOld: "Woning ouder dan 10 jaar",
      companyCar: "Het is een leaseauto van de zaak",
      email: "E-mail",
      phone: "Telefoon (optioneel)",
      consent: "Ik ga akkoord dat mijn gegevens naar maximaal drie installateurs gaan.",
      submit: "Verstuur aanvraag",
      footnote: "Gratis, vrijblijvend, erkende installateurs",
      success: "Je aanvraag is verstuurd. Je hoort binnen twee werkdagen van de installateurs.",
      errors: {
        postal: "Vul een Nederlandse postcode in (1234 AB).",
        email: "Vul een geldig e-mailadres in.",
        consent: "Zonder toestemming kunnen we je aanvraag niet doorsturen.",
        generic: "Er ging iets mis. Probeer het opnieuw.",
        rate: "Te veel aanvragen vanaf dit adres. Probeer later opnieuw.",
      },
    },
    companyCar: { heading: "", text: "", link: "" },
    faq: {
      heading: "Veelgestelde vragen",
      items: (v): FaqItem[] => {
        const items: FaqItem[] = [];
        items.push({
          q: `Laadt de ${v.model} sneller op een 22 kW-laadpaal?`,
          a:
            v.advice.recommended_connection === "3f_32a_22000"
              ? `Ja. Deze versie laadt AC op ${v.acMax}, dus een 3-fase 32 A-aansluiting benut dat volledig.`
              : `Nee. De boordlader beperkt AC-laden tot ${v.acMax}. Op 22 kW laadt de auto even snel als op ${v.recommendedKw}.`,
        });
        if (v.acPhases === 1) {
          items.push({
            q: `Heeft een 3-fase laadpaal zin voor de ${v.model}?`,
            a: `Niet voor de laadtijd: de auto laadt 1-fase op maximaal ${v.acMax}. Wel als je de installatie wilt klaarmaken voor een volgende auto met 11 kW.`,
          });
        }
        items.push({
          q: `Hoelang duurt een nacht laden voor de ${v.model}?`,
          a: `Van ${v.fromPct} naar ${v.toPct} % duurt ${v.recommendedTime} op ${v.recommendedKw}.`,
        });
        items.push({
          q: "Heb ik een 3-fase aansluiting nodig voor 11 kW?",
          a: "Ja. 11 kW vraagt 3 × 16 A. Met een 1-fase 25 A-aansluiting haal je maximaal 5,75 kW; verzwaren regel je via je netbeheerder.",
        });
        return items.slice(0, 5);
      },
    },
    related: {
      heading: "Verder lezen",
      sisters: "Andere modellen in dit segment",
      cost: "Laadkosten per tarief",
      rules: "Regels en subsidies",
    },
    sources: { heading: "Bronnen", checked: "gecontroleerd op" },
  },
  rulesPages: {
    isde: "ISDE-subsidie voor een laadpaal",
    saldering: "Einde saldering en slim laden",
    "1f-vs-3f": "1-fase of 3-fase aansluiten",
  },
  compare: {
    sectionSlug: "vergelijk",
    title: "Vergelijk twee modellen",
    intro: "Kies twee modellen. Je ziet per model het laadvermogen, de aanbevolen aansluiting, de laadtijd en de kosten per lading naast elkaar.",
    metaDescription: "Vergelijk het thuisladen van twee elektrische auto's: laadvermogen, aansluiting, laadtijd en kosten.",
    pickA: "Model A",
    pickB: "Model B",
    submit: "Vergelijk",
    same: "Kies twee verschillende modellen.",
    linkFromModel: "Vergelijk met een ander model",
    linkFromIndex: "Twee modellen vergelijken",
    colModel: "Model",
    rows: {
      acMax: "Max. AC-vermogen",
      battery: "Accu (netto)",
      range: "WLTP-actieradius",
      recommended: "Aanbevolen aansluiting",
      timeRecommended: "20 naar 80 % op aanbevolen aansluiting",
      time74: "20 naar 80 % op 7,4 kW",
      time11: "20 naar 80 % op 11 kW",
      costFullCheapest: "Volle lading, goedkoopste tarief",
      costFullDay: "Volle lading, standaardtarief",
      cost100Cheapest: "Per 100 km, goedkoopste tarief",
      capacity11: "",
    },
    note: "Zelfde uitgangspunten als op de modelpagina's: 10 % laadverlies, 15 % realiteitsfactor op het WLTP-verbruik, 12.000 km per jaar.",
  },
};
