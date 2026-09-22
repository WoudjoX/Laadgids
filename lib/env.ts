// Laadt .env.local voor scripts die buiten Next draaien (tsx). Next zelf leest het bestand al.
// Bestaande omgevingsvariabelen winnen; regels zonder '=' of met '#' worden overgeslagen.
import { readFileSync } from "node:fs";
import path from "node:path";

export function loadEnvLocal(file = path.join(process.cwd(), ".env.local")): number {
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return 0;
  }
  let n = 0;
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) {
      process.env[key] = val;
      n++;
    }
  }
  return n;
}

loadEnvLocal();
