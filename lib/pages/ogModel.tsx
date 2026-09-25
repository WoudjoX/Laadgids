// Deelafbeelding per modelpagina: naam, drie kerncijfers en de aanbevolen aansluiting, in de huisstijl.
import { ImageResponse } from "next/og";
import { LOCALE_CONFIG, getCopy, localeFromSegment } from "@/lib/copy";
import { loadRules, loadTariffs, loadVersion } from "@/lib/db/cached";
import { buildChargerPage } from "@/lib/pages/charger";

export const OG_SIZE = { width: 1200, height: 630 };

function Mark() {
  return (
    <div style={{ width: 56, height: 56, borderRadius: 11, background: "#14213D", display: "flex", position: "relative" }}>
      <div style={{ position: "absolute", left: 16, top: 12, width: 8, height: 32, background: "#FAF9F6", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: 16, top: 36, width: 23, height: 8, background: "#FAF9F6", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: 34, top: 13, width: 9, height: 9, background: "#C2410C", borderRadius: 9 }} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#FFFFFF", border: "1px solid #E6E3DC", borderRadius: 14, padding: "22px 28px", minWidth: 300 }}>
      <div style={{ fontSize: 22, color: "#4A5568" }}>{label}</div>
      <div style={{ fontSize: 52, fontWeight: 600, color: "#14213D", marginTop: 6 }}>{value}</div>
    </div>
  );
}

export async function modelOgImage(section: string, seg: string, slug: string): Promise<ImageResponse> {
  const locale = localeFromSegment(seg);
  const copy = locale ? getCopy(locale) : null;
  const version = locale && copy && copy.charger.sectionSlug === section ? await loadVersion(slug) : null;
  if (!locale || !copy || !version) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#FAF9F6" }} />, OG_SIZE);
  }
  const cfg = LOCALE_CONFIG[locale];
  const [rules, tariffs] = await Promise.all([loadRules(cfg.country), loadTariffs(cfg.country, cfg.region)]);
  const d = buildChargerPage(version, locale, rules, tariffs, new Date().toISOString().slice(0, 10));
  const v = d.vars;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FAF9F6", color: "#14213D", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mark />
          <div style={{ fontSize: 34, fontWeight: 600 }}>Laadgids</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 26, color: "#4A5568" }}>{copy.charger.breadcrumbSection}</div>
          <div style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.1 }}>{v.fullName}</div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Metric label={copy.charger.metrics.acMax} value={v.acMax} />
          <Metric label={copy.charger.metrics.battery} value={v.batteryNet} />
          <Metric label={copy.charger.metrics.time(v)} value={v.recommendedTime} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
          <div style={{ color: "#1F5F4A", fontWeight: 600 }}>{copy.charger.table.recommended}: {v.recommendedLabel}</div>
          <div style={{ color: "#8A94A6" }}>laadgids.be</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
