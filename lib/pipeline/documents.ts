// Verificatiepijplijn, stap 1: brondocumenten van fabrikanten ophalen, van een vingerafdruk voorzien en als tekst bewaren.
// Registry: data/sources/oem-documents.json (in git). Toestand: data/sources/oem-documents.state.json (in git, klein).
// Ruwe bestanden en tekst: data/sources/cache/ (niet in git; herafleidbaar, auteursrecht).
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const MARKETS = ["BE", "NL", "IE", "INT"] as const;
export const KINDS = ["price_list", "spec_page", "press_kit", "offer_page"] as const;

export const documentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  make: z.string().min(1),
  models: z.array(z.string().min(1)).min(1),
  market: z.enum(MARKETS),
  kind: z.enum(KINDS),
  url: z.url(),
  /** Lokaal bestand (relatief aan de projectmap) als de fabrikant geautomatiseerd ophalen blokkeert. */
  file: z.string().optional(),
  note: z.string().optional(),
});
export type OemDocument = z.infer<typeof documentSchema>;

export const registrySchema = z.object({ $comment: z.string().optional(), documents: z.array(documentSchema) });

export type FetchStatus = "ok" | "unchanged" | "changed" | "unreachable" | "local" | "unsupported";

export interface DocumentState {
  status: FetchStatus;
  http: number | null;
  sha256: string | null;
  bytes: number | null;
  content_type: string | null;
  pages: number | null;
  chars: number | null;
  fetched_at: string;
  /** Datum waarop de inhoud voor het laatst veranderde (vingerafdruk). */
  changed_at: string | null;
  error: string | null;
}

export const REGISTRY_FILE = path.join("data", "sources", "oem-documents.json");
export const STATE_FILE = path.join("data", "sources", "oem-documents.state.json");
export const CACHE_DIR = path.join("data", "sources", "cache");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15";

export async function loadRegistry(root = process.cwd()): Promise<OemDocument[]> {
  const raw = JSON.parse(await fs.readFile(path.join(root, REGISTRY_FILE), "utf8"));
  const parsed = registrySchema.parse(raw);
  const ids = new Set<string>();
  for (const d of parsed.documents) {
    if (ids.has(d.id)) throw new Error(`duplicate document id ${d.id}`);
    ids.add(d.id);
  }
  return parsed.documents;
}

export async function loadState(root = process.cwd()): Promise<Record<string, DocumentState>> {
  try {
    return JSON.parse(await fs.readFile(path.join(root, STATE_FILE), "utf8")) as Record<string, DocumentState>;
  } catch {
    return {};
  }
}

export async function saveState(state: Record<string, DocumentState>, root = process.cwd()): Promise<void> {
  const sorted = Object.fromEntries(Object.keys(state).sort().map((k) => [k, state[k]!]));
  await fs.writeFile(path.join(root, STATE_FILE), JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

export function sha256(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** HTML naar leesbare tekst: scripts en stijlen weg, blokelementen op een eigen regel, entiteiten vertaald. */
export function htmlToText(html: string): string {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<\/(p|div|li|tr|h[1-6]|section|article|table|br|dt|dd)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<\/t[dh]>/gi, " \t ");
  s = s.replace(/<[^>]+>/g, " ");
  const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&nbsp;": " ", "&euro;": "€" };
  s = s.replace(/&(amp|lt|gt|quot|#39|#x27|nbsp|euro);/g, (m) => entities[m] ?? m).replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

/** PDF naar tekst met paginamarkeringen, zodat de uittrekstap paginanummers kan citeren. */
export async function pdfToText(data: Uint8Array): Promise<{ text: string; pages: number }> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const pages = result.pages ?? [];
    if (pages.length > 0) {
      const text = pages.map((p, i) => `===== PAGINA ${i + 1} =====\n${p.text.trim()}`).join("\n\n");
      return { text, pages: pages.length };
    }
    return { text: result.text, pages: result.total ?? 0 };
  } finally {
    await parser.destroy();
  }
}

export function isPdf(buf: Uint8Array, contentType: string | null, url: string): boolean {
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return true; // %PDF
  return /pdf/i.test(contentType ?? "") || /\.pdf($|\?)/i.test(url);
}

export interface FetchedDocument {
  doc: OemDocument;
  state: DocumentState;
  text: string | null;
}

/** Haalt één document op (of leest het lokale bestand), bewaart ruw bestand en tekst, en geeft de nieuwe toestand. */
export async function fetchDocument(doc: OemDocument, previous: DocumentState | undefined, root = process.cwd(), now = new Date()): Promise<FetchedDocument> {
  const fetchedAt = now.toISOString();
  const cacheDir = path.join(root, CACHE_DIR);
  await fs.mkdir(cacheDir, { recursive: true });
  let buf: Uint8Array;
  let http: number | null = null;
  let contentType: string | null = null;
  let local = false;
  try {
    if (doc.file) {
      buf = new Uint8Array(await fs.readFile(path.join(root, doc.file)));
      local = true;
    } else {
      const res = await fetch(doc.url, { headers: { "user-agent": UA, accept: "text/html,application/pdf,*/*" }, redirect: "follow", signal: AbortSignal.timeout(90_000) });
      http = res.status;
      contentType = res.headers.get("content-type");
      if (!res.ok) {
        return { doc, text: null, state: { ...emptyState(fetchedAt, previous), status: "unreachable", http, error: `HTTP ${res.status}` } };
      }
      buf = new Uint8Array(await res.arrayBuffer());
    }
  } catch (e) {
    return { doc, text: null, state: { ...emptyState(fetchedAt, previous), status: "unreachable", http, error: (e as Error).message.slice(0, 200) } };
  }
  const hash = sha256(buf);
  const pdf = isPdf(buf, contentType, doc.url);
  const htmlLike = !pdf && (/html|xml/i.test(contentType ?? "") || /<html/i.test(Buffer.from(buf.subarray(0, 4096)).toString("utf8")));
  if (!pdf && !htmlLike) {
    return { doc, text: null, state: { ...emptyState(fetchedAt, previous), status: "unsupported", http, sha256: hash, bytes: buf.length, content_type: contentType, error: "neither PDF nor HTML" } };
  }
  await fs.writeFile(path.join(cacheDir, `${doc.id}.${pdf ? "pdf" : "html"}`), buf);
  let text: string;
  let pages: number | null = null;
  if (pdf) {
    const r = await pdfToText(buf);
    text = r.text;
    pages = r.pages;
  } else {
    text = htmlToText(Buffer.from(buf).toString("utf8"));
  }
  await fs.writeFile(path.join(cacheDir, `${doc.id}.txt`), text, "utf8");
  const changed = previous?.sha256 != null && previous.sha256 !== hash;
  const status: FetchStatus = local ? "local" : previous?.sha256 == null ? "ok" : changed ? "changed" : "unchanged";
  return {
    doc,
    text,
    state: {
      status,
      http,
      sha256: hash,
      bytes: buf.length,
      content_type: contentType ?? (pdf ? "application/pdf" : null),
      pages,
      chars: text.length,
      fetched_at: fetchedAt,
      changed_at: changed || previous?.sha256 == null ? fetchedAt.slice(0, 10) : (previous?.changed_at ?? null),
      error: null,
    },
  };
}

function emptyState(fetchedAt: string, previous: DocumentState | undefined): DocumentState {
  return { status: "unreachable", http: null, sha256: previous?.sha256 ?? null, bytes: previous?.bytes ?? null, content_type: previous?.content_type ?? null, pages: previous?.pages ?? null, chars: previous?.chars ?? null, fetched_at: fetchedAt, changed_at: previous?.changed_at ?? null, error: null };
}

/** Leest de bewaarde tekst van een eerder opgehaald document. */
export async function readCachedText(id: string, root = process.cwd()): Promise<string | null> {
  try {
    return await fs.readFile(path.join(root, CACHE_DIR, `${id}.txt`), "utf8");
  } catch {
    return null;
  }
}
