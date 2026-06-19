# TASK-006 — Evžen kontrola shody: Kalendář redesign + dark filter

**Datum:** 2026-06-01
**Kontrolor:** evzen-the-king
**Verdikt:** SCHVALENO (s 1 poznamkou)

---

## Kontrola bod po bodu

### 1. "potřebuju tomu udelat lepší design" — Studio kalendář vizuální upgrade
**SPLNENO** — `app/[locale]/studio/kalendar/page.tsx` obsahuje kompletní redesign:
- Header s jmenem divky + rozsahem datumu (cal-header)
- Legenda s barevnymi teckami (cal-legend: Pracuji/Volno/Dnes)
- 14-denni grid (cal-grid) s kartami pro kazdy den
- Day cards s hover efekty, today highlight (coral accent), off-day pattern
- Shift time bloky se zlatou barvou a lokaci
- Booking badges s barevnym kodovanim (pending/confirmed/done)
- CSS v globals.css radky 7520-7792: kompletni sada ~270 radku novych stylu

### 2. "mužeš dat pryc ty cookie?" — Google Calendar cookie consent
**SPLNENO** — pouziva se embed URL format (`/calendar/embed?src=...`) ktery nema cookie consent. Funkce `toCalendarEmbedUrl()` v `lib/calendar.ts` konvertuje ruzne formaty na embed URL. Embed iframe nepotrebuje souhlas s cookies.

### 3. "ale tu ja nemam" (kreditni kartu) — zadne Google Cloud API
**SPLNENO** — implementace nepouziva zadne Google Cloud API. Zadny API klic, zadny OAuth, zadny googleapis import. Pouze iframe embed.

### 4. "na to abych udelal ten google clud tak potřebuju kreditni kartu" — potvrzeni ze API neni mozne
**SPLNENO** — viz bod 3. Zadne API zavislosti.

### 5. "ted se zrcadli ten google" + "protože tohle nevypada dobře" — bily iframe do dark theme
**SPLNENO** — CSS filter `invert(1) hue-rotate(180deg)` aplikovan na obe mista:
- Studio: `globals.css:7788` — `.cal-google-iframe { filter: invert(1) hue-rotate(180deg); }`
- Admin: `admin/rezervace/page.tsx:181` — inline style `filter: 'invert(1) hue-rotate(180deg)'`
Toto invertuje barvy iframe (bily pozadi → tmavy, tmave texty → svetle) a hue-rotate vraci barvy zpet do priblizne puvodni hue. Standardni technika pro dark mode iframe embedu.

### 6. "ale musí se kalendar otevít u nás" — iframe MUSI zustat, NE odkaz
**SPLNENO** — obe stranky pouzivaji `<iframe>`:
- Studio: `page.tsx:249` — `<iframe src={...} className="cal-google-iframe" />`
- Admin: `page.tsx:177-183` — `<iframe src={cal.embedUrl} style={...} />`
Zadny externi odkaz, zadne otevirani v novem okne. Kalendar se zobrazuje primo na strance.

### 7. "ja potřebuju aby ho používali holky/operator" — holky vidi rozvrh, operator zadava rezervace
**SPLNENO** —
- Studio (`/studio/kalendar`): holka vidi svuj 14-denni rozvrh + Google Calendar embed svuj vlastni
- Admin (`/admin/rezervace`): operator vidi tabulku rezervaci + Google Kalendare VSECH divek (iteruje pres vsechny divky s calendar_embed_url)
Operator muze klikat uvnitr iframe a zadavat rezervace primo v Google Calendar.

### 8. "no a trošku to vylepšit proste at to vypada líp" — celkove lepsi vzhled
**SPLNENO** — viz bod 1. Kompletni vizualni upgrade s:
- Coral accent pro dnesek
- Gold accent pro smeny
- Hover animace na kartach
- Responsive grid (7→3→2 sloupcu)
- Badge system pro booking statusy
- Google Calendar embed zabaleny v kartu s rounded corners a shadow

---

## Poznamka (informativni, NEBLOKUJE schvaleni)

Admin rezervace (`page.tsx:181`) pouziva inline style pro dark filter, zatimco studio pouziva CSS tridu. Toto je kosmeticka nekonzistence — funkcne je vse v poradku. Pripadna refaktorizace na CSS tridu i v adminu by byla cistsi, ale neni nutna.

---

## Zaver

**SCHVALENO** — Implementace odpovidajici vsem 8 bodum zadani od uzivatele. Iframe zachovan (ne odkaz), dark mode filter aplikovan, zadne Google Cloud API, vizualni upgrade proveden. Vse v souladu s doslovnym zadanim.
