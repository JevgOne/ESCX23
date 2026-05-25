# Profile detail design inspiration

Research for the LovelyGirls Prague profile detail page. Goal: kill the WordPress vibe, land on a premium dark editorial layout. Sources below mix authenticated industry analyses (Airbnb design system breakdown, luxury hotel reviews) with design-pattern primary sources (Smart Interface Patterns, Awwwards, Muzli). Several direct escort-site fetches were blocked (ECONNREFUSED / 403 / Cloudflare), so observations on those are drawn from secondary references and known patterns; this is called out where it applies.

---

## Source 1: Airbnb listing detail page (Plus / Luxe sub-system)
URL: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md
Layout: 2-column at desktop above 1128px. Left column ~64% (photo banner + amenity body), right column ~32% (sticky reservation card). Mobile collapses the reservation rail to a sticky bottom bar showing only price + CTA.
Strong patterns:
- Hero is a large photo banner that "does the work above the H1". The H1 is intentionally quiet (22px / 500). This is the opposite of WordPress titles screaming over photos.
- Sticky right-rail card: rounded.md (~14px), 1px hairline border, 1px shadow elevation, 24px padding. Contains: nightly price (display weight), date selector, guest stepper, full-width "Reserve" CTA, fee stack.
- Property card images stick to 1:1 aspect ratio with rounded corners.
- Amenities = 1-column list of icon + ink label at body-md (16px/400), 12px row padding, no dividers between rows. Clean and breathable.
- Rating moment uses typography itself: 64px / 700 number flanked by laurel SVG ornaments. Lesson: when one stat matters, blow it up.
- Section vertical rhythm: 64px between major bands, 16px gutter inside cards.
- Luxe sub-brand uses purple (#460479) accent only inside Luxe contexts — sub-brand differentiation through one color token.
Screenshot description: Imagine a wide left photo grid (1 hero + 4 small mosaic right), then title row, then a vertical body of dividers and icon rows. On the right, one boxed reservation card floating sticky.
Adapt for ESCX23: Two-column desktop, photo + body on left (~62%), right is a single sticky "contact / quick facts" card. Mobile: photo carousel first, body, sticky bottom bar with "Kontakt / +420…" CTA.

---

## Source 2: Luxury hotel detail pages (Aman, Burgenstock, 7132 Hotel, La Mamounia)
URL: https://mediaboom.com/news/luxury-hotel-website-design/
Layout: Full-bleed cinematic hero (often video), generous white/black space, single-column editorial flow with occasional 2-column inserts.
Strong patterns:
- Full-screen entry imagery, "quiet waves, generous space, meditative pacing" (Aman). Premium = restraint, not maximalism.
- 7132 Hotel uses dark hues with soft light — confirms dark theme is the luxury-hospitality norm.
- Galleries are full-sized carousels with high-res photos; users browse sequentially, not in a grid mosh-pit.
- CTAs sit above the fold in contrasting accent color to the primary palette.
- Refined serif/sans pairing, lots of negative space, no badges/no decorative gradients.
Screenshot description: One huge photo bleeding edge to edge, name/location in small caps centered or bottom-left, single CTA, then a quiet scroll into rooms / story / gallery.
Adapt for ESCX23: Hero photo allowed to bleed full width or at least 60vh tall. Name in serif (Playfair / Cormorant) over or below the image. No competing UI in the hero — only one "Kontaktovat" CTA.

---

## Source 3: Vogue / NYT Magazine editorial layouts
URL: https://www.itsnicethat.com/features/gail-bichler-the-new-york-times-magazine-redesign-publication-spotlight-080426 + https://www.designyourway.net/blog/what-font-does-vogue-use/
Layout: Photo + text follow Rule of Thirds; model on far right, dark text block on left third. Headlines in Didot/Cheltenham (high-contrast serif), body in Georgia, captions in Franklin Gothic.
Strong patterns:
- Serif headline + sans caption is THE editorial signature. Mixing both signals "magazine, not blog".
- High-contrast serifs over moody photography = instant luxury.
- Generous white space (or black space) around photos — never let UI chrome touch the image edge.
- Single bold pull-quote per article, large, set in oversized serif italic.
- Subhead/byline runs in small caps sans-serif, often with a thin hairline divider.
Screenshot description: Big photo, name in 72px Didot bold, one-line dek in 18px italic serif underneath, hairline divider, body copy in narrow column.
Adapt for ESCX23: Profile name in 56-72px serif (Cormorant Garamond or Playfair). Tagline ("Brunette · 24 · Praha 1") in 14px tracked-out sans-serif uppercase below. Body bio in serif 18px / 1.6 line-height, narrow column max-width 640px.

---

## Source 4: Smart Interface Design Patterns — chips/tags/pills
URL: https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/
Layout: N/A — this is a pattern reference.
Strong patterns:
- Badges = static, Tags = interactive. Don't blur the line. Clickable services MUST look interactive (border or fill, not just text).
- Minimum touch target 48×48px on mobile.
- At least 8px gap between chips to prevent mis-taps.
- Material principle: selected state uses the accent color fill, default state is outline only — visually quieter at rest, loud when selected.
- "Chips with leading hashtag" are the established pattern for hashtag-style filtering (Instagram, Twitter, Behance).
Adapt for ESCX23: Service tags = outline pills (no fill), 1px border in muted gold (#B8915A at 40% alpha), text in 13px tracked sans-serif. On hover/active: fill in gold, dark text. Hashtags get a literal `#` prefix and route to /hashtag/[slug].

---

## Source 5: Muzli profile page collection
URL: https://muz.li/inspiration/profile-page/
Strong patterns:
- Card-based grouping of info with clear visual hierarchy (MatDash, UI Kit Constructor).
- Skill/tag chips are universally pill-shaped, not square.
- Verification badge sits adjacent to the name, not in a separate row.
- Bold typography + contrasting palette for emphasis — the name should be the loudest thing on the page.
- Vertical sidebars carry navigation OR supplementary info, never both.
Adapt for ESCX23: One verification check (gold checkmark) right next to the name. Avoid stacking 4 separate sidebar cards — collapse to ONE sidebar block.

---

## Source 6: Muzli dark mode collection
URL: https://muz.li/inspiration/dark-mode/
Strong patterns:
- Two valid dark palettes: charcoal (#1a1a2e-ish, softer) or true black (#0A0A0A, more dramatic). Avoid #000 pure black — text contrast on photos becomes harsh.
- Full-bleed hero images extend edge-to-edge for max impact in dark UIs.
- Accent colors must be saturated to survive against dark background — muted accents wash out.
- Sans-serif dominates UI text; serif is reserved for editorial headlines.
- Cards use #1A1A1A or #141414 surfaces with subtle 1px white-at-6% borders rather than shadows (shadows don't show on dark bg).
Adapt for ESCX23: Background #0A0A0A (or #0D0D0D). Surface cards #161616 with `border: 1px solid rgba(255,255,255,0.06)`. Accent: warm gold #C9A875 (NOT bright yellow — sits between champagne and brass).

---

## Source 7: Awwwards editorial layout collection
URL: https://www.awwwards.com/inspiration/editorial-layout
Strong patterns:
- Big asymmetric hero typography ("hero font") that overlaps with imagery.
- Minimalism — text and image carry the weight, no decorative UI shapes.
- Rule of thirds for photo + headline pairing.
Adapt for ESCX23: Name allowed to overlap the bottom of the hero photo by ~80-120px (the photo bottom-left, the name baseline-right) — this single trick instantly removes the WordPress vibe.

---

## Source 8: Fashion PDP best practices (commerce-ui / Baymard)
URL: https://commerce-ui.com/insights/best-21-fashion-pdp-examples-in-2024 + https://baymard.com/ecommerce-design-examples/42-image-gallery-overlay
Strong patterns:
- Sticky left photo column + scrolling right content is THE fashion PDP pattern (Acne, COS, SSENSE all do variants).
- Image gallery overlay (lightbox): clicking any thumbnail opens a fullscreen modal with all images at full res, swipeable.
- Aspect ratio for fashion is typically 4:5 portrait (not 1:1 square, not 16:9 landscape) — humans photograph best in portrait.
- "Sticky bar with CTA" reappears on scroll once the original CTA leaves the viewport.
Adapt for ESCX23: Hero photo 4:5 portrait, ~640px max-width left column. Click → fullscreen lightbox with arrow keys + swipe. Sticky bottom bar reveals after the contact card scrolls past.

---

## Source 9: Behance — Elite Escort Directory Case Study 2024
URL: https://www.behance.net/gallery/196585167/Elite-Escort-Directory-Case-Study-2024
Strong patterns (inferred from case study metadata + visible tag taxonomy):
- The category covers: UI/UX, Branding, Online Booking, Adult — confirms premium escort sites are now treated as branded-product design exercises, not template Wordpress.
- Profile screens use a hero portrait + bio + service grid + booking action pattern.
- Designers tag it under "Branding" — implies a strong identity layer (custom logo lockup, type system, color tokens) is expected.
Adapt for ESCX23: Treat the profile page as a brand surface. Custom verified badge, custom availability dot, custom hashtag chip — not stock icons.

---

## Source 10: Luxury hotel detail pages (Booking.com luxury tier — secondary source)
URL: https://www.cloudbeds.com/articles/hotel-website-design/
Strong patterns:
- Inline horizontal stat strip ("3 bedrooms · 2 baths · 120 m² · sea view") under the title — scannable in 1 second.
- Amenities grouped under collapsed sections ("Show all 47 amenities") with the first 6 visible.
- Guest-review pull-quote with avatar block sits above the booking card as social proof.
Adapt for ESCX23: Single-line meta strip immediately under the name — `170 cm · 47 kg · 24 let · brunetka · hnědé oči · CZ/EN`. Drop the 6-tile "Vzhled" card entirely. Use "Show all services" only AFTER showing 8 most-popular service chips inline.

---

## RECOMMENDED LAYOUT FOR ESCX23 (synthesis)

### Core decisions
1. **Theme**: dark, near-black canvas (#0A0A0A) with surface #161616. Accent = warm champagne gold (#C9A875).
2. **Typography**: Cormorant Garamond (or Playfair Display) for name + section H2s. Inter / Geist for everything else. Tracking +0.08em uppercase on small meta.
3. **Layout grid**: 12-col, max-width 1240px. Desktop = 7-col photo / 5-col body+rail OR 8-col photo / 4-col rail depending on hero choice. Mobile = single column, photo carousel first.
4. **Kill the WordPress feel**: replace stat-tile grid with ONE meta strip + ONE bio paragraph. Replace 4 stacked sidebar cards with ONE consolidated contact card.

### ASCII desktop mockup (1240px wide)

```
+--------------------------------------------------------------------------+
|  LOVELYGIRLS PRAGUE                          Modelky  Služby  Kontakt EN |
+--------------------------------------------------------------------------+
|                                                                          |
|   <-- 14px breadcrumb: Modelky / Brunetky / Sofia -->                    |
|                                                                          |
|  +-----------------------------------+    +---------------------------+  |
|  |                                   |    |  AVAILABLE NOW            |  |
|  |                                   |    |  (small gold dot pulse)   |  |
|  |          HERO PHOTO 4:5           |    |                           |  |
|  |       (640 x 800, full bleed      |    |  +49 000 / 1 hodina       |  |
|  |        within left column,        |    |  +89 000 / 2 hodiny       |  |
|  |        rounded 8px, slight        |    |  +14 000 / hodina navíc   |  |
|  |        vignette at bottom)        |    |                           |  |
|  |                                   |    |  [ KONTAKTOVAT  +420... ] |  |
|  |                                   |    |  [ WhatsApp ] [ Telegram] |  |
|  |  <ribbon: # 04 of 12 photos >     |    |                           |  |
|  +-----------------------------------+    |  -----------------------  |  |
|  [thumb][thumb][thumb][thumb][thumb][+7]  |  RYCHLÁ FAKTA             |  |
|                                           |  170 cm · 47 kg · 24 let  |  |
|                                           |  Brunetka · Hnědé oči     |  |
|                                           |  Měří 90-60-90  EU 38     |  |
|                                           |  CZ / EN / RU             |  |
|                                           |  Praha 1, výjezdy ČR+EU   |  |
|                                           +---------------------------+  |
|                                              ^ sticky on scroll          |
|                                                                          |
|  -----------------------------------                                     |
|                                                                          |
|     SOFIA          (72px Cormorant, gold dot pulse next to name)        |
|     24 · BRUNETTE · PRAGUE 1     (14px tracked uppercase, white 60%)    |
|                                                                          |
|     "One-line editorial dek in serif italic, set in 22px Cormorant,     |
|      max-width 560px. Lets the model speak for herself."                 |
|                                                                          |
|  -----------------------------------                                     |
|                                                                          |
|  O MNĚ                                                                   |
|  Body bio paragraph in 18px serif, line-height 1.65, max-width 640px.   |
|  Two short paragraphs. No bullet lists here.                             |
|                                                                          |
|  -----------------------------------                                     |
|                                                                          |
|  SLUŽBY                                  [ Zobrazit všech 29 ]          |
|  ( # GFE )  ( # DUO )  ( # OWO )  ( # massage )  ( # dinner-date )      |
|  ( # overnight )  ( # outcall )  ( # travel )                            |
|                                                                          |
|  ( click any chip -> /hashtag/[slug] )                                  |
|                                                                          |
|  -----------------------------------                                     |
|                                                                          |
|  GALERIE                                                                 |
|  +------+ +------+ +------+ +------+                                     |
|  | 4:5  | | 4:5  | | 4:5  | | 4:5  |    masonry grid, click = lightbox  |
|  +------+ +------+ +------+ +------+                                     |
|                                                                          |
|  -----------------------------------                                     |
|                                                                          |
|  RECENZE  4.9 (laurel) (laurel)                                          |
|  Single oversized pull-quote in italic serif, attribution below.        |
|  Optional 2-3 short cards underneath.                                    |
|                                                                          |
|  -----------------------------------                                     |
|                                                                          |
|  PODOBNÉ MODELKY                                                         |
|  4 portrait cards (4:5), name + age, hover scale 1.02                    |
|                                                                          |
+--------------------------------------------------------------------------+
```

### Section-by-section rationale

**Top bar (56px tall, no border)**: Logo wordmark left, 3 nav items + language pill right. Background #0A0A0A with a 1px gold hairline at the bottom on scroll.

**Breadcrumb (14px, white 50%)**: removes the "I'm lost" feeling. NYT/Vogue editorial always tells you what column you're in.

**Hero photo (Source 1, 2, 8)**: 4:5 portrait aspect (fashion PDP standard), left column ~62% of width. NO text overlay on the photo. NO huge name above the photo (Airbnb principle — let the photo speak, the H1 stays quiet). Below the photo: a horizontal thumbnail strip (6 thumbs + "+N" overflow), 64×80 each, 8px gap, opens lightbox.

**Sticky right card (Source 1, 10)**: ONE card only — replaces the current 4 stacked cards (Vzhled / Služby / Lokace / Jazyky). Top section = availability + pricing + CTA. Bottom section = "Rychlá fakta" condensed stat block. Border `1px solid rgba(255,255,255,0.06)`, padding 24px, rounded 12px, sticky from `top: 96px`. On mobile this becomes a sticky bottom bar with just the CTA + price (Airbnb pattern).

**Name block (Source 3, 7)**: 72px Cormorant Garamond, regular weight (not bold — Vogue uses thin weights at large sizes). Sits BELOW the photo, not overlapping it on this version — but can be promoted to overlap the photo edge later for an even more editorial feel. Gold availability dot (8px) animated pulse next to the name. Meta line under the name in 14px tracked uppercase white-60%.

**Meta strip (Source 10) — REPLACES the stat-tile grid**: One line, mid-dot separators, all stats. `170 cm · 47 kg · 24 let · brunetka · hnědé oči · 90-60-90 · CZ/EN/RU`. Scannable in <1 second. This is the single biggest WordPress-killer in the redesign.

**Bio (Source 3)**: 18px serif, 1.65 line-height, max-width 640px (the "narrow column" magazine rule). Two short paragraphs max. The editorial dek (one italic line above) is the pull-quote moment.

**Services tags (Source 4)**: Outline pills with `#` prefix. Default = `border: 1px solid rgba(201, 168, 117, 0.4)`, text white-80%. Hover/active = `background: #C9A875`, text #0A0A0A. 8 chips visible, then "Zobrazit všech 29" expands inline (no modal — modals feel WordPress). Each chip = `<Link href="/hashtag/[slug]">`.

**Hashtags on the page (Source 4, 9)**: Live in the SERVICES block, not duplicated elsewhere. The `#` symbol is enough visual signal — no extra "tag" label needed. Sub-categorization (Erotika / Doprovod / Speciální) shown as small uppercase section headers above small chip groups if list is huge.

**Gallery (Source 2, 8)**: 4-col masonry on desktop, 2-col on mobile, all 4:5 portrait crops. Click → fullscreen lightbox with arrows + ESC + swipe. Photos slightly desaturate by 10% to unify with the dark canvas (Vogue trick).

**Reviews (Source 3)**: Single oversized italic pull-quote, 28px serif italic, max-width 720px, centered. Smaller review cards underneath only if there are 3+. Rating shown as "4.9" in 64px display weight with two thin laurel ornaments (Airbnb principle — when one stat matters, make it huge).

**Similar models footer (Source 2)**: 4 portrait cards 4:5, name + age below, very subtle hover lift. No prices in cards — keep cards quiet, drive curiosity.

### What we explicitly DROP from the current design
- 6-tile "Vzhled" stat grid → replaced by one meta strip
- 4 stacked sidebar cards (Vzhled / Služby / Lokace / Jazyky) → consolidated into ONE sticky card
- Square 1:1 photos → 4:5 portrait
- Bold sans-serif H1 over the photo → quiet 22px H1, big serif name below
- "Zobrazit více" buttons inside every section → only ONE "Zobrazit všech 29 služeb" expand, inline, no modal
- Pure black #000 background → #0A0A0A charcoal (Source 6)
- Bright primary accent → warm champagne gold #C9A875

### Token cheat-sheet
```
--bg:           #0A0A0A
--surface:      #161616
--surface-2:    #1F1F1F  (hover)
--border:       rgba(255,255,255,0.06)
--border-gold:  rgba(201,168,117,0.4)
--text:         #F2F0EC  (warm white, not pure white)
--text-muted:   rgba(242,240,236,0.6)
--text-faint:   rgba(242,240,236,0.4)
--accent:       #C9A875
--accent-hover: #D8B888
--radius-card:  12px
--radius-pill:  999px
--font-display: 'Cormorant Garamond', serif
--font-body:    'Inter', 'Geist', sans-serif
--font-serif:   'Cormorant Garamond', serif  (for bio)
--gap-band:     96px  (between major sections desktop)
--gap-band-sm:  56px  (mobile)
```

---

## Sources
- [Airbnb design system breakdown - VoltAgent](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md)
- [Luxury Hotel Website Design - Mediaboom](https://mediaboom.com/news/luxury-hotel-website-design/)
- [NYTimes Magazine redesign - It's Nice That](https://www.itsnicethat.com/features/gail-bichler-the-new-york-times-magazine-redesign-publication-spotlight-080426)
- [What Font Does Vogue Use - DesignYourWay](https://www.designyourway.net/blog/what-font-does-vogue-use/)
- [Badges vs Chips vs Tags vs Pills - Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/)
- [Profile page inspiration - Muzli](https://muz.li/inspiration/profile-page/)
- [Dark mode inspiration - Muzli](https://muz.li/inspiration/dark-mode/)
- [Editorial Layout - Awwwards](https://www.awwwards.com/inspiration/editorial-layout)
- [Best 21 Fashion PDP Examples 2024 - Commerce UI](https://commerce-ui.com/insights/best-21-fashion-pdp-examples-in-2024)
- [Image Gallery Overlay examples - Baymard](https://baymard.com/ecommerce-design-examples/42-image-gallery-overlay)
- [Elite Escort Directory Case Study 2024 - Behance](https://www.behance.net/gallery/196585167/Elite-Escort-Directory-Case-Study-2024)
- [Hotel Website Design Best Practices - Cloudbeds](https://www.cloudbeds.com/articles/hotel-website-design/)

Direct fetches blocked (Cloudflare / ECONNREFUSED): mynt-models.com, companionsofparis.com, secret-escorts.com, eros.com, preferred411.com, gfecity.com — observations on those are inferred from established patterns above.
