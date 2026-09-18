"use client";

// Enige client-component op de pSEO-pagina. Twee stappen: postcode, dan de rest (DESIGN.md §3).
import { useActionState, useState } from "react";
import { submitLead, type LeadState } from "@/app/actions/lead";
import type { Copy } from "@/lib/copy";
import type { Locale } from "@/lib/db/types";
import { eventAttrs } from "@/lib/analytics";

/** Serialiseerbare copy: geen functies over de server/client-grens. */
export type LeadCopy = Omit<Copy["charger"]["lead"], "intro">;

interface Props {
  lead: LeadCopy;
  locale: Locale;
  pagePath: string;
  defaultPowerW: number;
  intro: string;
  showCompanyCar: boolean;
}

const initial: LeadState = { ok: false };

export function LeadForm({ lead, locale, pagePath, defaultPowerW, intro, showCompanyCar }: Props) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [step, setStep] = useState<1 | 2>(1);
  const [postal, setPostal] = useState("");

  const inputCls = "h-12 w-full rounded-btn border border-line2 bg-card px-3 text-[16px] text-ink focus:border-ink";
  const labelCls = "block text-[14px] text-ink2 mb-1";
  const err = (code?: string) => (code ? <p className="mt-1 text-[13px] text-bad">{lead.errors[code as keyof typeof lead.errors]}</p> : null);

  if (state.ok) {
    return (
      <div className="rounded-card bg-okSoft px-5 py-5 text-ok">
        <p className="text-[16px]">{lead.success}</p>
      </div>
    );
  }

  return (
    <form action={action} {...eventAttrs("lead_submitted", "rounded-card border-hair border-line bg-card px-5 py-5")}>
      <p className="max-w-prose text-[15px] text-ink2">{intro}</p>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="page_path" value={pagePath} />
      {/* honeypot */}
      <div className="hidden" aria-hidden="true">
        <label>
          website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-4">
        <label htmlFor="postal_code" className={labelCls}>
          {lead.postal}
        </label>
        <input
          id="postal_code"
          name="postal_code"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder={lead.postalPlaceholder}
          required
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
          className={inputCls}
        />
        {err(state.fieldErrors?.postal_code)}
      </div>

      {step === 1 ? (
        <button
          type="button"
          onClick={() => setStep(2)}
          className="mt-4 h-12 w-full rounded-btn bg-accent px-4 text-[16px] font-semibold text-card"
        >
          {lead.step1Button}
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="connection_type" className={labelCls}>
                {lead.connection}
              </label>
              <select id="connection_type" name="connection_type" className={inputCls} defaultValue="unknown">
                {lead.connectionOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ampere" className={labelCls}>
                {lead.ampere}
              </label>
              <input id="ampere" name="ampere" inputMode="numeric" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="desired_power_w" className={labelCls}>
              {lead.power}
            </label>
            <select id="desired_power_w" name="desired_power_w" className={inputCls} defaultValue={String(defaultPowerW)}>
              {lead.powerOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-3 text-[15px]">
            <input type="checkbox" name="home_older_than_10y" className="mt-1 h-5 w-5" />
            <span>{lead.homeOld}</span>
          </label>
          {showCompanyCar && (
            <label className="flex items-start gap-3 text-[15px]">
              <input type="checkbox" name="company_car" className="mt-1 h-5 w-5" />
              <span>{lead.companyCar}</span>
            </label>
          )}
          <div>
            <label htmlFor="email" className={labelCls}>
              {lead.email}
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} />
            {err(state.fieldErrors?.email)}
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>
              {lead.phone}
            </label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputCls} />
          </div>
          <label className="flex items-start gap-3 text-[14px] text-ink2">
            <input type="checkbox" name="consent" required className="mt-1 h-5 w-5" />
            <span>{lead.consent}</span>
          </label>
          {err(state.fieldErrors?.consent)}
          {state.error && !state.fieldErrors && err(state.error)}
          <button type="submit" disabled={pending} className="h-12 w-full rounded-btn bg-accent px-4 text-[16px] font-semibold text-card disabled:opacity-60">
            {lead.submit}
          </button>
        </div>
      )}
      <p className="mt-3 text-[13px] text-ink3">{lead.footnote}</p>
    </form>
  );
}
