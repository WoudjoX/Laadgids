// Tariefslug in het adres per locale. `tariffs.slug` blijft de sleutel in data en code; Franstalige adressen krijgen een
// Franse slug. Zonder imports, zodat next.config.ts er de doorverwijzingen van de oude adressen uit kan maken.
export const TARIFF_PATH_SLUG: Partial<Record<"nl-BE" | "fr-BE" | "nl-NL", Record<string, string>>> = {
  "fr-BE": { "vast-dag": "fixe-jour", "vast-nacht": "fixe-nuit", "dynamisch-slim": "dynamique-intelligent", zonnepanelen: "panneaux-solaires" },
};
