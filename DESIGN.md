# DESIGN.md — visueel systeem voor Laadgids

> Companion van CLAUDE.md. Lees dit voor elke UI-taak. Bij twijfel: rustiger, minder, kleiner.
> De site moet aanvoelen als een goed rekenblad van een adviseur die je vertrouwt — niet als een SaaS-landingspagina en niet als een blog.

---

## 1. Wat we willen dat mensen voelen

Drie woorden, in deze volgorde: **zeker, eerlijk, snel**.

- **Zeker**: het antwoord staat bovenaan, groot, in één zin. Geen inleiding.
- **Eerlijk**: we zeggen expliciet wat je níet moet kopen ("22 kW: geen winst"). De ontwerptaal ondersteunt dat: de afgeraden optie is zichtbaar gedempt, niet verborgen.
- **Snel**: de pagina laadt in minder dan 1,5 s op 4G, niets verspringt, alles werkt zonder JavaScript behalve het formulier.

Referentiegevoel: een Wise-rekenmodule, de typografie van Stripe Docs, de eerlijkheid van Wirecutter, de toon van een overheidsrekentool. Niet: Tesla.com, niet een energieleverancier, niet een laadpaalwebshop.

---

## 2. Tokens (Tailwind-config `theme.extend`)

Gebruik uitsluitend deze tokens. Geen willekeurige hex-waarden in components.

```ts
colors: {
  paper:  '#FAF9F6',   // pagina-achtergrond, warm off-white — nooit puur wit als canvas
  card:   '#FFFFFF',   // kaarten en tabellen
  ink:    '#14213D',   // primaire tekst, koppen — diep navy, geen zwart
  ink2:   '#4A5568',   // secundaire tekst
  ink3:   '#8A94A6',   // hints, metadata, gedempte rijen
  line:   '#E6E3DC',   // 0.5px hairlines
  line2:  '#CFCBC2',   // sterkere lijn (hover, focus)
  accent: '#C2410C',   // één accent: gebrand oranje. Alleen voor de aanbevolen keuze en de primaire CTA
  accentSoft: '#FDF0E8',
  ok:     '#1F5F4A',   // status "aanbevolen"-tekst op ok-soft
  okSoft: '#E6F1EC',
  warn:   '#7A4B00',
  warnSoft: '#FBF1DC',
  bad:    '#8B2C2C',
  badSoft: '#F9E8E8',
}
```

Regels bij de kleuren:
- **Geen groen als merkkleur.** Elke EV-site is groen. Groen gebruiken we alleen als status ("aanbevolen"), nooit decoratief.
- **Één accentkleur, maximaal twee keer per scherm**: de aanbevolen rij en de leadknop. Als iets anders ook oranje wordt, is het te veel.
- Tekst op een gekleurd vlak is altijd de donkere variant van dezelfde familie (`ok` op `okSoft`), nooit `ink` of zwart.
- Geen gradients, geen schaduwen behalve een 1px focusring, geen glasachtige blur.

Typografie:
```ts
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui'],
  mono: ['JetBrains Mono', 'ui-monospace'],
},
```
- Body 17px / 1,65 op mobiel, 18px / 1,7 op desktop. Koppen: H1 30/36 (mobiel/desktop) gewicht 600, H2 22/24 gewicht 600, H3 18 gewicht 600. **Nooit gewicht 700 of 800.**
- Alle getallen in tabellen en metric cards: `font-variant-numeric: tabular-nums`. Dit is de goedkoopste kwaliteitswinst op de hele site.
- Grote cijfers in metric cards: 28px gewicht 500, geen bold.
- Zinsstijl overal ("Kort antwoord", niet "Kort Antwoord"). Geen hoofdletters als stijlmiddel.
- Inter laden via `next/font` met `display: swap`, subset latin, twee gewichten (400, 600). Meer niet.

Ruimte en vorm:
- Spacing op een 4px-raster. Verticale ritmes: 16 / 24 / 40 / 64.
- Maximale tekstbreedte 68 tekens (`max-w-prose`). Tabellen mogen breder.
- Radius: 6px voor knoppen en inputs, 10px voor kaarten. Nooit `rounded-full` behalve avatars.
- Borders: `0.5px solid line`. Kaarten hebben een border óf een andere achtergrond, nooit allebei.
- Contentkolom 720px op desktop, één kolom. Geen sidebar. Geen tweekolomslayout op pSEO-pagina's.

---

## 3. Componenten (bouw ze eerst in `/design-lab`, dan pas in templates)

### AnswerBox
Het belangrijkste element van de site.
- Achtergrond `accentSoft`, geen border, radius 10, padding 20/24.
- Label "Kort antwoord" 13px gewicht 600 in `accent`.
- Tekst 18px, kleur `ink`, maximaal 4 zinnen.
- Staat direct onder de datumregel, vóór alles wat scrolbaar is. Op mobiel volledig zichtbaar zonder scrollen.

### MetricCard (×3 in een rij, op mobiel 3 naast elkaar met 12px gap; nooit stapelen)
- Achtergrond `card`, border `line`, radius 10, padding 16.
- Label 13px `ink2` boven, waarde 28px gewicht 500 `ink` eronder, eenheid 14px `ink2` naast de waarde.

### ChargeTimeTable
- Kopregel achtergrond `paper`, tekst 13px `ink2`.
- Rij "aanbevolen": achtergrond `okSoft`, tekst `ok`, badge "aanbevolen" 12px in een pill met `card`-achtergrond.
- Rij "geen winst": alle tekst `ink3`, laatste cel bevat letterlijk "geen winst" — niet doorstrepen, niet verbergen.
- `table-layout: fixed`, drie kolommen 40/25/35%. Op mobiel blijft het een tabel; geen kaartjes.

### CostBlock
- Kaart met drie regels, elke regel `flex justify-between`, gescheiden door hairlines.
- De goedkoopste regel in `accent`, gewicht 600. Bedrag rechts, tabular.
- Eén zin eronder in 14px `ink2` met het jaarverschil.
- Daaronder de secundaire knop "Vergelijk dynamische tarieven →" (outline, geen vulling).

### PeakBlock (alleen Vlaanderen)
- Achtergrond `warnSoft`, tekst `warn`. Twee scenario's naast elkaar: "zonder load balancing" / "met load balancing", elk met een jaarbedrag.
- Geen waarschuwingsicoon. De kleur is de waarschuwing.

### LeadForm
- De enige component met de gevulde `accent`-knop.
- Mobiel eerst: postcode-veld met `inputmode="numeric"` en `autocomplete="postal-code"`, 48px hoog, daarna pas de rest via een tweede stap (progressive disclosure). Stap 1 = postcode + knop. Stap 2 = aansluiting, vermogen, woningleeftijd, bedrijfswagen, e-mail, telefoon.
- Elke stap past op één mobiel scherm zonder scrollen.
- Foutmeldingen inline, 13px `bad`, onder het veld. Geen toasts, geen modals.
- Onder de knop één regel 13px `ink3`: "Gratis, vrijblijvend, erkende installateurs". Geen logo's van keurmerken tenzij we ze echt hebben.

### FAQ
- Geen accordeon. Vragen als H3, antwoorden eronder, volledig zichtbaar. Google en gebruikers lezen liever alles dan klikken.

### SourcesBlock
- Onderaan, 13px, `ink2`. Per bron: naam, datum gecontroleerd, link. Dit is een vertrouwenselement, geen voetnoot; maak het niet onzichtbaar klein.

### Header / footer
- Header: wordmark links (tekst, geen logo-beeld in fase 1), taalwissel rechts (nl · fr), meer niet. Geen navigatiemenu met acht items.
- Footer: over ons met een echte naam en foto van Erwin, contact, privacy, taalversies. Een site zonder mens erachter converteert niet.

---

## 4. Beeld

- **Geen stockfoto's.** Geen EV aan een laadpaal bij zonsondergang, geen glimlachende elektricien, geen groen landschap met windmolens.
- Wel toegestaan: eenvoudige lijndiagrammen in `ink` op `paper` die iets uitleggen (1-fase vs 3-fase aansluiting, waar de MID-meter zit). SVG, inline, maximaal 2 kleuren.
- Geen iconen bij koppen of lijstjes. Iconen alleen in de UI waar ze een functie hebben (pijl in een knop, kruisje om te sluiten).
- Geen illustraties in "corporate Memphis"-stijl, geen 3D-renders, geen AI-gegenereerd beeld.

---

## 5. Anti-patronen (als je dit ziet in je eigen output: weg ermee)

- Een hero-sectie met grote titel, subtitel en twee knoppen. Dit is geen productpagina.
- Drie kolommen "voordelen" met iconen.
- Gradient-achtergronden, glow, glassmorphism, `shadow-xl`.
- Blauw als primaire kleur (`#3B82F6` en familie).
- `rounded-2xl` overal, `font-bold` overal.
- Emoji's in koppen of tekst.
- Zinnen als "Ontdek", "Laten we", "In deze gids", "Alles wat je moet weten".
- Uitroeptekens in UI-tekst.
- Een cookiebanner (we gebruiken Plausible/Umami, dus die is niet nodig).
- Sticky elementen die de content bedekken op mobiel.
- Accordeons voor inhoud die mensen willen lezen.
- Afbeeldingen zonder vaste `width`/`height` (layout shift).

---

## 6. Werkwijze voor UI-taken

1. Bouw of wijzig eerst in `app/design-lab/page.tsx`, waar alle componenten met echte voorbeelddata naast elkaar staan.
2. Na elke wijziging: `pnpm screenshot` (Playwright, 390×844 en 1280×800, licht en donker als dark mode ooit komt). Bekijk de screenshots. Vergelijk met de referenties in sectie 1. Beschrijf in de PR wat je zag en wat je aanpaste.
3. Controleer: tabular-nums op alle cijfers, één accentkleur zichtbaar, geen element uit sectie 5, contrast ≥ 4,5:1 (axe-core in de test).
4. Lighthouse mobiel: Performance ≥ 90, Accessibility 100, SEO 100. Anders niet mergen.
5. Pas als `/design-lab` goedgekeurd is door Erwin, worden componenten in templates gebruikt.

---

## 7. Copy-toon (design is ook taal)

- Tweede persoon, kort, stellig. "Neem een 11 kW-paal." niet "Wij raden u aan om te overwegen…"
- Eerst het cijfer, dan de uitleg. "€ 9 per volle lading met een dynamisch tarief. Dat is € 260 per jaar minder dan het dagtarief."
- Nooit "gratis advies", "eenvoudig", "in een handomdraai".
- Onzekerheid benoemen waar die is: "Verifieer bij je netbeheerder" is beter dan een fout getal.
- Franstalige copy is Belgisch-Frans: borne, gestionnaire de réseau, avantage de toute nature.
