// Leadmails via Resend. Zonder RESEND_API_KEY wordt alleen gelogd.
import type { InstallerRow, LeadInsert } from "@/lib/db/types";

interface Mail {
  to: string;
  subject: string;
  text: string;
}

async function send(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL ?? "leads@laadgids.be";
  if (!key) {
    console.info("[lead-mail:dry-run]", mail.to, mail.subject);
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const res = await resend.emails.send({ from, to: mail.to, subject: mail.subject, text: mail.text });
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

export async function confirmLead(lead: LeadInsert, installers: InstallerRow[]): Promise<void> {
  const fr = lead.locale === "fr-BE";
  const queued = installers.length === 0;
  const text = fr
    ? queued
      ? "Votre demande est bien reçue. Nous cherchons un installateur agréé dans votre région et lui transmettons votre demande dès que possible, au plus tard dans les quatre semaines. Vous ne devez rien faire."
      : `Votre demande est bien reçue. ${installers.length} installateur(s) vous contactent sous deux jours ouvrables.`
    : queued
      ? "Je aanvraag is ontvangen. We zoeken een erkende installateur in je regio en sturen je aanvraag door zodra die er is, uiterlijk binnen vier weken. Je hoeft niets te doen."
      : `Je aanvraag is ontvangen. ${installers.length} installateur(s) nemen binnen twee werkdagen contact op.`;
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
