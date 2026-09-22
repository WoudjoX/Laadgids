// Copy fr-BE en français de Belgique : borne, gestionnaire de réseau, avantage de toute nature (DESIGN.md §7).
import type { Copy, FaqItem } from "./types";

export const frBE: Copy = {
  locale: "fr-BE",
  site: {
    name: "Laadgids",
    tagline: "Le bon conseil de recharge pour votre voiture, votre compteur et votre région, chiffres à l'appui.",
    langSwitch: [
      { locale: "nl-BE", label: "nl" },
      { locale: "fr-BE", label: "fr" },
    ],
    home: "Accueil",
    footerAbout: "À propos de Laadgids",
    footerContact: "Contact",
    footerPrivacy: "Vie privée",
    updated: "Mis à jour",
    regionLabel: { VLA: "Flandre", WAL: "Wallonie", BRU: "Bruxelles" },
    regionNone: "Belgique",
    homeIntro: "Choisissez votre modèle. Par version : la puissance AC maximale, le raccordement recommandé et le coût d'une nuit de charge.",
    cardRecommended: "recommandé",
    cardAc: "AC max.",
    cardBattery: "batterie",
  },
  connections: {
    socket_2300: "Prise domestique (monophasé 10 A)",
    "1f_16a_3700": "Monophasé 16 A",
    "1f_32a_7400": "Monophasé 32 A",
    "3f_16a_11000": "Triphasé 16 A",
    "3f_32a_22000": "Triphasé 32 A",
  },
  charger: {
    sectionSlug: "borne-pour",
    breadcrumbSection: "Borne par modèle",
    h1: (v) => `Quelle borne pour une ${v.make} ${v.model} ${v.trim} ?`,
    metaTitle: (v) => `Borne pour ${v.make} ${v.model} ${v.trim} : ${v.recommendedKw} ou pas ? | Laadgids`,
    metaDescription: (v) =>
      `La ${v.make} ${v.model} ${v.trim} recharge à domicile à ${v.acMax} maximum. Temps de charge par raccordement et coût par tarif. Mis à jour pour ${v.region ? frBE.site.regionLabel[v.region] : "la Belgique"}.`,
    shortAnswerLabel: "Réponse courte",
    shortAnswer: (v) => {
      const s: string[] = [];
      s.push(`Prenez une borne de ${v.recommendedKw} (${v.recommendedLabel}).`);
      s.push(`La ${v.model} charge à ${v.acMax} maximum ; passer de ${v.fromPct} à ${v.toPct} % prend ${v.recommendedTime}.`);
      if (v.advice.warnings.includes("single_phase_car_no_gain_3f")) {
        s.push("Une borne triphasée ne charge pas cette voiture plus vite, mais elle est prête pour la suivante.");
      } else if (v.advice.warnings.includes("no_gain_above_recommended")) {
        s.push(`Au-delà de ${v.recommendedKw}, vous ne gagnez rien.`);
      }
      return s.slice(0, 4).join(" ");
    },
    metrics: {
      acMax: "Puissance AC max.",
      battery: "Batterie (nette)",
      time: (v) => `${v.fromPct} à ${v.toPct} % sur ${v.recommendedKw}`,
    },
    table: {
      heading: (v) => `Temps de charge par raccordement (${v.fromPct} à ${v.toPct} %)`,
      colConnection: "Raccordement",
      colPower: "Puissance",
      colTime: "Temps de charge",
      recommended: "recommandé",
      noGain: "aucun gain",
      note: (v) => `Calculé avec ${v.batteryNet} de batterie nette et 10 % de pertes de charge. Les temps réels dépendent de la température et de la courbe de charge.`,
    },
    diagram: {
      title: "Comment passe le courant",
      meter: "compteur",
      charger: "borne",
      car: "voiture",
      single: "monophasé 32 A",
      three: "triphasé 16 A",
      caption: (v) =>
        v.acPhases === 1
          ? `La ${v.model} n'utilise qu'une phase. Sur un raccordement triphasé, deux phases restent inutilisées : même ${v.acMax}.`
          : `La ${v.model} répartit la charge sur trois phases. Sur une phase, il reste 7,4 kW ; sur trois phases ${v.acMax}.`,
    },
    reasons: {
      recommended_matches_car_max: (v) => `${v.recommendedLabel} exploite toute la puissance AC de la voiture (${v.acMax}).`,
      small_battery_74_enough: (v) => `Avec ${v.batteryNet}, 7,4 kW suffit pour une nuit complète.`,
      full_overnight_on_recommended: (v) => `${v.fromPct} à ${v.toPct} % tient largement dans une nuit (${v.recommendedTime}).`,
    },
    warnings: {
      single_phase_car_no_gain_3f: () =>
        "Cette voiture charge en monophasé. Une borne triphasée n'apporte aucun gain de temps, mais elle est prête si vous passez plus tard à une voiture 11 kW.",
      peak_capacity_tariff: () =>
        "En Flandre, le tarif capacitaire se base sur votre pic quart-horaire mensuel. Une borne de 11 kW qui charge en même temps que la plaque de cuisson ou la pompe à chaleur augmente ce pic. Le délestage dynamique règle cela.",
      no_gain_above_recommended: (v) => `Les raccordements au-delà de ${v.recommendedKw} ne chargent pas cette voiture plus vite.`,
    },
    cost: {
      heading: (v) => `Combien coûte la recharge à domicile de la ${v.model} ?`,
      perFull: "par charge complète",
      perKm: "par 100 km",
      perYear: (v) => `Pour ${v.kmPerYear} km par an, avec 15 % de facteur réel sur la consommation WLTP et 10 % de pertes de charge.`,
      saving: (v) =>
        v.savingYear && v.cheapestLabel
          ? `${v.cheapestFull} par charge complète avec ${v.cheapestLabel}. C'est ${v.savingYear} par an de moins que le tarif fixe.`
          : "",
      cta: "Comparer les tarifs dynamiques",
      unavailable: "Aucun tarif vérifié pour cette région pour l'instant. Nous préférons ne rien afficher qu'un chiffre inventé.",
    },
    peak: {
      heading: "Impact sur le tarif capacitaire (Flandre)",
      intro: () => "Hypothèse : un pic domestique de 3,5 kW sans borne. Le tarif compte par kW au-delà de 2,5 kW.",
      without: "sans délestage",
      with: "avec délestage",
      perYear: "par an en plus",
      scenario: (kw) => `Borne de ${kw}`,
      tariffLine: (v) =>
        v.capacityTariffExcl && v.capacityTariffIncl
          ? `VREG : ${v.capacityIsAverage ? "en moyenne " : ""}${v.capacityTariffExcl} par kW et par an hors TVA, soit environ ${v.capacityTariffIncl} TVA ${v.capacityVatPct} comprise (notre conversion). Le tarif exact varie selon le gestionnaire de réseau.`
          : "",
      verify: "Vérifiez le tarif de votre gestionnaire de réseau ; il change chaque année.",
      chartBaseline: "ménage",
      chartCharger: "borne",
      chartMin: "minimum 2,5 kW",
      chartRows: { without: "sans borne", with: "borne en plus", withLb: "avec délestage" },
    },
    lead: {
      heading: "Devis pour une borne à domicile",
      intro: (v) => `Deux à trois installateurs agréés de votre région vous envoient un devis pour une installation de ${v.recommendedKw}.`,
      postal: "Code postal",
      postalPlaceholder: "5000",
      step1Button: "Demander des devis",
      connection: "Raccordement actuel",
      connectionOptions: [
        { value: "unknown", label: "Je ne sais pas" },
        { value: "1F", label: "Monophasé" },
        { value: "3F", label: "Triphasé" },
      ],
      ampere: "Ampérage (si connu)",
      power: "Puissance souhaitée",
      powerOptions: [
        { value: 7400, label: "7,4 kW" },
        { value: 11000, label: "11 kW" },
        { value: 22000, label: "22 kW" },
      ],
      homeOld: "Habitation de plus de 10 ans (TVA 6 %)",
      companyCar: "C'est une voiture de société",
      email: "E-mail",
      phone: "Téléphone (facultatif)",
      consent: "J'accepte que mes données soient transmises à trois installateurs agréés au maximum, même si cela se fait plus tard (au plus tard dans les quatre semaines).",
      submit: "Envoyer la demande",
      footnote: "Gratuit, sans engagement, installateurs agréés",
      success: "Votre demande est bien reçue. Vous recevez tout de suite une confirmation par e-mail qui précise quand un installateur vous contacte.",
      errors: {
        postal: "Indiquez un code postal belge à quatre chiffres.",
        email: "Indiquez une adresse e-mail valide.",
        consent: "Sans votre accord, nous ne pouvons pas transmettre la demande.",
        generic: "Une erreur s'est produite. Réessayez.",
        rate: "Trop de demandes depuis cette adresse. Réessayez plus tard.",
      },
    },
    companyCar: {
      heading: "Voiture de société ?",
      text: "Votre employeur rembourse la recharge à domicile au tarif CREG trimestriel. Il vous faut une borne avec compteur MID qui enregistre la consommation séparément.",
      link: "Lire les règles du tarif CREG",
    },
    faq: {
      heading: "Questions fréquentes",
      items: (v): FaqItem[] => {
        const items: FaqItem[] = [];
        items.push({
          q: `La ${v.model} charge-t-elle plus vite sur une borne de 22 kW ?`,
          a:
            v.advice.recommended_connection === "3f_32a_22000"
              ? `Oui. Cette version charge en AC à ${v.acMax}, un raccordement triphasé 32 A l'exploite entièrement.`
              : `Non. Le chargeur embarqué limite la charge AC à ${v.acMax}. Sur 22 kW, la voiture charge aussi vite que sur ${v.recommendedKw}.`,
        });
        if (v.acPhases === 1) {
          items.push({
            q: `Une borne triphasée a-t-elle un intérêt pour la ${v.model} ?`,
            a: `Pas pour le temps de charge : la voiture charge en monophasé à ${v.acMax} maximum. Oui si vous préparez l'installation pour une prochaine voiture à 11 kW.`,
          });
        }
        items.push({
          q: `Combien de temps dure une nuit de charge pour la ${v.model} ?`,
          a: `De ${v.fromPct} à ${v.toPct} %, comptez ${v.recommendedTime} sur ${v.recommendedKw}. Une batterie complète de ${v.batteryNet}, pertes comprises, coûte environ ${v.cheapestFull ?? "—"} au tarif le plus bas.`,
        });
        items.push({
          q: "Dois-je déclarer ma borne au gestionnaire de réseau ?",
          a: "Oui. En Wallonie auprès d'ORES ou de RESA, à Bruxelles auprès de Sibelga, en Flandre auprès de Fluvius. Votre installateur s'en charge généralement.",
        });
        return items.slice(0, 5);
      },
    },
    related: {
      heading: "Pour aller plus loin",
      sisters: "Autres modèles du segment",
      cost: "Coût de recharge par tarif",
      rules: "Règles dans votre région",
    },
    sources: { heading: "Sources", checked: "vérifié le", specNotes: "Remarque sur les caractéristiques" },
  },
  rulesPages: {
    "tva-6": "TVA 6 % sur une borne",
    "declaration-gestionnaire-reseau": "Déclarer sa borne au gestionnaire de réseau",
    "appartement-copropriete": "Borne en copropriété",
    "tarif-capacitaire": "Tarif capacitaire et recharge à domicile",
    "tarif-creg": "Tarif CREG pour le remboursement de la recharge",
    "mono-vs-triphase": "Monophasé ou triphasé",
  },
  compare: {
    sectionSlug: "comparer",
    title: "Comparer deux modèles",
    intro: "Choisissez deux modèles. Vous voyez côte à côte la puissance de charge, le raccordement recommandé, le temps de charge et le coût par charge.",
    metaDescription: "Comparez la recharge à domicile de deux voitures électriques : puissance, raccordement, temps de charge et coût.",
    pickA: "Modèle A",
    pickB: "Modèle B",
    submit: "Comparer",
    same: "Choisissez deux modèles différents.",
    linkFromModel: "Comparer avec un autre modèle",
    linkFromIndex: "Comparer deux modèles",
    colModel: "Modèle",
    rows: {
      acMax: "Puissance AC max.",
      battery: "Batterie (nette)",
      range: "Autonomie WLTP",
      recommended: "Raccordement recommandé",
      timeRecommended: "20 à 80 % sur le raccordement recommandé",
      time74: "20 à 80 % sur 7,4 kW",
      time11: "20 à 80 % sur 11 kW",
      costFullCheapest: "Charge complète, tarif le plus bas",
      costFullDay: "Charge complète, tarif de jour",
      cost100Cheapest: "Par 100 km, tarif le plus bas",
      capacity11: "Tarif capacitaire en plus, 11 kW sans délestage",
    },
    note: "Mêmes hypothèses que sur les pages modèles : 10 % de pertes de charge, 15 % de facteur réel sur la consommation WLTP, 12 000 km par an.",
  },
};
