// Copy nl-BE. Toon: tweede persoon, kort, stellig, eerst het cijfer (DESIGN.md §7).
import type { Copy, FaqItem } from "./types";

export const nlBE: Copy = {
  locale: "nl-BE",
  site: {
    name: "Laadgids",
    tagline: "Het juiste laadadvies voor jouw auto, jouw meter en jouw gewest, met de cijfers erbij.",
    langSwitch: [
      { locale: "nl-BE", label: "nl" },
      { locale: "fr-BE", label: "fr" },
    ],
    home: "Home",
    footerAbout: "Over Laadgids",
    footerContact: "Contact",
    footerPrivacy: "Privacy",
    updated: "Bijgewerkt",
    regionLabel: { VLA: "Vlaanderen", WAL: "Wallonië", BRU: "Brussel" },
    regionNone: "België",
    homeIntro: "Kies je model. Per versie: het maximale AC-vermogen, de aanbevolen aansluiting en wat een nacht laden kost.",
    cardRecommended: "aanbevolen",
    cardAc: "AC max.",
    cardBattery: "batterij",
  },
  connections: {
    socket_2300: "Stopcontact (1-fasig 10 A)",
    "1f_16a_3700": "1-fasig 16 A",
    "1f_32a_7400": "1-fasig 32 A",
    "3f_16a_11000": "3-fasig 16 A",
    "3f_32a_22000": "3-fasig 32 A",
  },
  charger: {
    sectionSlug: "laadpaal-voor",
    breadcrumbSection: "Laadpaal per model",
    h1: (v) => `Welke laadpaal voor een ${v.make} ${v.model} ${v.trim}?`,
    metaTitle: (v) => `Laadpaal voor ${v.make} ${v.model} ${v.trim}: ${v.recommendedKw} of niet? | Laadgids`,
    metaDescription: (v) =>
      `${v.make} ${v.model} ${v.trim} laadt thuis op maximaal ${v.acMax}. Laadtijd per aansluiting, kosten per tarief en impact op het capaciteitstarief. Bijgewerkt voor ${v.region ? nlBE.site.regionLabel[v.region] : "België"}.`,
    shortAnswerLabel: "Kort antwoord",
    shortAnswer: (v) => {
      const s: string[] = [];
      s.push(`Neem een ${v.recommendedKw}-paal (${v.recommendedLabel}).`);
      s.push(`De ${v.model} laadt op maximaal ${v.acMax}; van ${v.fromPct} naar ${v.toPct} % duurt dan ${v.recommendedTime}.`);
      if (v.advice.warnings.includes("single_phase_car_no_gain_3f")) {
        s.push("Een 3-fasige paal laadt deze auto niet sneller, maar is wel klaar voor een volgende auto.");
      } else if (v.advice.warnings.includes("no_gain_above_recommended")) {
        s.push(`Meer vermogen dan ${v.recommendedKw} levert niets op.`);
      }
      if (v.advice.warnings.includes("peak_capacity_tariff") && v.capacityDelta) {
        s.push(`In Vlaanderen kost 11 kW zonder load balancing tot ${v.capacityDelta} per jaar extra capaciteitstarief.`);
      }
      return s.slice(0, 4).join(" ");
    },
    metrics: {
      acMax: "Max. AC-vermogen",
      battery: "Batterij (netto)",
      time: (v) => `${v.fromPct} naar ${v.toPct} % op ${v.recommendedKw}`,
    },
    table: {
      heading: (v) => `Laadtijd per aansluiting (${v.fromPct} naar ${v.toPct} %)`,
      colConnection: "Aansluiting",
      colPower: "Vermogen",
      colTime: "Laadtijd",
      recommended: "aanbevolen",
      noGain: "geen winst",
      note: (v) => `Gerekend met ${v.batteryNet} netto batterij en 10 % laadverlies. Werkelijke tijden hangen af van temperatuur en laadcurve.`,
    },
    diagram: {
      title: "Hoe de stroom loopt",
      meter: "meter",
      charger: "laadpaal",
      car: "auto",
      single: "1-fasig 32 A",
      three: "3-fasig 16 A",
      caption: (v) =>
        v.acPhases === 1
          ? `De ${v.model} gebruikt één fase. Op een 3-fasige aansluiting blijven twee fasen ongebruikt: zelfde ${v.acMax}.`
          : `De ${v.model} verdeelt het laden over drie fasen. Op één fase blijft er 7,4 kW over; met drie fasen ${v.acMax}.`,
    },
    reasons: {
      recommended_matches_car_max: (v) => `${v.recommendedLabel} benut het volledige AC-vermogen van de auto (${v.acMax}).`,
      small_battery_74_enough: (v) => `Met ${v.batteryNet} volstaat 7,4 kW voor een volle nacht laden.`,
      full_overnight_on_recommended: (v) => `${v.fromPct} naar ${v.toPct} % past ruim in één nacht (${v.recommendedTime}).`,
    },
    warnings: {
      single_phase_car_no_gain_3f: () =>
        "Deze auto laadt 1-fasig. Een 3-fasige paal geeft geen tijdwinst, wel toekomstvastheid als je later een 11 kW-auto koopt.",
      peak_capacity_tariff: () =>
        "In Vlaanderen telt je hoogste kwartierpiek per maand mee in het capaciteitstarief. Een 11 kW-lader die samenvalt met kookplaat of warmtepomp verhoogt die piek. Load balancing lost dat op.",
      no_gain_above_recommended: (v) => `Aansluitingen boven ${v.recommendedKw} laden deze auto niet sneller.`,
    },
    cost: {
      heading: (v) => `Wat kost thuisladen voor de ${v.model}?`,
      perFull: "per volle lading",
      perKm: "per 100 km",
      perYear: (v) => `Bij ${v.kmPerYear} km per jaar, met 15 % realiteitsfactor op het WLTP-verbruik en 10 % laadverlies.`,
      saving: (v) =>
        v.savingYear && v.cheapestLabel
          ? `${v.cheapestFull} per volle lading met ${v.cheapestLabel}. Dat is ${v.savingYear} per jaar minder dan het dagtarief.`
          : "",
      cta: "Vergelijk dynamische tarieven",
      unavailable: "Er zijn nog geen geverifieerde tarieven voor dit gewest. We tonen liever niets dan een verzonnen getal.",
    },
    peak: {
      heading: "Impact op het capaciteitstarief (Vlaanderen)",
      intro: (v) =>
        `Uitgangspunt: een huishoudelijke piek van ${v.capacity11 || v.capacity74 ? "3,5 kW" : ""} zonder lader. Het tarief rekent per kW boven 2,5 kW.`,
      without: "zonder load balancing",
      with: "met load balancing",
      perYear: "per jaar extra",
      scenario: (kw) => `${kw}-lader`,
      verify: "Verifieer het tarief van je netbeheerder; het wijzigt jaarlijks.",
      chartBaseline: "huishouden",
      chartCharger: "lader",
      chartMin: "minimum 2,5 kW",
      chartRows: { without: "zonder lader", with: "lader erbij", withLb: "met load balancing" },
    },
    lead: {
      heading: "Offerte voor een laadpaal thuis",
      intro: (v) => `Twee tot drie erkende installateurs in je buurt sturen een offerte voor een ${v.recommendedKw}-installatie.`,
      postal: "Postcode",
      postalPlaceholder: "9000",
      step1Button: "Vraag offertes aan",
      connection: "Huidige aansluiting",
      connectionOptions: [
        { value: "unknown", label: "Weet ik niet" },
        { value: "1F", label: "1-fasig" },
        { value: "3F", label: "3-fasig" },
      ],
      ampere: "Ampèrage (indien bekend)",
      power: "Gewenst vermogen",
      powerOptions: [
        { value: 7400, label: "7,4 kW" },
        { value: 11000, label: "11 kW" },
        { value: 22000, label: "22 kW" },
      ],
      homeOld: "Woning ouder dan 10 jaar (6 % btw)",
      companyCar: "Het is een bedrijfswagen",
      email: "E-mail",
      phone: "Telefoon (optioneel)",
      consent: "Ik ga akkoord dat mijn gegevens naar maximaal drie installateurs gaan.",
      submit: "Verstuur aanvraag",
      footnote: "Gratis, vrijblijvend, erkende installateurs",
      success: "Je aanvraag is verstuurd. Je hoort binnen twee werkdagen van de installateurs.",
      errors: {
        postal: "Vul een Belgische postcode van vier cijfers in.",
        email: "Vul een geldig e-mailadres in.",
        consent: "Zonder toestemming kunnen we je aanvraag niet doorsturen.",
        generic: "Er ging iets mis. Probeer het opnieuw.",
        rate: "Te veel aanvragen vanaf dit adres. Probeer later opnieuw.",
      },
    },
    companyCar: {
      heading: "Bedrijfswagen?",
      text: "Je werkgever betaalt thuisladen terug tegen het CREG-tarief per kwartaal. Daarvoor heb je een laadpaal met MID-meter nodig die het verbruik apart registreert.",
      link: "Lees de regels voor het CREG-tarief",
    },
    faq: {
      heading: "Veelgestelde vragen",
      items: (v): FaqItem[] => {
        const items: FaqItem[] = [];
        items.push({
          q: `Laadt de ${v.model} sneller op een 22 kW-paal?`,
          a:
            v.advice.recommended_connection === "3f_32a_22000"
              ? `Ja. Deze versie laadt AC op ${v.acMax}, dus een 3-fasige 32 A-aansluiting benut dat volledig.`
              : `Nee. De onboard-lader beperkt AC-laden tot ${v.acMax}. Op 22 kW laadt de auto even snel als op ${v.recommendedKw}.`,
        });
        if (v.acPhases === 1) {
          items.push({
            q: `Heeft een 3-fasige laadpaal zin voor de ${v.model}?`,
            a: `Niet voor de laadtijd: de auto laadt 1-fasig op maximaal ${v.acMax}. Wel als je de installatie wilt klaarmaken voor een volgende auto met 11 kW.`,
          });
        }
        items.push({
          q: `Hoelang duurt een nacht laden voor de ${v.model}?`,
          a: `Van ${v.fromPct} naar ${v.toPct} % duurt ${v.recommendedTime} op ${v.recommendedKw}. Een volle batterij van ${v.batteryNet} inclusief laadverlies is ongeveer ${v.cheapestFull ?? "—"} met het goedkoopste tarief.`,
        });
        if (v.region === "VLA" && v.capacityDelta && v.capacityDeltaLb) {
          items.push({
            q: `Wat doet een ${v.recommendedKw}-lader met mijn capaciteitstarief?`,
            a: `Zonder load balancing kan je maandpiek met ${v.recommendedKw} stijgen, goed voor tot ${v.capacityDelta} per jaar extra. Met load balancing blijft de extra kost rond ${v.capacityDeltaLb}, omdat de lader terugregelt als de rest van het huis piekt.`,
          });
        }
        items.push({
          q: "Moet ik mijn laadpaal melden bij de netbeheerder?",
          a: "Ja. In Vlaanderen meld je een thuislader bij Fluvius, in Wallonië bij ORES of RESA, in Brussel bij Sibelga. Je installateur doet dat meestal voor je.",
        });
        return items.slice(0, 5);
      },
    },
    related: {
      heading: "Verder lezen",
      sisters: "Andere modellen in dit segment",
      cost: "Laadkosten per tarief",
      rules: "Regels in je gewest",
    },
    sources: { heading: "Bronnen", checked: "gecontroleerd op" },
  },
  rulesPages: {
    "btw-6": "6 % btw op een laadpaal",
    "melding-netbeheerder": "Laadpaal melden bij de netbeheerder",
    "appartement-vme": "Laadpaal in een appartement (VME)",
    capaciteitstarief: "Capaciteitstarief en thuisladen",
    "creg-tarief": "CREG-tarief voor terugbetaling thuisladen",
    "1f-vs-3f": "1-fasig of 3-fasig aansluiten",
  },
};
