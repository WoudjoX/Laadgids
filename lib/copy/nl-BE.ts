// Copy nl-BE. Toon: tweede persoon, kort, stellig, eerst het cijfer (DESIGN.md §7).
import type { Copy, FaqItem } from "./types";

export const nlBE: Copy = {
  locale: "nl-BE",
  site: {
    name: "Laadgids",
    notFound: { title: "Pagina niet gevonden", body: "Deze pagina bestaat niet of is verplaatst.", home: "Naar de startpagina", models: "Alle modellen bekijken" },
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
    cardTime: "20 naar 80 %",
  },
  home: {
    h1: "Welke laadpaal past bij jouw auto?",
    pickLabel: "Kies je model",
    pickButton: "Toon advies",
    exampleLabel: "Zo ziet een antwoord eruit",
    exampleLink: (model) => `Volledig advies voor de ${model}`,
    trust: (date) => `Berekend met tarieven en regels van ${date}. Elke pagina vermeldt haar bronnen en de datum van controle.`,
    group: (kw) => `Laadt thuis tot ${kw}`,
    allModels: "Alle modellen",
    pickPlaceholder: "Typ merk of model, bv. ID.4",
    pickHelp: "Begin te typen en kies uit de lijst.",
    noMatch: (q) => `Geen model gevonden voor "${q}". Kies hieronder of typ een ander merk.`,
    makesHeading: "Merken",
    allMakes: "Alle merken",
    makesIntro: "Kies je merk. De laadtijd is die van 20 naar 80 % op de aanbevolen aansluiting; per uitvoering zie je ook het juiste vermogen en wat thuisladen kost.",
    makeTileCount: (n) => `${n} ${n === 1 ? "model" : "modellen"}`,
    makeTileTime: (from, to, same) => (same ? `laadt in ${from}` : `laadt in ${from} tot ${to}`),
    allModelsLink: (n) => `Alle ${n} modellen bekijken`,
    exceptionsHeading: "Let op bij deze modellen",
    exceptionsIntro: "De meeste elektrische auto's laden thuis op 11 kW, driefasig. Voor deze modellen is het advies anders.",
    exceptionReason: {
      one_phase: (kw) => `laadt eenfasig tot ${kw}: een driefasige paal geeft geen tijdwinst`,
      above_11: (kw) => `laadt tot ${kw}: dat vraagt een driefasige aansluiting van 32 A`,
      below_11: (kw) => `laadt tot ${kw}: een gewone 11 kW-paal volstaat ruim`,
    },
  },
  method: {
    slug: "hoe-we-rekenen",
    title: "Hoe we rekenen",
    metaDescription: "De aannames en formules achter elke berekening op Laadgids: laadvermogen, laadtijd, verbruik, stroomprijs, capaciteitstarief en CREG-terugbetaling.",
    intro: "Elke pagina op Laadgids is een berekening. Hier staan de aannames en formules die we gebruiken, met de waarden die vandaag gelden. Wijzigt een tarief of regel, dan rekenen we alle pagina's opnieuw door.",
    sections: (v) => [
      {
        heading: "Laadvermogen en laadtijd",
        paragraphs: [
          "Je auto laadt thuis op het laagste van twee vermogens: het maximale AC-laadvermogen van de auto en wat de aansluiting levert. Een auto die 1-fasig laadt, haalt op een 3-fasige paal hoogstens 7,4 kW. Een 3-fasige auto op een 1-fasige aansluiting ook.",
          `De laadtijd rekenen we van ${v.fromPct} naar ${v.toPct} % van de batterij, met ${v.lossPct} laadverlies: uit het net komt meer energie dan er in de batterij terechtkomt.`,
          "Het aanbevolen vermogen is de kleinste aansluiting waarop de auto zijn maximale AC-vermogen haalt. Een grotere aansluiting laadt die auto niet sneller.",
        ],
      },
      {
        heading: "Batterij",
        paragraphs: [
          "We rekenen met de bruikbare (netto) capaciteit als de fabrikant die publiceert. Publiceert hij alleen de nominale capaciteit, dan rekenen we de laadtijd daarmee. Dat is een bovengrens, en dan tonen we geen kost per volle lading.",
          "Staat er '(schatting)' bij de batterij, dan heeft de fabrikant die waarde niet zelf gepubliceerd. Een noot op die pagina vermeldt dat; laadtijd en kost per lading kunnen dan enkele procenten afwijken.",
        ],
      },
      {
        heading: "Verbruik en kosten",
        paragraphs: [
          `We vertrekken van het gecombineerde WLTP-verbruik van de fabrikant en tellen er ${v.realWorldPct} bij, omdat het verbruik op de weg hoger ligt dan de testwaarde. Daarbovenop komt ${v.lossPct} laadverlies.`,
          `De kost is het aantal kWh uit het net maal de prijs per kWh. Per jaar rekenen we met ${v.km} km.`,
          `Als prijs gebruiken we het CREG-tarief van het gewest als referentie, inclusief alle kosten per kWh: ${v.tariffs.map((t) => `${t.region} ${t.price} per kWh (gecontroleerd op ${t.checked})`).join(", ")}. Je eigen contract kan hoger of lager liggen.`,
        ],
      },
      ...(v.capacity
        ? [
            {
              heading: "Capaciteitstarief in Vlaanderen",
              paragraphs: [
                `In Vlaanderen betaal je een deel van de netkosten per kW van je hoogste kwartierpiek per maand, met een minimum van ${v.capacity.minKw}. We rekenen met ${v.capacity.incl} per kW per jaar${v.capacity.vatPct ? ` inclusief ${v.capacity.vatPct} btw` : ""}${v.capacity.isAverage ? ", het gemiddelde van de netbeheerders" : ""} (gecontroleerd op ${v.capacity.checked}).`,
                `Uitgangspunt is een huishoudelijke piek van ${v.capacity.baselineKw} zonder lader. Zonder load balancing tellen we het laadvermogen daarbovenop. Met load balancing regelt de lader terug als het huis veel verbruikt; de piek is dan het hoogste van de twee, het huis of de lader.`,
              ],
            },
          ]
        : []),
      ...(v.creg
        ? [
            {
              heading: "Terugbetaling voor een bedrijfswagen",
              paragraphs: [
                `Je werkgever kan thuisladen terugbetalen tegen het CREG-tarief, per gewest en per kwartaal. We rekenen het aantal kWh per jaar (zoals hierboven) maal het CREG-tarief van ${v.creg.quarter} (gecontroleerd op ${v.creg.checked}).`,
              ],
            },
          ]
        : []),
      {
        heading: "Bronnen en controle",
        paragraphs: [
          "Specificaties komen uit prijslijsten en technische fiches van de fabrikant, met datum. Een wekelijkse controle legt onze cijfers naast die documenten; een mens beslist over elke wijziging. Regels en tarieven voeren we met de hand in, telkens met bron en datum.",
          "Ontbreekt een gegeven dat een berekening nodig heeft, dan vragen we Google die pagina niet op te nemen.",
        ],
      },
      {
        heading: "Wat we niet meerekenen",
        paragraphs: ["De invloed van temperatuur en voorverwarmen, snelladen onderweg, vaste kosten op je factuur die niet per kWh gaan, en zonnepanelen. Dynamische tarieven volgen later."],
      },
    ],
  },
  makeHub: {
    sectionSlug: "merk",
    breadcrumb: "Merken",
    h1: (make) => `Laadpaal voor een ${make}`,
    metaTitle: (make, n) => `Laadpaal voor ${make}: ${n} ${n === 1 ? "model" : "modellen"} berekend | Laadgids`,
    metaDescription: (make, n, powers) => `Welke laadpaal past bij een ${make}? ${n} ${n === 1 ? "uitvoering" : "uitvoeringen"} met laadtijd per aansluiting, kosten en aanbevolen vermogen (${powers}).`,
    intro: (v) =>
      `${v.count === 1 ? "Eén uitvoering" : `${v.count} uitvoeringen`} van ${v.make}, met AC-laadvermogen tot ${v.powers}.` +
      (v.singlePhaseCount > 0 ? ` ${v.singlePhaseCount === 1 ? "Eén ervan laadt" : `${v.singlePhaseCount} ervan laden`} 1-fasig; een 3-fasige paal geeft daar geen tijdwinst.` : " Alle uitvoeringen laden 3-fasig.") +
      (v.minTime === v.maxTime ? ` Van 20 naar 80 % duurt ${v.minTime} op de aanbevolen aansluiting.` : ` Van 20 naar 80 % duurt tussen ${v.minTime} en ${v.maxTime} op de aanbevolen aansluiting.`),
    modelsHeading: (make) => `Modellen van ${make}`,
    otherMakes: "Andere merken",
    costHeading: "Laadkosten per uitvoering",
    costIntro: (tariff, price, loss, km) => `Gerekend met ${tariff} van ${price} per kWh, ${loss} laadverlies en ${km} km per jaar. Klik op een uitvoering voor de berekening en de bronnen.`,
    allCostsLink: "Laadkosten van alle merken",
    faq: (v) => {
      const out: FaqItem[] = [];
      const g0 = v.groups[0]!;
      out.push({
        q: `Welke laadpaal heb ik nodig voor een ${v.make}?`,
        a:
          v.groups.length === 1
            ? `${v.count === 1 ? `Een ${g0.power}-paal (${g0.connection}) volstaat.` : `Voor alle ${v.count} uitvoeringen volstaat een ${g0.power}-paal (${g0.connection}).`} Meer vermogen levert geen tijdwinst op.`
            : `Dat hangt af van de uitvoering. ${v.groups.map((g) => `${g.power} (${g.connection}): ${g.names}.`).join(" ")} Meer vermogen dan aanbevolen levert geen tijdwinst op.`,
      });
      const sp = v.singlePhase;
      out.push({
        q: `Laadt een ${v.make} 3-fasig?`,
        a: !sp
          ? v.count === 1 ? "Ja, deze uitvoering laadt 3-fasig." : `Ja, alle ${v.count} uitvoeringen laden 3-fasig.`
          : sp.count === v.count
            ? `Nee, ${v.count === 1 ? "deze uitvoering laadt" : "alle uitvoeringen laden"} 1-fasig, tot ${sp.power}. Een 3-fasige paal laadt niet sneller, maar is wel klaar voor een volgende auto.`
            : `Niet allemaal. ${sp.names} ${sp.count === 1 ? "laadt" : "laden"} 1-fasig, tot ${sp.power}; daar geeft een 3-fasige paal geen tijdwinst. De andere uitvoeringen laden 3-fasig.`,
      });
      if (v.cost) {
        const c = v.cost;
        out.push({
          q: `Wat kost thuisladen van een ${v.make}?`,
          a:
            v.count === 1
              ? `Met ${c.tariff} van ${c.price} per kWh kost 100 km ${c.min}, of ${c.yearMin} per jaar bij ${c.km} km.`
              : `Met ${c.tariff} van ${c.price} per kWh kost 100 km tussen ${c.min} (${c.minName}) en ${c.max} (${c.maxName}). Bij ${c.km} km per jaar is dat tussen ${c.yearMin} en ${c.yearMax}.`,
        });
      }
      const t = v.time;
      out.push({
        q: `Hoe lang duurt thuisladen van een ${v.make}?`,
        a: v.count === 1 ? `Van 20 naar 80 % duurt ${t.min} op de aanbevolen aansluiting.` : `Van 20 naar 80 % op de aanbevolen aansluiting duurt het van ${t.min} (${t.minName}) tot ${t.max} (${t.maxName}).`,
      });
      return out;
    },
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
    metaTitleShort: (v) => `Laadpaal voor ${v.make} ${v.model} ${v.trim}`,
    metaDescription: (v) =>
      `${v.make} ${v.model} ${v.trim} laadt thuis op maximaal ${v.acMax}. Laadtijd per aansluiting, kosten per tarief en impact op het capaciteitstarief. Bijgewerkt voor ${v.region ? nlBE.site.regionLabel[v.region] : "België"}.`,
    shortAnswerLabel: "Kort antwoord",
    shortAnswer: (v) => {
      const s: string[] = [];
      s.push(`Neem een ${v.recommendedKw}-paal (${v.recommendedLabel}).`);
      s.push(`De ${v.make} ${v.model} laadt op maximaal ${v.acMax}; van ${v.fromPct} naar ${v.toPct} % duurt dan ${v.recommendedTime}.`);
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
      batteryEstimated: "Batterij (schatting)",
      batteryNominal: "Batterij (nominaal)",
      time: (v) => `${v.fromPct} naar ${v.toPct} % op ${v.recommendedKw}`,
    },
    nominalNote: (v) => `${v.make} publiceert voor dit model alleen de nominale capaciteit van ${v.batteryNet}. De bruikbare capaciteit ligt enkele procenten lager, dus de laadtijden op deze pagina zijn een bovengrens. De kosten per 100 km en per jaar rekenen met het verbruik en hangen daar niet van af.`,
    estimateNote: (v) => `De netto batterijcapaciteit van ${v.batteryNet} is een schatting: ${v.make} publiceert geen officieel cijfer. Laadtijden en kosten per lading kunnen enkele procenten afwijken.`,
    table: {
      heading: (v) => `Laadtijd per aansluiting (${v.fromPct} naar ${v.toPct} %)`,
      colConnection: "Aansluiting",
      colPower: "Vermogen",
      colTime: "Laadtijd",
      recommended: "aanbevolen",
      noGain: "geen winst",
      note: (v) => `Gerekend met ${v.batteryNet} ${v.batteryNominal ? "nominale batterijcapaciteit" : "netto batterij"} en 10 % laadverlies. Werkelijke tijden hangen af van temperatuur en laadcurve.`,
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
        "In Vlaanderen telt je hoogste kwartierpiek per maand mee in het capaciteitstarief. Een 11 kW-lader die samenvalt met kookplaat of warmtepomp verhoogt die piek. Load balancing beperkt die piek.",
      no_gain_above_recommended: (v) => `Aansluitingen boven ${v.recommendedKw} laden deze auto niet sneller.`,
    },
    cost: {
      heading: (v) => `Wat kost thuisladen voor de ${v.model}?`,
      perFull: "per volle lading",
      perKm: "per 100 km",
      perYear: (v) => `Bij ${v.kmPerYear} km per jaar, met 15 % realiteitsfactor op het WLTP-verbruik en 10 % laadverlies.`,
      saving: (v) =>
        v.savingYear && v.cheapestLabel
          ? `${v.cheapestFull} per volle lading met ${v.cheapestLabel}. Dat is ${v.savingYear} per jaar minder dan het vaste tarief.`
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
      tariffLine: (v) =>
        v.capacityTariffExcl && v.capacityTariffIncl
          ? `VREG: ${v.capacityIsAverage ? "gemiddeld " : ""}${v.capacityTariffExcl} per kW per jaar excl. btw, dat is ongeveer ${v.capacityTariffIncl} incl. ${v.capacityVatPct} btw (eigen omrekening). Het exacte tarief verschilt per netgebied.`
          : "",
      verify: "Verifieer het tarief van je netbeheerder; het wijzigt jaarlijks.",
      chartBaseline: "huishouden",
      chartCharger: "lader",
      chartMin: "minimum 2,5 kW",
      chartRows: { without: "zonder lader", with: "lader erbij", withLb: "met load balancing" },
    },
    lead: {
      jump: "Offerte aanvragen voor een laadpaal",
      heading: "Offerte voor een laadpaal thuis",
      intro: (v) => `Vraag een offerte aan voor een ${v.recommendedKw}-installatie. We bezorgen je aanvraag aan maximaal drie installateurs in je regio, uiterlijk binnen vier weken.`,
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
      consent: "Ik ga akkoord dat mijn gegevens naar maximaal drie installateurs gaan, ook als dat pas later gebeurt (uiterlijk binnen vier weken).",
      submit: "Verstuur aanvraag",
      footnote: "Gratis en vrijblijvend",
      success: "Je aanvraag is ontvangen. Je krijgt meteen een bevestiging per e-mail; daarin staat wanneer een installateur contact opneemt.",
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
      reimburse: (v) => `Met de ${v.make} ${v.model} laad je bij ${v.km} km per jaar ongeveer ${v.kwh} kWh. Terugbetaald tegen het CREG-tarief voor ${v.region} in ${v.quarter} (${v.rate} per kWh) is dat ${v.perYear} per jaar.`,
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
          a: `Van ${v.fromPct} naar ${v.toPct} % duurt ${v.recommendedTime} op ${v.recommendedKw}.` + (v.batteryNominal || !v.cheapestFull ? "" : ` Een volle batterij van ${v.batteryNet} inclusief laadverlies is ongeveer ${v.cheapestFull} met ${v.cheapestLabel}.`),
        });
        if (v.region === "VLA" && v.capacityDelta && v.capacityDeltaLb) {
          items.push({
            q: `Wat doet een ${v.recommendedKw}-lader met mijn capaciteitstarief?`,
            a: `Zonder load balancing kan je maandpiek met ${v.recommendedKw} stijgen, goed voor tot ${v.capacityDelta} per jaar extra. Met load balancing blijft de extra kost rond ${v.capacityDeltaLb}, omdat de lader terugregelt als de rest van het huis piekt.`,
          });
        }
        items.push({
          q: `Hoeveel kilometer laad je per uur met de ${v.make} ${v.model}?`,
          a: `Ongeveer ${v.kmPerHour} km bereik per uur op ${v.recommendedKw}, gerekend met het WLTP-verbruik plus 15 % en 10 % laadverlies.`,
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
    sources: { heading: "Bronnen", checked: "gecontroleerd op", specNotes: "Opmerking bij de specificaties", specTitle: (make, model) => `${make} ${model}: specificaties`, cregTitle: "CREG: tarief voor terugbetaling thuisladen bedrijfswagens", capacityTitle: "VREG / Fluvius: capaciteitstarief", tariffTitle: "CREG: tarief voor thuisladen per gewest" },
  },
  rulesPages: {
    "eenfasig-vs-driefasig-laden": "Eenfasig of driefasig laden?",
    "capaciteitstarief-laadpaal": "Wat laden doet met je capaciteitstarief",
    "creg-tarief-thuisladen": "CREG-tarief voor thuisladen",
    "melding-netbeheerder-laadpaal": "Laadpaal melden bij de netbeheerder",
    "btw-6-procent-laadpaal": "6% of 21% btw op je laadpaal?",
    "laadpaal-appartement": "Laadpaal in je appartement: zo pak je het aan",
  },
  cost: {
    sectionSlug: "laadkosten",
    breadcrumbSection: "Laadkosten per model",
    h1: (v) => `Wat kost thuisladen voor een ${v.make} ${v.model} ${v.trim}?`,
    metaTitle: (v) => `Laadkosten ${v.make} ${v.model} ${v.trim}: ${v.per100km} per 100 km | Laadgids`,
    metaTitleShort: (v) => `Laadkosten ${v.make} ${v.model} ${v.trim}`,
    index: {
      intro: (tariff, price, loss, km) => `Wat thuisladen kost per 100 km en per jaar, voor elke uitvoering op de site. Gerekend met ${tariff} van ${price} per kWh, ${loss} laadverlies en ${km} km per jaar. Klik op een model voor de berekening en de bronnen.`,
      colModel: "Uitvoering",
      colPer100: "Per 100 km",
      colYear: (km) => `Per jaar (${km} km)`,
      makeLink: (make) => `Laadpaal voor een ${make}`,
    },
    metaDescription: (v) => `Thuisladen van een ${v.make} ${v.model} ${v.trim} kost ${v.per100km} per 100 km${v.perFull ? ` en ${v.perFull} per volle lading` : ""} met ${v.tariffLabel} (${v.pricePerKwh} per kWh).`,
    shortAnswer: (v) => `Thuisladen van een ${v.make} ${v.model} ${v.trim} kost ${v.per100km} per 100 km${v.perFull ? `, ${v.perFull} per volle lading` : ""} en ${v.perYear} per jaar bij ${v.kmPerYear} km. Gerekend met ${v.tariffLabel} van ${v.pricePerKwh} per kWh, ${v.lossPct} laadverlies en ${v.realWorldPct} bovenop het WLTP-verbruik van ${v.consumptionWltp}.`,
    metrics: { per100km: "Per 100 km", perFull: "Per volle lading", perYear: (v) => `Per jaar (${v.kmPerYear} km)` },
    kmTable: { heading: "Jaarkost per kilometrage", colKm: "Km per jaar", colYear: "Per jaar", colMonth: "Per maand" },
    factors: {
      heading: "Waar de kost van afhangt",
      items: (v) => [
        `Het WLTP-verbruik van ${v.consumptionWltp} is de fabrieksopgave. In de praktijk ligt het verbruik hoger door temperatuur, snelheid en bandenspanning; daarom rekenen we ${v.realWorldPct} extra.`,
        `Bij thuisladen gaat ${v.lossPct} verloren in de lader en de batterij. Je betaalt dus meer kWh aan de meter dan er in de batterij komt.`,
        `De prijs per kWh is ${v.pricePerKwh}, all-in met netkosten, heffingen en btw. Met een dynamisch contract en slim laden 's nachts kan dat lager uitvallen; met een oud vast contract hoger.`,
        v.batteryNominal
          ? `${v.make} publiceert voor dit model alleen de nominale capaciteit van ${v.batteryNet}. Daarom tonen we geen kost per volle lading; de kost per kilometer hangt daar niet van af.`
          : `De batterij van ${v.batteryNet} bepaalt de kost per volle lading, niet de kost per kilometer.`,
      ],
    },
    otherTariffs: { heading: "Zelfde auto, ander tarief", colTariff: "Tarief", colPer100: "Per 100 km", colYear: "Per jaar" },
    faq: (v) => [
      ...(v.perFull ? [{ q: `Wat kost een volle lading van de ${v.model} thuis?`, a: `${v.perFull} met ${v.tariffLabel} van ${v.pricePerKwh} per kWh, inclusief ${v.lossPct} laadverlies. Dat is voor de volledige batterij van ${v.batteryNet}; van 20 naar 80 % laad je zelden meer dan zestig procent daarvan.`  }] : []),
      { q: `Hoeveel kost 100 km rijden met de ${v.model}?`, a: `${v.per100km} aan stroom bij thuisladen.` },
    ],
    backToCharger: (v) => `Welke laadpaal voor de ${v.make} ${v.model}?`,
  },
  compare: {
    sectionSlug: "vergelijk",
    title: "Vergelijk twee modellen",
    intro: "Kies twee modellen. Je ziet per model het laadvermogen, de aanbevolen aansluiting, de laadtijd en de kost per lading naast elkaar.",
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
      battery: "Batterij (netto)",
      range: "WLTP-rijbereik",
      recommended: "Aanbevolen aansluiting",
      timeRecommended: "20 naar 80 % op aanbevolen aansluiting",
      time74: "20 naar 80 % op 7,4 kW",
      time11: "20 naar 80 % op 11 kW",
      costFullCheapest: "Volle lading, goedkoopste tarief",
      costFullDay: "Volle lading, dagtarief",
      cost100Cheapest: "Per 100 km, goedkoopste tarief",
      capacity11: "Extra capaciteitstarief 11 kW zonder load balancing",
    },
    note: "Zelfde uitgangspunten als op de modelpagina's: 10 % laadverlies, 15 % realiteitsfactor op het WLTP-verbruik, 12.000 km per jaar.",
  },
};
