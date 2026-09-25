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
    cardTime: "20 à 80 %",
  },
  home: {
    h1: "Quelle borne pour votre voiture ?",
    pickLabel: "Choisissez votre modèle",
    pickButton: "Voir le conseil",
    exampleLabel: "Voici à quoi ressemble une réponse",
    exampleLink: (model) => `Conseil complet pour la ${model}`,
    trust: (date) => `Calculé avec les tarifs et règles du ${date}. Chaque page cite ses sources et la date de vérification.`,
    group: (kw) => `Charge à domicile jusqu'à ${kw}`,
    allModels: "Tous les modèles",
    pickPlaceholder: "Tapez la marque ou le modèle, p. ex. ID.4",
    pickHelp: "Commencez à taper et choisissez dans la liste.",
    noMatch: (q) => `Aucun modèle trouvé pour « ${q} ». Choisissez ci-dessous ou tapez une autre marque.`,
    makesHeading: "Marques",
    allMakes: "Toutes les marques",
  },
  makeHub: {
    sectionSlug: "marque",
    breadcrumb: "Marques",
    h1: (make) => `Borne de recharge pour une ${make}`,
    metaTitle: (make, n) => `Borne pour ${make} : ${n} ${n === 1 ? "modèle calculé" : "modèles calculés"} | Laadgids`,
    metaDescription: (make, n, powers) => `Quelle borne pour une ${make} ? ${n} ${n === 1 ? "version" : "versions"} avec temps de charge par raccordement, coût et puissance recommandée (${powers}).`,
    intro: (v) =>
      `${v.count === 1 ? "Une version" : `${v.count} versions`} de ${v.make}, avec une puissance de charge AC jusqu'à ${v.powers}.` +
      (v.singlePhaseCount > 0 ? ` ${v.singlePhaseCount === 1 ? "L'une d'elles charge" : `${v.singlePhaseCount} d'entre elles chargent`} en monophasé ; une borne triphasée n'y apporte aucun gain de temps.` : " Toutes les versions chargent en triphasé.") +
      ` De 20 à 80 %, comptez entre ${v.minTime} et ${v.maxTime} sur le raccordement recommandé.`,
    modelsHeading: (make) => `Modèles ${make}`,
    otherMakes: "Autres marques",
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
      batteryEstimated: "Batterie (estimation)",
      time: (v) => `${v.fromPct} à ${v.toPct} % sur ${v.recommendedKw}`,
    },
    estimateNote: (v) => `La capacité nette de ${v.batteryNet} est une estimation : ${v.make} ne publie pas de chiffre officiel. Les temps de charge et le coût par charge peuvent différer de quelques pour cent.`,
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
    "monophase-vs-triphase": "Monophasé ou triphasé ?",
    "tarif-capacitaire-borne": "Ce que la recharge fait à votre tarif capacitaire",
    "tarif-creg-recharge-domicile": "Tarif CREG pour la recharge à domicile",
    "declaration-gestionnaire-reseau-borne": "Déclarer sa borne au gestionnaire de réseau",
    "tva-6-pourcent-borne": "6 % ou 21 % de TVA sur votre borne ?",
    "borne-appartement": "Borne en appartement : comment s'y prendre",
  },
  cost: {
    sectionSlug: "cout-recharge",
    breadcrumbSection: "Coût de recharge par modèle",
    h1: (v) => `Combien coûte la recharge à domicile d'une ${v.make} ${v.model} ${v.trim} ?`,
    metaTitle: (v) => `Coût de recharge ${v.make} ${v.model} ${v.trim} : ${v.per100km} par 100 km | Laadgids`,
    metaDescription: (v) => `Recharger une ${v.make} ${v.model} ${v.trim} à domicile coûte ${v.per100km} par 100 km et ${v.perFull} par charge complète avec le ${v.tariffLabel} (${v.pricePerKwh} par kWh). Par an et par kilomètre, sources comprises.`,
    shortAnswer: (v) => `${v.per100km} par 100 km, ${v.perFull} par charge complète et ${v.perYear} par an pour ${v.kmPerYear} km. Calculé avec le ${v.tariffLabel} à ${v.pricePerKwh} par kWh, ${v.lossPct} de pertes de charge et ${v.realWorldPct} en plus de la consommation WLTP de ${v.consumptionWltp}.`,
    metrics: { per100km: "Par 100 km", perFull: "Par charge complète", perYear: (v) => `Par an (${v.kmPerYear} km)` },
    kmTable: { heading: "Coût annuel selon le kilométrage", colKm: "Km par an", colYear: "Par an", colMonth: "Par mois" },
    factors: {
      heading: "De quoi dépend le coût",
      items: (v) => [
        `La consommation WLTP de ${v.consumptionWltp} est la valeur d'homologation. En pratique, elle est plus élevée à cause de la température, de la vitesse et de la pression des pneus ; nous ajoutons donc ${v.realWorldPct}.`,
        `À domicile, ${v.lossPct} se perdent dans le chargeur et la batterie. Vous payez donc plus de kWh au compteur qu'il n'en entre dans la batterie.`,
        `Le prix par kWh est de ${v.pricePerKwh}, tout compris avec les frais de réseau, les prélèvements et la TVA. Avec un contrat dynamique et une recharge intelligente la nuit, il peut être plus bas ; avec un ancien contrat fixe, plus haut.`,
        `La batterie de ${v.batteryNet} détermine le coût par charge complète, pas le coût par kilomètre.`,
      ],
    },
    otherTariffs: { heading: "Même voiture, autre tarif", colTariff: "Tarif", colPer100: "Par 100 km", colYear: "Par an" },
    faq: (v) => [
      { q: `Combien coûte une charge complète de la ${v.model} à domicile ?`, a: `${v.perFull} avec le ${v.tariffLabel} à ${v.pricePerKwh} par kWh, pertes de charge de ${v.lossPct} comprises. C'est pour la batterie complète de ${v.batteryNet} ; de 20 à 80 %, vous rechargez rarement plus de soixante pour cent de cela.` },
      { q: `Combien coûtent 100 km avec la ${v.model} ?`, a: `${v.per100km} d'électricité en rechargeant à domicile. Une voiture essence comparable se situe largement au-dessus du double aux prix actuels du carburant.` },
      { q: "Est-ce aussi ce que je paie à une borne publique ?", a: "Non. Les bornes AC publiques facturent généralement 40 à 60 centimes par kWh et les chargeurs rapides 60 à 80 centimes. Cette page concerne la recharge à domicile sur votre propre compteur." },
    ],
    backToCharger: (v) => `Quelle borne pour la ${v.make} ${v.model} ?`,
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
