// Copy fr-BE en français de Belgique : borne, gestionnaire de réseau, avantage de toute nature (DESIGN.md §7).
import type { Copy, FaqItem } from "./types";

export const frBE: Copy = {
  locale: "fr-BE",
  site: {
    name: "Laadgids",
    notFound: { title: "Page introuvable", body: "Cette page n'existe pas ou a été déplacée.", home: "Vers la page d'accueil", models: "Voir tous les modèles" },
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
    makesIntro: "Choisissez votre marque. Le temps de charge est celui de 20 à 80 % sur le raccordement recommandé ; pour chaque version, vous voyez aussi la bonne puissance et le coût de la recharge à domicile.",
    makeTileCount: (n) => `${n} ${n === 1 ? "modèle" : "modèles"}`,
    makeTileTime: (from, to, same) => (same ? `recharge en ${from}` : `recharge en ${from} à ${to}`),
    allModelsLink: (n) => `Voir les ${n} modèles`,
    exceptionsHeading: "Attention à ces modèles",
    exceptionsIntro: "La plupart des voitures électriques se rechargent à domicile en 11 kW triphasé. Pour ces modèles, le conseil est différent.",
    exceptionReason: {
      one_phase: (kw) => `recharge en monophasé jusqu'à ${kw} : une borne triphasée n'apporte aucun gain de temps`,
      above_11: (kw) => `recharge jusqu'à ${kw} : il faut un raccordement triphasé de 32 A`,
      below_11: (kw) => `recharge jusqu'à ${kw} : une borne de 11 kW suffit largement`,
    },
  },
  method: {
    slug: "notre-methode",
    title: "Notre méthode de calcul",
    metaDescription: "Les hypothèses et formules derrière chaque calcul de Laadgids : puissance et temps de charge, consommation, prix de l'électricité, tarif capacitaire et remboursement CREG.",
    intro: "Chaque page de Laadgids est un calcul. Voici les hypothèses et les formules que nous utilisons, avec les valeurs en vigueur aujourd'hui. Quand un tarif ou une règle change, nous recalculons toutes les pages.",
    sections: (v) => [
      {
        heading: "Puissance et temps de charge",
        paragraphs: [
          "À domicile, votre voiture charge à la plus basse de deux puissances : la puissance de charge AC maximale de la voiture et ce que fournit le raccordement. Une voiture qui charge en monophasé atteint au plus 7,4 kW sur une borne triphasée. Une voiture triphasée sur un raccordement monophasé aussi.",
          `Nous calculons le temps de charge de ${v.fromPct} à ${v.toPct} % de la batterie, avec ${v.lossPct} de pertes de charge : le réseau fournit plus d'énergie que ce qui arrive dans la batterie.`,
          "La puissance recommandée est le plus petit raccordement sur lequel la voiture atteint sa puissance AC maximale. Un raccordement plus puissant ne la charge pas plus vite.",
        ],
      },
      {
        heading: "Batterie",
        paragraphs: [
          "Nous utilisons la capacité utile (nette) quand le constructeur la publie. S'il ne publie que la capacité nominale, nous calculons le temps de charge avec celle-ci. C'est une limite haute, et nous n'affichons alors pas de coût par charge complète.",
          "La mention « (estimation) » signifie que le constructeur n'a pas publié cette valeur lui-même. Une note sur la page le signale ; le temps de charge et le coût par charge peuvent alors différer de quelques pour cent.",
        ],
      },
      {
        heading: "Consommation et coût",
        paragraphs: [
          `Nous partons de la consommation WLTP combinée du constructeur et ajoutons ${v.realWorldPct}, car la consommation sur la route dépasse la valeur d'homologation. S'y ajoutent ${v.lossPct} de pertes de charge.`,
          `Le coût correspond aux kWh prélevés sur le réseau multipliés par le prix par kWh. Par an, nous comptons ${v.km} km.`,
          `Comme prix, nous utilisons le tarif CREG de la région comme référence, tous frais par kWh compris : ${v.tariffs.map((t) => `${t.region} ${t.price} par kWh (vérifié le ${t.checked})`).join(", ")}. Votre propre contrat peut être plus cher ou moins cher.`,
        ],
      },
      ...(v.capacity
        ? [
            {
              heading: "Tarif capacitaire en Flandre",
              paragraphs: [
                `En Flandre, une partie des coûts de réseau dépend de votre pic quart-horaire le plus élevé du mois, avec un minimum de ${v.capacity.minKw}. Nous comptons ${v.capacity.incl} par kW et par an${v.capacity.vatPct ? `, TVA de ${v.capacity.vatPct} comprise` : ""}${v.capacity.isAverage ? ", soit la moyenne des gestionnaires de réseau" : ""} (vérifié le ${v.capacity.checked}).`,
                `Nous partons d'un ménage type sans voiture électrique, avec un pic de ${v.capacity.baselineKw}. Sans délestage dynamique, la puissance de charge s'y ajoute. Avec délestage, la borne réduit sa puissance quand la maison consomme beaucoup ; le pic est alors le plus élevé des deux, la maison ou la borne.`,
              ],
            },
          ]
        : []),
      ...(v.creg
        ? [
            {
              heading: "Remboursement pour une voiture de société",
              paragraphs: [
                `Votre employeur peut rembourser la recharge à domicile au tarif CREG, par région et par trimestre. Nous multiplions les kWh par an (calculés comme ci-dessus) par le tarif CREG du ${v.creg.quarter} (vérifié le ${v.creg.checked}).`,
              ],
            },
          ]
        : []),
      {
        heading: "Sources et contrôle",
        paragraphs: [
          "Les caractéristiques proviennent des listes de prix et fiches techniques des constructeurs, avec leur date. Un contrôle hebdomadaire compare nos chiffres à ces documents ; une personne décide de chaque modification. Les règles et tarifs sont saisis à la main, toujours avec source et date.",
          "S'il manque une donnée nécessaire au calcul, nous demandons à Google de ne pas reprendre la page.",
        ],
      },
      {
        heading: "Ce que nous ne calculons pas",
        paragraphs: ["L'effet de la température et du préchauffage, la recharge rapide en route, les frais fixes de votre facture qui ne dépendent pas des kWh, et les panneaux solaires. Les tarifs dynamiques suivront."],
      },
    ],
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
      (v.minTime === v.maxTime ? ` De 20 à 80 %, comptez ${v.minTime} sur le raccordement recommandé.` : ` De 20 à 80 %, comptez entre ${v.minTime} et ${v.maxTime} sur le raccordement recommandé.`),
    modelsHeading: (make) => `Modèles ${make}`,
    otherMakes: "Autres marques",
    costHeading: "Coût de recharge par version",
    costIntro: (tariff, price, loss, km) => `Calculé avec le ${tariff} à ${price} par kWh, ${loss} de pertes de charge et ${km} km par an. Cliquez sur une version pour le calcul et les sources.`,
    allCostsLink: "Coût de recharge de toutes les marques",
    faq: (v) => {
      const out: FaqItem[] = [];
      const g0 = v.groups[0]!;
      out.push({
        q: `Quelle borne pour une ${v.make} ?`,
        a:
          v.groups.length === 1
            ? `Une borne de ${g0.power} (${g0.connection}) suffit pour ${v.count === 1 ? "cette version" : `les ${v.count} versions`}. Plus de puissance n'apporte aucun gain de temps.`
            : `Cela dépend de la version. ${v.groups.map((g) => `${g.power} (${g.connection}) : ${g.names}.`).join(" ")} Plus de puissance que recommandé n'apporte aucun gain de temps.`,
      });
      const sp = v.singlePhase;
      out.push({
        q: `Une ${v.make} charge-t-elle en triphasé ?`,
        a: !sp
          ? v.count === 1 ? "Oui, cette version charge en triphasé." : `Oui, les ${v.count} versions chargent en triphasé.`
          : sp.count === v.count
            ? `Non, ${v.count === 1 ? "cette version charge" : "toutes les versions chargent"} en monophasé, jusqu'à ${sp.power}. Une borne triphasée ne charge pas plus vite, mais elle est prête pour une prochaine voiture.`
            : `Pas toutes. ${sp.names} ${sp.count === 1 ? "charge" : "chargent"} en monophasé, jusqu'à ${sp.power} ; une borne triphasée n'y apporte aucun gain de temps. Les autres versions chargent en triphasé.`,
      });
      if (v.cost) {
        const c = v.cost;
        out.push({
          q: `Combien coûte la recharge à domicile d'une ${v.make} ?`,
          a:
            v.count === 1
              ? `Avec le ${c.tariff} à ${c.price} par kWh, 100 km coûtent ${c.min}, soit ${c.yearMin} par an pour ${c.km} km.`
              : `Avec le ${c.tariff} à ${c.price} par kWh, 100 km coûtent entre ${c.min} (${c.minName}) et ${c.max} (${c.maxName}). Pour ${c.km} km par an, cela fait entre ${c.yearMin} et ${c.yearMax}.`,
        });
      }
      const t = v.time;
      out.push({
        q: `Combien de temps dure la recharge d'une ${v.make} ?`,
        a: v.count === 1 ? `De 20 à 80 %, comptez ${t.min} sur le raccordement recommandé.` : `De 20 à 80 % sur le raccordement recommandé, comptez de ${t.min} (${t.minName}) à ${t.max} (${t.maxName}).`,
      });
      return out;
    },
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
    metaTitleShort: (v) => `Borne pour ${v.make} ${v.model} ${v.trim}`,
    metaDescription: (v) =>
      `La ${v.make} ${v.model} ${v.trim} recharge à domicile à ${v.acMax} maximum. Temps de charge par raccordement et coût par tarif. Mis à jour pour ${v.region ? frBE.site.regionLabel[v.region] : "la Belgique"}.`,
    shortAnswerLabel: "Réponse courte",
    shortAnswer: (v) => {
      const s: string[] = [];
      s.push(`Prenez une borne de ${v.recommendedKw} (${v.recommendedLabel}).`);
      s.push(`La ${v.make} ${v.model} charge à ${v.acMax} maximum ; passer de ${v.fromPct} à ${v.toPct} % prend ${v.recommendedTime}.`);
      if (v.advice.warnings.includes("single_phase_car_no_gain_3f")) {
        s.push("Une borne triphasée ne charge pas cette voiture plus vite, mais elle est prête pour la suivante.");
      } else if (v.advice.warnings.includes("optional_onboard_charger") && v.acOptional) {
        s.push(`Avec le chargeur embarqué de ${v.acOptional} de certaines versions, elle charge plus vite, mais uniquement sur un raccordement triphasé 3N400V de 32 A.`);
      } else if (v.advice.warnings.includes("no_gain_above_recommended")) {
        s.push(`Au-delà de ${v.recommendedKw}, vous ne gagnez rien.`);
      }
      return s.slice(0, 4).join(" ");
    },
    metrics: {
      acMax: "Puissance AC max.",
      battery: "Batterie (nette)",
      batteryEstimated: "Batterie (estimation)",
      batteryNominal: "Batterie (nominale)",
      time: (v) => `${v.fromPct} à ${v.toPct} % sur ${v.recommendedKw}`,
    },
    nominalNote: (v) => `${v.make} ne publie pour ce modèle que la capacité nominale de ${v.batteryNet}. La capacité utilisable est inférieure de quelques pour cent ; les temps de charge sur cette page sont donc un maximum. Le coût par 100 km et par an se calcule avec la consommation et n'en dépend pas.`,
    estimateNote: (v) => `La capacité nette de ${v.batteryNet} est une estimation : ${v.make} ne publie pas de chiffre officiel. Les temps de charge et le coût par charge peuvent différer de quelques pour cent.`,
    table: {
      heading: (v) => `Temps de charge par raccordement (${v.fromPct} à ${v.toPct} %)`,
      colConnection: "Raccordement",
      colPower: "Puissance",
      colTime: "Temps de charge",
      recommended: "recommandé",
      noGain: "aucun gain",
      note: (v) => `Calculé avec ${v.batteryNet} de ${v.batteryNominal ? "capacité nominale" : "batterie nette"} et 10 % de pertes de charge. Les temps réels dépendent de la température et de la courbe de charge.`,
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
        "En Flandre, le tarif capacitaire se base sur votre pic quart-horaire mensuel. Une borne de 11 kW qui charge en même temps que la plaque de cuisson ou la pompe à chaleur augmente ce pic. Le délestage dynamique limite ce pic.",
      no_gain_above_recommended: (v) => `Les raccordements au-delà de ${v.recommendedKw} ne chargent pas cette voiture plus vite.`,
      optional_onboard_charger: (v) =>
        `Certaines versions disposent d'un chargeur embarqué de ${v.acOptional ?? ""}, de série ou en option. Vérifiez sur votre bon de commande quel chargeur équipe votre voiture. ${v.acOptional ?? ""} n'est possible que sur un raccordement triphasé 3N400V de 32 A, pas sur du 3×230 V.`,
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
      intro: (v) => `Hypothèse : un ménage type sans voiture électrique, avec un pic de ${v.capacityBaselineKw ?? ""}. Le tarif compte par kW au-delà de ${v.capacityMinKw ?? ""}.`,
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
      jump: "Demander un devis pour une borne",
      heading: "Devis pour une borne à domicile",
      intro: (v) => `Demandez un devis pour une installation de ${v.recommendedKw}. Nous transmettons votre demande à trois installateurs de votre région au maximum, au plus tard dans les quatre semaines.`,
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
      consent: "J'accepte que mes données soient transmises à trois installateurs au maximum, même si cela se fait plus tard (au plus tard dans les quatre semaines).",
      submit: "Envoyer la demande",
      footnote: "Gratuit et sans engagement",
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
      reimburse: (v) => `Avec la ${v.make} ${v.model}, vous chargez environ ${v.kwh} kWh pour ${v.km} km par an. Remboursé au tarif CREG en ${v.region} au ${v.quarter} (${v.rate} par kWh), cela représente ${v.perYear} par an.`,
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
              : v.acOptional
                ? `Seulement avec le chargeur embarqué de ${v.acOptional} de certaines versions. Avec le chargeur de série, la voiture charge en AC à ${v.acMax}, même sur une borne de 22 kW.`
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
          a: `De ${v.fromPct} à ${v.toPct} %, comptez ${v.recommendedTime} sur ${v.recommendedKw}.` + (v.batteryNominal || !v.cheapestFull ? "" : ` Une batterie complète de ${v.batteryNet}, pertes comprises, coûte environ ${v.cheapestFull} avec le ${v.cheapestLabel}.`),
        });
        items.push({
          q: `Combien de kilomètres récupère-t-on par heure de charge avec la ${v.make} ${v.model} ?`,
          a: `Environ ${v.kmPerHour} km d'autonomie par heure sur ${v.recommendedKw}, calculé avec la consommation WLTP majorée de 15 % et 10 % de pertes de charge.`,
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
    sources: { heading: "Sources", checked: "vérifié le", specNotes: "Remarque sur les caractéristiques", specTitle: (make, model) => `${make} ${model} : caractéristiques`, cregTitle: "CREG : tarif de remboursement de la recharge à domicile des voitures de société", capacityTitle: "VREG / Fluvius : tarif capacitaire", tariffTitle: "CREG : tarif de recharge à domicile par région" },
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
    metaTitleShort: (v) => `Coût de recharge ${v.make} ${v.model} ${v.trim}`,
    index: {
      intro: (tariff, price, loss, km) => `Le coût de la recharge à domicile par 100 km et par an, pour chaque version présente sur le site. Calculé avec le ${tariff} à ${price} par kWh, ${loss} de pertes de charge et ${km} km par an. Cliquez sur un modèle pour le calcul et les sources.`,
      colModel: "Version",
      colPer100: "Par 100 km",
      colYear: (km) => `Par an (${km} km)`,
      makeLink: (make) => `Borne de recharge pour une ${make}`,
    },
    metaDescription: (v) => `Recharger une ${v.make} ${v.model} ${v.trim} à domicile coûte ${v.per100km} par 100 km${v.perFull ? ` et ${v.perFull} par charge complète` : ""} avec le ${v.tariffLabel} (${v.pricePerKwh} par kWh).`,
    shortAnswer: (v) => `Recharger une ${v.make} ${v.model} ${v.trim} à domicile coûte ${v.per100km} par 100 km${v.perFull ? `, ${v.perFull} par charge complète` : ""} et ${v.perYear} par an pour ${v.kmPerYear} km. Calculé avec le ${v.tariffLabel} à ${v.pricePerKwh} par kWh, ${v.lossPct} de pertes de charge et ${v.realWorldPct} en plus de la consommation WLTP de ${v.consumptionWltp}.`,
    metrics: { per100km: "Par 100 km", perFull: "Par charge complète", perYear: (v) => `Par an (${v.kmPerYear} km)` },
    kmTable: { heading: "Coût annuel selon le kilométrage", colKm: "Km par an", colYear: "Par an", colMonth: "Par mois" },
    factors: {
      heading: "De quoi dépend le coût",
      items: (v) => [
        `La consommation WLTP de ${v.consumptionWltp} est la valeur d'homologation. En pratique, elle est plus élevée à cause de la température, de la vitesse et de la pression des pneus ; nous ajoutons donc ${v.realWorldPct}.`,
        `À domicile, ${v.lossPct} se perdent dans le chargeur et la batterie. Vous payez donc plus de kWh au compteur qu'il n'en entre dans la batterie.`,
        `Le prix par kWh est de ${v.pricePerKwh}, tout compris avec les frais de réseau, les prélèvements et la TVA. Avec un contrat dynamique et une recharge intelligente la nuit, il peut être plus bas ; avec un ancien contrat fixe, plus haut.`,
        v.batteryNominal
          ? `${v.make} ne publie pour ce modèle que la capacité nominale de ${v.batteryNet}. Nous n'affichons donc pas de coût par charge complète ; le coût par kilomètre n'en dépend pas.`
          : `La batterie de ${v.batteryNet} détermine le coût par charge complète, pas le coût par kilomètre.`,
      ],
    },
    otherTariffs: { heading: "Même voiture, autre tarif", colTariff: "Tarif", colPer100: "Par 100 km", colYear: "Par an" },
    faq: (v) => [
      ...(v.perFull ? [{ q: `Combien coûte une charge complète de la ${v.model} à domicile ?`, a: `${v.perFull} avec le ${v.tariffLabel} à ${v.pricePerKwh} par kWh, pertes de charge de ${v.lossPct} comprises. C'est pour la batterie complète de ${v.batteryNet} ; de 20 à 80 %, vous rechargez rarement plus de soixante pour cent de cela.` }] : []),
      { q: `Combien coûtent 100 km avec la ${v.model} ?`, a: `${v.per100km} d'électricité en rechargeant à domicile.` },
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
