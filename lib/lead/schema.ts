import { z } from "zod";
import type { Locale } from "@/lib/db/types";

export const BE_POSTAL = /^[1-9]\d{3}$/;
export const NL_POSTAL = /^[1-9]\d{3}\s?[A-Za-z]{2}$/;

export const leadSchema = z.object({
  locale: z.enum(["nl-BE", "fr-BE", "nl-NL"]),
  page_path: z.string().max(300).nullable(),
  postal_code: z.string().trim().min(4).max(8),
  connection_type: z.enum(["1F", "3F", "unknown"]).nullable(),
  ampere: z.coerce.number().int().min(6).max(125).nullable(),
  desired_power_w: z.coerce.number().int().refine((w) => [7400, 11000, 22000].includes(w)).nullable(),
  home_older_than_10y: z.boolean().nullable(),
  company_car: z.boolean().nullable(),
  email: z.email().max(200),
  phone: z.string().trim().max(30).nullable(),
  consent: z.literal(true),
  // honeypot: moet leeg blijven
  website: z.string().max(0).optional(),
});

export type LeadForm = z.infer<typeof leadSchema>;

export function postalValid(locale: Locale, postal: string): boolean {
  return locale === "nl-NL" ? NL_POSTAL.test(postal) : BE_POSTAL.test(postal);
}
