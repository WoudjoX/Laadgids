// Screenshots van /design-lab en één P1-pagina op 390×844 en 1280×800 (DESIGN.md §6).
// Vereist een draaiende dev-server (pnpm dev) en `pnpm exec playwright install chromium`.
import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const PAGES = ["/nl-be", "/design-lab", "/nl-be/laadpaal-voor/tesla-model-3-rwd-2025", "/nl-be/laadpaal-voor/peugeot-e-208-51-2025"];
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
];

async function main() {
  const out = path.join(process.cwd(), "screenshots");
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      const file = path.join(out, `${p.replace(/[\/]/g, "_").replace(/^_/, "") || "root"}.${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
