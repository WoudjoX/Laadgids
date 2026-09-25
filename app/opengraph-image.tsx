// Standaard deelafbeelding (LinkedIn, WhatsApp, Slack): wordmark en belofte in de huisstijl. Geen foto (DESIGN.md §4).
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Laadgids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FAF9F6", color: "#14213D", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: "#14213D", display: "flex", position: "relative" }}>
            <div style={{ position: "absolute", left: 18, top: 14, width: 9, height: 36, background: "#FAF9F6", borderRadius: 2 }} />
            <div style={{ position: "absolute", left: 18, top: 41, width: 26, height: 9, background: "#FAF9F6", borderRadius: 2 }} />
            <div style={{ position: "absolute", left: 39, top: 15, width: 10, height: 10, background: "#C2410C", borderRadius: 10 }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>Laadgids</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1, maxWidth: 1000 }}>Welke laadpaal past bij jouw auto?</div>
          <div style={{ fontSize: 30, color: "#4A5568", maxWidth: 1000, lineHeight: 1.35 }}>Berekend laadadvies per model: laadtijd, kosten en capaciteitstarief, met de bronnen erbij.</div>
        </div>
        <div style={{ fontSize: 24, color: "#8A94A6" }}>laadgids.be</div>
      </div>
    ),
    size,
  );
}
