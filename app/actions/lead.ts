"use server";

// Leadflow (CLAUDE.md §7): Zod → insert leads → match installateurs → Resend → status. Rate-limit op IP, honeypot.
import { headers } from "next/headers";
import { getRepo } from "@/lib/db";
import type { LeadInsert } from "@/lib/db/types";
import { matchInstallers } from "@/lib/lead/match";
import { confirmLead, notifyInstallers, notifyOwner } from "@/lib/lead/mail";
import { rateLimited } from "@/lib/lead/ratelimit";
import { leadSchema, postalValid } from "@/lib/lead/schema";

export type LeadError = "postal" | "email" | "consent" | "generic" | "rate";

export interface LeadState {
  ok: boolean;
  error?: LeadError;
  fieldErrors?: Partial<Record<"postal_code" | "email" | "consent", LeadError>>;
}

function bool(v: FormDataEntryValue | null): boolean | null {
  if (v === null || v === "") return null;
  return v === "on" || v === "true" || v === "1";
}

function str(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  if (rateLimited(`lead:${ip}`)) return { ok: false, error: "rate" };

  // Honeypot: bots vullen dit in. Stil accepteren, niets opslaan.
  if (str(form.get("website"))) return { ok: true };

  const parsed = leadSchema.safeParse({
    locale: form.get("locale"),
    page_path: str(form.get("page_path")),
    postal_code: str(form.get("postal_code")) ?? "",
    connection_type: str(form.get("connection_type")),
    ampere: str(form.get("ampere")),
    desired_power_w: str(form.get("desired_power_w")),
    home_older_than_10y: bool(form.get("home_older_than_10y")),
    company_car: bool(form.get("company_car")),
    email: str(form.get("email")) ?? "",
    phone: str(form.get("phone")),
    consent: form.get("consent") === "on",
    website: "",
  });

  if (!parsed.success) {
    const fieldErrors: LeadState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (k === "postal_code") fieldErrors.postal_code = "postal";
      if (k === "email") fieldErrors.email = "email";
      if (k === "consent") fieldErrors.consent = "consent";
    }
    return { ok: false, error: "generic", fieldErrors };
  }
  const d = parsed.data;
  if (!postalValid(d.locale, d.postal_code)) return { ok: false, error: "generic", fieldErrors: { postal_code: "postal" } };

  const lead: LeadInsert = {
    locale: d.locale,
    page_path: d.page_path,
    postal_code: d.postal_code.toUpperCase().replace(/\s+/g, ""),
    connection_type: d.connection_type,
    ampere: d.ampere,
    desired_power_w: d.desired_power_w,
    home_older_than_10y: d.home_older_than_10y,
    company_car: d.company_car,
    email: d.email,
    phone: d.phone,
    consent_at: new Date().toISOString(),
  };

  try {
    const repo = await getRepo();
    const id = await repo.insertLead(lead);
    const installers = matchInstallers(await repo.listActiveInstallers(), lead.postal_code);
    if (installers.length > 0) {
      await notifyInstallers(lead, id, installers);
      await repo.markLeadForwarded(
        id,
        installers.map((i) => i.id),
      );
    }
    await confirmLead(lead, installers);
    await notifyOwner(lead, id, installers);
    return { ok: true };
  } catch (e) {
    console.error("[lead] failed", e);
    return { ok: false, error: "generic" };
  }
}
