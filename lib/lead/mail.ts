// Leadmails via Resend. Zonder RESEND_API_KEY wordt alleen gelogd.
import type { InstallerRow, LeadInsert } from "@/lib/db/types";

interface Mail {
  to: string;
  subject: string;
  text: string;
}

async function send(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const fromAddress = process.env.LEAD_FROM_EMAIL?.trim() || "leads@laadgids.be";
  const from = fromAddress.includes("<") ? fromAddress : `Laadgids <${fromAddress}>`;
  // Het afzenderadres hoeft geen mailbox te zijn. Antwoorden gaan naar het adres van de eigenaar,
  // zodat een reactie van een aanvrager nooit verloren gaat.
  const replyTo = process.env.LEAD_NOTIFY_EMAIL?.trim() || undefined;
  if (!key) {
    console.info("[lead-mail:dry-run]", mail.to, mail.subject, replyTo ? `(reply-to ${replyTo})` : "");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const res = await resend.emails.send({ from, to: mail.to, subject: mail.subject, text: mail.text, replyTo });
  if (res.error) throw new Error(res.error.message);
}

export function leadBody(lead: LeadInsert, leadId: number): string {
  return [
    `Nieuwe lead #${leadId} via Laadgids`,
    `Postcode: ${lead.postal_code}`,
    `Aansluiting: ${lead.connection_type ?? "onbekend"}${lead.ampere ? ` (${lead.ampere} A)` : ""}`,
    `Gewenst vermogen: ${lead.desired_power_w ? lead.desired_power_w / 1000 + " kW" : "onbekend"}`,
    `Woning ouder dan 10 jaar: ${lead.home_older_than_10y === null ? "onbekend" : lead.home_older_than_10y ? "ja" : "nee"}`,
    `Bedrijfswagen: ${lead.company_car === null ? "onbekend" : lead.company_car ? "ja" : "nee"}`,
    `E-mail: ${lead.email}`,
    `Telefoon: ${lead.phone ?? "-"}`,
    `Pagina: ${lead.page_path ?? "-"}`,
  ].join("\n");
}

export async function notifyInstallers(lead: LeadInsert, leadId: number, installers: InstallerRow[]): Promise<void> {
  const body = leadBody(lead, leadId);
  await Promise.all(installers.map((i) => send({ to: i.contact_email, subject: `Lead #${leadId}: laadpaal ${lead.postal_code}`, text: body })));
}

/** Samenvatting van wat de aanvrager invulde, in zijn taal. */
function requestSummary(lead: LeadInsert, fr: boolean): string {
  const conn = lead.connection_type === "1F" ? (fr ? "monophasé" : "1-fasig") : lead.connection_type === "3F" ? (fr ? "triphasé" : "3-fasig") : fr ? "inconnu" : "onbekend";
  const amp = lead.ampere ? ` ${lead.ampere} A` : "";
  const power = lead.desired_power_w ? `${(lead.desired_power_w / 1000).toString().replace(".", ",")} kW` : fr ? "à déterminer" : "nog te bepalen";
  const yesNo = (v: boolean | null) => (v === null ? (fr ? "non précisé" : "niet opgegeven") : v ? (fr ? "oui" : "ja") : fr ? "non" : "nee");
  return fr
    ? [`Code postal : ${lead.postal_code}`, `Raccordement actuel : ${conn}${amp}`, `Puissance souhaitée : ${power}`, `Habitation de plus de 10 ans : ${yesNo(lead.home_older_than_10y)}`, `Voiture de société : ${yesNo(lead.company_car)}`, `Téléphone : ${lead.phone ?? "-"}`].join("\n")
    : [`Postcode: ${lead.postal_code}`, `Huidige aansluiting: ${conn}${amp}`, `Gewenst vermogen: ${power}`, `Woning ouder dan 10 jaar: ${yesNo(lead.home_older_than_10y)}`, `Bedrijfswagen: ${yesNo(lead.company_car)}`, `Telefoon: ${lead.phone ?? "-"}`].join("\n");
}

export async function confirmLead(lead: LeadInsert, installers: InstallerRow[]): Promise<void> {
  const fr = lead.locale === "fr-BE";
  const queued = installers.length === 0;
  const status = fr
    ? queued
      ? "Nous cherchons un installateur agréé dans votre région et lui transmettons votre demande dès que possible, au plus tard dans les quatre semaines. Vous ne devez rien faire."
      : `${installers.length} installateur(s) agréé(s) de votre région ont reçu votre demande et vous contactent sous deux jours ouvrables.`
    : queued
      ? "We zoeken een erkende installateur in je regio en sturen je aanvraag door zodra die er is, uiterlijk binnen vier weken. Je hoeft niets te doen."
      : `${installers.length} erkende installateur(s) uit je regio hebben je aanvraag ontvangen en nemen binnen twee werkdagen contact op.`;
  const text = fr
    ? [
        "Bonjour,",
        "",
        "Votre demande de devis pour une borne de recharge à domicile est bien reçue. Voici ce que vous avez indiqué :",
        "",
        requestSummary(lead, true),
        "",
        status,
        "",
        "Une correction ou une question ? Répondez simplement à cet e-mail.",
        "",
        "Laadgids",
        "laadgids.be",
      ].join("\n")
    : [
        "Dag,",
        "",
        "Je offerteaanvraag voor een laadpaal thuis is ontvangen. Dit is wat je invulde:",
        "",
        requestSummary(lead, false),
        "",
        status,
        "",
        "Klopt er iets niet of heb je een vraag? Antwoord gewoon op deze e-mail.",
        "",
        "Laadgids",
        "laadgids.be",
      ].join("\n");
  await send({ to: lead.email, subject: fr ? "Votre demande de devis borne" : "Je offerteaanvraag laadpaal", text });
}

/** Melding naar de eigenaar (LEAD_NOTIFY_EMAIL) bij elke lead, met de status. Zonder env: alleen loggen. */
export async function notifyOwner(lead: LeadInsert, leadId: number, installers: InstallerRow[]): Promise<void> {
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const status = installers.length ? `doorgestuurd naar ${installers.map((i) => i.name).join(", ")}` : "WACHTRIJ: geen installateur voor deze regio";
  const text = [`Lead #${leadId} (${lead.locale}) — ${status}`, "", leadBody(lead, leadId)].join("\n");
  if (!to) {
    console.info("[lead-owner:dry-run]", text.replace(/\n/g, " | "));
    return;
  }
  await send({ to, subject: `Lead #${leadId}: ${lead.postal_code} ${installers.length ? "" : "(wachtrij)"}`.trim(), text });
}
