// Design-lab (DESIGN.md §6): alle componenten met echte voorbeelddata naast elkaar. Niet indexeren.
import type { Metadata } from "next";
import { AnswerBox } from "@/components/AnswerBox";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ChargeTimeTable } from "@/components/ChargeTimeTable";
import { CompanyCarBlock } from "@/components/CompanyCarBlock";
import { CostBlock } from "@/components/CostBlock";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LeadForm } from "@/components/LeadForm";
import { MetricCards } from "@/components/MetricCards";
import { PeakBlock } from "@/components/PeakBlock";
import { SourcesBlock } from "@/components/SourcesBlock";
import { PhaseDiagram } from "@/components/viz/PhaseDiagram";
import { getCopy } from "@/lib/copy";
import type { RuleRow, TariffRow, VersionFull } from "@/lib/db/types";
import { buildChargerPage } from "@/lib/pages/charger";

export const metadata: Metadata = { title: "Design-lab", robots: { index: false, follow: false } };

const sample: VersionFull = {
  id: 0,
  vehicle_id: 0,
  slug: "sample-11kw",
  trim: "RWD",
  model_year: 2025,
  battery_gross_wh: 60000,
  battery_net_wh: 57500,
  wltp_range_km: 513,
  consumption_wh_per_km: 132,
  ac_max_w: 11000,
  ac_phases: 3,
  dc_max_w: 170000,
  towing_kg: 1000,
  catalog_price_be_cents: null,
  catalog_price_nl_cents: null,
  co2_wltp_g_km: 0,
  sold_in: ["BE", "NL"],
  spec_source_url: "https://www.tesla.com/nl_be/model3",
  spec_source_date: "2026-09-01",
  vehicle: { id: 0, make_id: 0, slug: "tesla-model-3", model: "Model 3", generation: null, powertrain: "bev", segment: "d-sedan" },
  make: { id: 0, slug: "tesla", name: "Tesla" },
};
const sample1f: VersionFull = { ...sample, slug: "sample-74kw", trim: "51 kWh", battery_net_wh: 51000, ac_max_w: 7400, ac_phases: 1, vehicle: { ...sample.vehicle, model: "e-208" }, make: { id: 1, slug: "peugeot", name: "Peugeot" } };

const rules: RuleRow[] = [
  {
    id: 1,
    country: "BE",
    region: "VLA",
    rule_type: "capacity_tariff",
    valid_from: "2026-01-01",
    valid_to: null,
    params: { cents_per_kw_year: 5600, min_kw: 2.5, household_baseline_w: 3500 },
    source_url: "https://www.vreg.be/nl/capaciteitstarief",
    source_checked_at: "2026-09-01",
    notes: null,
  },
];
const tariffs: TariffRow[] = [
  { id: 1, country: "BE", region: null, slug: "vast-dag", label: { nl: "vast dagtarief", fr: "tarif fixe de jour" }, price_cents_per_kwh: 33, charging_loss_pct: 10, source_url: "https://www.creg.be", source_checked_at: "2026-09-01", notes: null },
  { id: 2, country: "BE", region: null, slug: "vast-nacht", label: { nl: "vast nachttarief", fr: "tarif fixe de nuit" }, price_cents_per_kwh: 28, charging_loss_pct: 10, source_url: "https://www.creg.be", source_checked_at: "2026-09-01", notes: null },
  { id: 3, country: "BE", region: null, slug: "dynamisch-slim", label: { nl: "dynamisch tarief, slim laden", fr: "tarif dynamique" }, price_cents_per_kwh: 22, charging_loss_pct: 10, source_url: "https://www.creg.be", source_checked_at: "2026-09-01", notes: null },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t-hair border-line py-8">
      <p className="mb-4 text-[13px] text-ink3">{title}</p>
      {children}
    </section>
  );
}

export default function DesignLab() {
  const locale = "nl-BE" as const;
  const copy = getCopy(locale);
  const d11 = buildChargerPage(sample, locale, rules, tariffs, "2026-09-10");
  const d74 = buildChargerPage(sample1f, locale, rules, tariffs, "2026-09-10");
  const { intro: leadIntro, ...leadCopy } = copy.charger.lead;
  return (
    <>
      <Header copy={copy} locale={locale} />
      <div className="mx-auto max-w-content px-4 py-8">
        <h1>Design-lab</h1>
        <Block title="Breadcrumb">
          <Breadcrumb items={[{ label: "Home", href: "/nl-be" }, { label: "Laadpaal per model", href: "/nl-be/laadpaal-voor" }, { label: "Tesla Model 3 RWD" }]} />
        </Block>
        <Block title="AnswerBox (11 kW, Vlaanderen)">
          <AnswerBox label={copy.charger.shortAnswerLabel} text={copy.charger.shortAnswer(d11.vars)} />
        </Block>
        <Block title="AnswerBox (7,4 kW 1F)">
          <AnswerBox label={copy.charger.shortAnswerLabel} text={copy.charger.shortAnswer(d74.vars)} />
        </Block>
        <Block title="MetricCards">
          <MetricCards
            items={[
              { label: copy.charger.metrics.acMax, value: "11", unit: "kW" },
              { label: copy.charger.metrics.battery, value: "57,5", unit: "kWh" },
              { label: copy.charger.metrics.time(d11.vars), value: "3:30", unit: "u" },
            ]}
          />
        </Block>
        <Block title="ChargeTimeTable (11 kW)">
          <ChargeTimeTable rows={d11.advice.table} recommended={d11.advice.recommended_connection} copy={copy} locale={locale} />
        </Block>
        <Block title="ChargeTimeTable (7,4 kW 1F: twee rijen geen winst)">
          <ChargeTimeTable rows={d74.advice.table} recommended={d74.advice.recommended_connection} copy={copy} locale={locale} />
        </Block>
        <Block title="PhaseDiagram (3F-auto, aanbevolen 3F)">
          <PhaseDiagram acPhases={3} recommendedPhases={3} singleKw="7,4 kW" threeKw="11 kW" copy={copy.charger.diagram} />
        </Block>
        <Block title="PhaseDiagram (1F-auto, aanbevolen 1F)">
          <PhaseDiagram acPhases={1} recommendedPhases={1} singleKw="7,4 kW" threeKw="7,4 kW" copy={copy.charger.diagram} />
        </Block>
        <Block title="CostBlock">
          <CostBlock comparison={d11.cost} tariffs={tariffs} vars={d11.vars} copy={copy} locale={locale} ctaHref="/nl-be" />
        </Block>
        <Block title="PeakBlock">
          {d11.advice.capacity && <PeakBlock capacity={d11.advice.capacity} vars={d11.vars} copy={copy} locale={locale} />}
        </Block>
        <Block title="LeadForm">
          <LeadForm lead={leadCopy} locale={locale} pagePath="/design-lab" defaultPowerW={11000} intro={leadIntro(d11.vars)} showCompanyCar />
        </Block>
        <Block title="CompanyCarBlock">
          <CompanyCarBlock copy={copy} href={null} />
        </Block>
        <Block title="FAQ">
          <Faq heading={copy.charger.faq.heading} items={copy.charger.faq.items(d11.vars)} />
        </Block>
        <Block title="SourcesBlock">
          <SourcesBlock heading={copy.charger.sources.heading} checkedLabel={copy.charger.sources.checked} sources={d11.sources} locale={locale} />
        </Block>
      </div>
      <Footer copy={copy} locale={locale} />
    </>
  );
}
