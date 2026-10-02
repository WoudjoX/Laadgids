// Welke capaciteit de rekenlaag gebruikt. De bruikbare (netto) capaciteit heeft voorrang. Publiceert de fabrikant
// alleen de nominale capaciteit, dan blijft battery_net_wh leeg en rekent de laadtijd met de nominale waarde:
// een bovengrens, enkele procenten te hoog. De kost per volle lading wordt dan niet berekend (zie chargingCost).
import type { VersionRow } from "@/lib/db/types";

export type BatteryBasis = "net" | "nominal";

export interface BatteryForCalc {
  wh: number;
  basis: BatteryBasis;
}

export type BatteryInput = { battery_net_wh: VersionRow["battery_net_wh"]; battery_gross_wh?: VersionRow["battery_gross_wh"] };

export function batteryForCalc(version: BatteryInput): BatteryForCalc | null {
  const net = version.battery_net_wh;
  if (typeof net === "number" && net > 0) return { wh: net, basis: "net" };
  const gross = version.battery_gross_wh;
  if (typeof gross === "number" && gross > 0) return { wh: gross, basis: "nominal" };
  return null;
}
