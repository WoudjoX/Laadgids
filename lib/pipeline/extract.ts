// Verificatiepijplijn, stap 2: cijfers per uitvoering uit de documenttekst halen met Claude (gestructureerde uitvoer).
// CLAUDE.md §8: een taalmodel mag specs uit brochures halen, met een menselijke steekproef van 10 %; nooit copy, regels of tarieven.
// Het model mag alleen overnemen wat er staat: labels letterlijk, paginanummer en citaat per cijfer, niets afleiden.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { OemDocument } from "./documents";

export const DEFAULT_MODEL = "claude-opus-5-5";
/** Boven deze lengte knippen we niet stilzwijgend: het document wordt gemeld en overgeslagen. */
export const MAX_CHARS = 400_000;

const cited = { page: z.number().int().nullable().describe("Paginanummer uit de markering '===== PAGINA n =====', of null bij een webpagina"), quote: z.string().describe("Letterlijk citaat van hoogstens 200 tekens waarin het cijfer staat") };

export const batteryFigureSchema = z.object({
  label: z.string().describe("Het label exact zoals het in het document staat, bv. 'Netto capaciteit', 'Battery Size - usable', 'Accucapaciteit'; leeg als er geen label is"),
  kwh: z.number(),
  ...cited,
});

export const variantSchema = z.object({
  make: z.string(),
  model: z.string().describe("Modelnaam zoals het document die schrijft, zonder merk"),
  variant: z.string().describe("Uitvoering/motorisering zoals het document die schrijft, bv. 'Single Motor Extended Range', '85', '250+'"),
  model_year: z.number().int().nullable(),
  battery: z.array(batteryFigureSchema).describe("Alle batterijcijfers die het document voor deze uitvoering geeft, elk met zijn eigen label"),
  consumption_kwh_100km: z.object({ min: z.number(), max: z.number().nullable().describe("null als het document één waarde geeft"), ...cited }).nullable(),
  ac_charging: z.object({ kw: z.number(), phases: z.number().int().nullable().describe("1 of 3 als het document dat zegt, anders null"), standard: z.boolean().nullable().describe("true als standaard, false als optie, null als onduidelijk"), ...cited }).nullable(),
  ac_option_kw: z.number().nullable().describe("Vermogen van een optionele zwaardere boordlader, bv. 22"),
  dc_max_kw: z.number().nullable(),
  range_km: z.object({ min: z.number(), max: z.number().nullable() }).nullable(),
  notes: z.string().describe("Onzekerheden of tegenstrijdigheden in het document, kort; leeg als er geen zijn"),
});

export const extractionSchema = z.object({
  document_title: z.string(),
  valid_from: z.string().nullable().describe("Datum of maand waarop het document geldig is, zoals vermeld (bv. '1 september 2026'), anders null"),
  market: z.string().nullable().describe("Land of markt van het document zoals vermeld, anders null"),
  model_year: z.number().int().nullable(),
  variants: z.array(variantSchema),
});

export type Extraction = z.infer<typeof extractionSchema>;
export type ExtractedVariant = z.infer<typeof variantSchema>;

export const SYSTEM_PROMPT = `Je leest prijslijsten, technische fiches en webpagina's van autofabrikanten en haalt er per uitvoering van een elektrische auto de technische cijfers uit.

Regels:
- Neem alleen over wat letterlijk in de tekst staat. Leid niets af en vul niets aan uit eigen kennis. Staat een cijfer er niet, geef dan null.
- Labels van batterijcijfers neem je exact over zoals ze geschreven staan (bv. "Netto capaciteit", "Bruto Accu capaciteit", "Battery Size - usable", "Accucapaciteit (kWh)"). Vertaal of normaliseer ze niet. Geef elk batterijcijfer apart, ook als een uitvoering er twee heeft.
- Verbruik: geef het bereik als het document een bereik geeft (min en max), anders één waarde met max null. Eenheid kWh/100 km; een waarde in Wh/km deel je door 10 en vermeld je in notes.
- AC-laden: het vermogen van de boordlader in kW. Fasen alleen als het document "3-fase", "driefasig", "three-phase" of "1-fase" zegt. Een laadduur zonder kW-cijfer is geen vermogen: laat kw dan weg en noteer de laadduur in notes.
- Per cijfer: het paginanummer uit de markering "===== PAGINA n =====" en een kort letterlijk citaat. Bij een webpagina zonder markeringen is page null.
- Eén record per uitvoering (motorisering/batterij). Uitrustingsniveaus zonder eigen techniek (Core, Plus, Ultra) zijn geen aparte uitvoering; noem ze in variant alleen als het document de techniek per niveau laat verschillen.
- Alleen volledig elektrische uitvoeringen; hybrides en verbrandingsmotoren sla je over.
- Tegenstrijdigheden in het document (twee verschillende waarden voor hetzelfde) vermeld je in notes.`;

export interface ExtractOptions {
  client?: Anthropic;
  model?: string;
}

export interface ExtractResult {
  extraction: Extraction;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
}

/** Eén documenttekst naar gestructureerde uitvoeringen. Gooit bij een te lang document in plaats van stil te knippen. */
export async function extractFromText(doc: OemDocument, text: string, opts: ExtractOptions = {}): Promise<ExtractResult> {
  if (text.length > MAX_CHARS) throw new Error(`${doc.id}: document too long (${text.length} chars > ${MAX_CHARS}); split it or add a page range`);
  const client = opts.client ?? new Anthropic();
  const model = opts.model ?? process.env.PIPELINE_MODEL?.trim() ?? DEFAULT_MODEL;
  const header = `Document: ${doc.id}\nMerk: ${doc.make}\nModellen: ${doc.models.join(", ")}\nMarkt: ${doc.market}\nSoort: ${doc.kind}\nBron: ${doc.url}${doc.note ? `\nOpmerking: ${doc.note}` : ""}`;
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "high", format: zodOutputFormat(extractionSchema) },
    messages: [{ role: "user", content: `${header}\n\n----- TEKST -----\n${text}` }],
  });
  if (response.stop_reason === "refusal") throw new Error(`${doc.id}: model declined (${response.stop_details?.category ?? "unknown"})`);
  if (response.stop_reason === "max_tokens") throw new Error(`${doc.id}: output truncated at max_tokens`);
  const extraction = response.parsed_output;
  if (!extraction) throw new Error(`${doc.id}: no parsable output`);
  return { extraction: extractionSchema.parse(extraction), usage: { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens }, model };
}
