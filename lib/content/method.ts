// Pagina "Hoe we rekenen": de tekst is een voorstel tot Erwin hem nakijkt (zoals de regelpagina's).
// Zolang `reviewed` false is: noindex, niet in de sitemap, nergens naar gelinkt.
import type { Locale } from "@/lib/db/types";

export const METHOD_REVIEWED: Record<Locale, boolean> = { "nl-BE": false, "fr-BE": false, "nl-NL": false };
