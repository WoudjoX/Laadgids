import {
  CONNECTIONS,
  DEFAULT_CHARGING_LOSS,
  PHASE_MISMATCH_CAP_W,
  type Connection,
  type ConnectionKey,
  type VersionInput,
} from "./types";

export interface ChargeTimeOptions {
  from_pct?: number; // default 20
  to_pct?: number; // default 80
  charging_loss?: number; // fractie, default 0.10
}

export interface ChargeTimeResult {
  connection: ConnectionKey;
  phases: 1 | 3;
  max_w: number;
  effective_w: number;
  energy_needed_wh: number; // incl. laadverlies, niet afgerond
  seconds: number; // niet afgerond
  from_pct: number;
  to_pct: number;
}

/** Effectief laadvermogen van een auto aan een aansluiting (CLAUDE.md 6.1). */
export function effectivePower(version: VersionInput, conn: Connection): number {
  let w = Math.min(version.ac_max_w, conn.max_w);
  if (conn.phases !== version.ac_phases) w = Math.min(w, PHASE_MISMATCH_CAP_W);
  return w;
}

export function chargeTime(version: VersionInput, conn: Connection, opts: ChargeTimeOptions = {}): ChargeTimeResult {
  const from_pct = opts.from_pct ?? 20;
  const to_pct = opts.to_pct ?? 80;
  const loss = opts.charging_loss ?? DEFAULT_CHARGING_LOSS;
  if (to_pct <= from_pct) throw new Error("to_pct must be greater than from_pct");
  if (loss < 0 || loss >= 1) throw new Error("charging_loss must be in [0,1)");
  if (!(version.battery_net_wh > 0) || !(version.ac_max_w > 0)) throw new Error("battery_net_wh and ac_max_w must be positive");
  const effective_w = effectivePower(version, conn);
  const energy_needed_wh = (version.battery_net_wh * (to_pct - from_pct)) / 100 / (1 - loss);
  const seconds = (energy_needed_wh / effective_w) * 3600;
  return { connection: conn.key, phases: conn.phases, max_w: conn.max_w, effective_w, energy_needed_wh, seconds, from_pct, to_pct };
}

export interface ChargeTimeRow extends ChargeTimeResult {
  /** true als deze aansluiting niets sneller laadt dan de vorige, goedkopere. */
  no_gain: boolean;
}

/** Alle aansluitingen in vaste volgorde, met no_gain-markering. */
export function chargeTimeTable(version: VersionInput, opts: ChargeTimeOptions = {}): ChargeTimeRow[] {
  const rows: ChargeTimeRow[] = [];
  for (const conn of CONNECTIONS) {
    const r = chargeTime(version, conn, opts);
    const prev = rows[rows.length - 1];
    rows.push({ ...r, no_gain: prev !== undefined && prev.effective_w === r.effective_w });
  }
  return rows;
}
