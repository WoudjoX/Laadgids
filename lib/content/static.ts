// Statische pagina's: over, contact, privacy. Korte, feitelijke tekst. Privacytekst is een concept tot Erwin het nakijkt.
import type { Locale } from "@/lib/db/types";

export type StaticKey = "about" | "contact" | "privacy";

export interface StaticPage {
  slug: string;
  title: string;
  paragraphs: string[];
  noindex?: boolean;
}

export const STATIC_PAGES: Record<Locale, Record<StaticKey, StaticPage>> = {
  "nl-BE": {
    about: {
      slug: "over",
      title: "Over Laadgids",
      paragraphs: [
        "Laadgids geeft per automodel een berekend laadadvies voor thuis: welke aansluiting, hoelang een nacht laden duurt, wat het kost per tarief en wat een lader doet met het capaciteitstarief.",
        "Elke pagina is een berekening op cijfers met een bron en een datum. Staat een cijfer er niet, dan is het niet geverifieerd. We tonen liever niets dan een verzonnen getal.",
        "Laadgids is een uitgave van SaasSolutions BV, gemaakt door Erwin Martens. We verdienen aan offerteaanvragen die we doorsturen naar erkende installateurs en aan verwijzingen naar energieleveranciers. Dat beïnvloedt de berekeningen niet.",
      ],
    },
    contact: {
      slug: "contact",
      title: "Contact",
      paragraphs: [
        "Vragen over een berekening, een fout gevonden of een installateur die wil meewerken: mail naar erwin.martens@saassolutions.be.",
        "Fouten in specs of tarieven verbeteren we na controle bij de bron, meestal binnen een week.",
      ],
    },
    privacy: {
      slug: "privacy",
      title: "Privacy",
      noindex: true,
      paragraphs: [
        "Laadgids gebruikt geen cookies en geen trackers van derden. Bezoekstatistieken worden geanonimiseerd verzameld zonder persoonsgegevens.",
        "Vraag je een offerte aan, dan bewaren we je postcode, aansluitingsgegevens, e-mailadres en eventueel telefoonnummer, samen met het tijdstip van je toestemming. Die gegevens sturen we naar maximaal drie installateurs in je regio, zodat zij je een offerte kunnen bezorgen. We verkopen ze niet door.",
        "E-mails versturen we via een verwerker in de EU. Je kunt je gegevens laten inkijken, verbeteren of verwijderen via erwin.martens@saassolutions.be.",
        "Verantwoordelijke voor de verwerking: SaasSolutions BV.",
      ],
    },
  },
  "fr-BE": {
    about: {
      slug: "a-propos",
      title: "À propos de Laadgids",
      paragraphs: [
        "Laadgids donne, par modèle de voiture, un conseil de recharge calculé pour la maison : quel raccordement, combien de temps dure une nuit de charge, ce que cela coûte par tarif et l'effet d'une borne sur le tarif capacitaire.",
        "Chaque page est un calcul sur des chiffres avec une source et une date. Si un chiffre n'y est pas, c'est qu'il n'est pas vérifié. Nous préférons ne rien afficher qu'un chiffre inventé.",
        "Laadgids est édité par SaasSolutions BV et réalisé par Erwin Martens. Nous sommes rémunérés par les demandes de devis transmises à des installateurs agréés et par des renvois vers des fournisseurs d'énergie. Cela n'influence pas les calculs.",
      ],
    },
    contact: {
      slug: "contact",
      title: "Contact",
      paragraphs: [
        "Une question sur un calcul, une erreur repérée ou un installateur qui veut collaborer : écrivez à erwin.martens@saassolutions.be.",
        "Les erreurs dans les fiches techniques ou les tarifs sont corrigées après vérification à la source, en général sous une semaine.",
      ],
    },
    privacy: {
      slug: "vie-privee",
      title: "Vie privée",
      noindex: true,
      paragraphs: [
        "Laadgids n'utilise ni cookies ni traceurs tiers. Les statistiques de visite sont collectées de façon anonyme, sans données personnelles.",
        "Si vous demandez un devis, nous conservons votre code postal, les données de votre raccordement, votre e-mail et éventuellement votre téléphone, ainsi que l'heure de votre consentement. Nous les transmettons à trois installateurs au maximum dans votre région pour qu'ils vous remettent un devis. Nous ne les revendons pas.",
        "Les e-mails sont envoyés via un sous-traitant établi dans l'UE. Vous pouvez consulter, corriger ou supprimer vos données via erwin.martens@saassolutions.be.",
        "Responsable du traitement : SaasSolutions BV.",
      ],
    },
  },
  "nl-NL": {
    about: {
      slug: "over",
      title: "Over Laadgids",
      paragraphs: [
        "Laadgids geeft per automodel een berekend laadadvies voor thuis: welke aansluiting, hoelang een nacht laden duurt en wat het kost per tarief.",
        "Elke pagina is een berekening op cijfers met een bron en een datum. Staat een cijfer er niet, dan is het niet geverifieerd.",
        "Laadgids is een uitgave van SaasSolutions BV, gemaakt door Erwin Martens. We verdienen aan offerteaanvragen die we doorsturen naar erkende installateurs en aan verwijzingen naar energieleveranciers. Dat beïnvloedt de berekeningen niet.",
      ],
    },
    contact: {
      slug: "contact",
      title: "Contact",
      paragraphs: ["Vragen, fouten of installateurs die willen meewerken: mail naar erwin.martens@saassolutions.be."],
    },
    privacy: {
      slug: "privacy",
      title: "Privacy",
      noindex: true,
      paragraphs: [
        "Laadgids gebruikt geen cookies en geen trackers van derden. Bezoekstatistieken worden geanonimiseerd verzameld.",
        "Vraag je een offerte aan, dan bewaren we je postcode, aansluitingsgegevens, e-mailadres en eventueel telefoonnummer, met het tijdstip van je toestemming. Die sturen we naar maximaal drie installateurs in je regio. We verkopen ze niet door.",
        "Je kunt je gegevens laten inzien, corrigeren of verwijderen via erwin.martens@saassolutions.be. Verantwoordelijke: SaasSolutions BV.",
      ],
    },
  },
};

export function staticPageBySlug(locale: Locale, slug: string): StaticPage | null {
  return Object.values(STATIC_PAGES[locale]).find((p) => p.slug === slug) ?? null;
}
