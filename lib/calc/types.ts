import type { VersionRow } from "@/lib/db/types";

/** Minimale voertuiginput voor de rekenlaag. Rijen uit `versions` voldoen hieraan. */
export type VersionInput = Pick<
  VersionRow,
  "battery_net_wh" | "consumption_wh_per_km" | "ac_max_w" | "ac_phases"
> &
  Partial<Pick<VersionRow, "catalog_price_be_cents" | "catalog_price_nl_cents" | "co2_wltp_g_km">>;

export type ConnectionKey =
  | "socket_2300"
  | "1f_16a_3700"
  | "1f_32a_7400"
  | "3f_16a_11000"
  | "3f_32a_22000";

export interface Connection {
  key: ConnectionKey;
  phases: 1 | 3;
  amps: number;
  max_w: number;
}

/** Vaste lijst, oplopend in kostprijs/vermogen. Volgorde is betekenisvol (no_gain vergelijkt met de vorige). */
export const CONNECTIONS: readonly Connection[] = [
  { key: "socket_2300", phases: 1, amps: 10, max_w: 2300 },
  { key: "1f_16a_3700", phases: 1, amps: 16, max_w: 3700 },
  { key: "1f_32a_7400", phases: 1, amps: 32, max_w: 7400 },
  { key: "3f_16a_11000", phases: 3, amps: 16, max_w: 11000 },
  { key: "3f_32a_22000", phases: 3, amps: 32, max_w: 22000 },
];

export function connection(key: ConnectionKey): Connection {
  const c = CONNECTIONS.find((x) => x.key === key);
  if (!c) throw new Error(`unknown connection ${key}`);
  return c;
}

/** Vermogen dat bij een fase-mismatch overblijft (CLAUDE.md 6.1). */
export const PHASE_MISMATCH_CAP_W = 7400;
/** Standaard laadverlies als de tariefrij er geen opgeeft. */
export const DEFAULT_CHARGING_LOSS = 0.1;
