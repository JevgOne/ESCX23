# TASK-013 QA Report — Opening dates implementace

**Datum:** 2026-06-02
**Kontrolor:** kontrolor
**Build status:** PASS (clean, no TS errors, no build errors)

---

## 1. Simplify kontrola

### Duplicita: `formatOpeningDate` existuje na dvou místech

**Nález:** Identická funkce `formatOpeningDate` je definována dvakrát:
- `components/home/LocationsRow.tsx:24-33`
- `app/[locale]/pobocka/[slug]/page.tsx:270-279`

Obě funkce jsou 1:1 stejné (stejná logika, stejný výstup). Jedna z nich by měla být přesunuta do `lib/utils.ts` a importována oběma soubory.

**Závažnost:** ⚠️ Minor (DRY violation, ale nefunkční bug to není)

### Vše ostatní je přiměřeně jednoduché

- `isPreparing` logika je čitelná a přímočará
- Filtrace `openLocations` v rozvrh/page.tsx je jednoduchá a správná
- Admin akce jsou jasné

---

## 2. Debug kontrola

### TypeScript: PASS
```
npx tsc --noEmit → žádný výstup (clean)
```

### Build: PASS
```
npx next build → success, všechny stránky kompilují
```

### Potenciální runtime issue: `revalidate = 3600` na pobočka detail page

**Nález:** `app/[locale]/pobocka/[slug]/page.tsx:14` má `revalidate = 3600` (ISR 1 hodina).
Stránka ale zobrazuje `isUpcoming` banner na základě `pragueDateISO()` — tedy dnešního data.

**Problém:** Přesně v den otevření (18.6. nebo 25.7.) může stránka ještě až hodinu zobrazovat "opening soon" banner, i když lokace je již otevřena. To je hraniční případ — ISR je pro pobocka stránku OK dle CLAUDE.md, ale je to věc k zvážení.

**Závažnost:** ⚠️ Minor (akceptovatelné, ale vedení by mělo vědět)

### Transliterace místo skutečné češtiny/ukrajinskujiny v SEO textech

**Nález:** `lib/seo/landing-content.ts` — pro CS locale jsou texty bez diakritiky (transliterované):
- `'Apartman Zizkov Praha 3 — novy diskretni privat...'` (chybí háčky/čárky)
- `'Novy apartman LovelyGirls na Zizkove...'`

Pro UK locale jsou texty transliterací latinkou místo skutečné cyrilice:
- `'Apartament Zhyzhkov Praga 3 — novyj dyskretnyj...'`
- `'Novyj apartament LovelyGirls na Zhyzhkovi...'`

Pro kontrast — `vinohrady` v tom samém souboru má správnou češtinu s diakritikou a správnou cyrilici.

**Závažnost:** ❌ Bug — SEO meta description a intro texty pro Praha-3 a Praha-5 jsou v nesprávném formátu. Google indexuje tyto texty.

### openingBanner UK/CS text v pobocka/[slug]/page.tsx také bez diakritiky

**Nález:** `app/[locale]/pobocka/[slug]/page.tsx:264-268`:
```ts
cs: { title: 'Novy apartman — otevíráme brzy!', ...  // "Novy" bez diakritiky
uk: { title: 'Novyj apartament — nezabarom vidkryttya!', ...  // transliterace místo cyrilice
uk: { ..., datePrefix: 'Planovane vidkryttya' }  // transliterace místo cyrilice
```

**Závažnost:** ❌ Bug — uživatel vidí latinkou transliterovaný text místo češtiny/ukrajinskujiny

---

## 3. Reverzní kontrola — plán vs. implementace

| Krok plánu | Status | Poznámka |
|---|---|---|
| Step 1: DB migration (opening_date sloupec) | ✅ | Přidán, data nastavena |
| Step 1: queries.ts — Location interface + getActiveLocations | ✅ | openingDate přidán do obou funkcí |
| Step 1: getLocationBySlug | ✅ | openingDate správně vrácen |
| Step 2: LocationsRow — odstraněn hardcoded preparingSlugs | ✅ | Nahrazeno date-based logikou |
| Step 2: Praha timezone via pragueDateISO() | ✅ | Správně použito |
| Step 2: Zobrazení datumu u "Otevíráme" badge | ✅ | Formát "Otevíráme · 18.6." funguje |
| Step 2: PREPARING_LABEL → OPENING_LABEL s novými texty | ✅ | Texty odpovídají (Otevíráme/Opening/Eröffnung/Відкриття) |
| Step 3: Rozvrh — filtrace ne-otevřených lokací | ✅ | openLocations filtr v rozvrh/page.tsx:136 |
| Step 4: Pobocka detail — opening banner | ✅ | Banner implementován s party emoji |
| Step 4: i18n labels pro banner | ❌ Částečně | CS/UK texty bez diakritiky/cyrilice (viz Bug výše) |
| Step 5: Admin list — opening_date sloupec | ✅ | Přidán |
| Step 5: Admin edit — date input field | ✅ | Přidán s helper textem |
| Step 5: Admin nova — date input field | ✅ | Přidán |
| Step 5: admin-actions — createPobocka + updatePobocka | ✅ | opening_date zpracován |
| Step 6: CSS pro opening banner | ✅ | Styly přidány do globals.css |
| Step 7: SEO landing content pro Praha-3 | ❌ Částečně | Existuje, ale bez diakritiky/cyrilice |
| Step 7: SEO landing content pro Praha-5 | ❌ Částečně | Existuje, ale bez diakritiky/cyrilice |
| Step 8: Footer — "brzy/soon/bald/скоро" suffix | ✅ | Implementováno správně, s cyrilicí pro UK |

---

## Souhrn nálezů

| # | Typ | Závažnost | Popis |
|---|---|---|---|
| 1 | Duplicita | ⚠️ Minor | `formatOpeningDate` definován 2x (LocationsRow + pobocka page) |
| 2 | Cache | ⚠️ Minor | pobocka/[slug] má ISR 1h — den otevření banner může přetrvat hodinu |
| 3 | Bug | ❌ Medium | SEO texty Praha-3/Praha-5 v CS bez háčků/čárek |
| 4 | Bug | ❌ Medium | SEO texty Praha-3/Praha-5 v UK transliterací latince místo cyrilice |
| 5 | Bug | ❌ Medium | openingBanner CS "Novy apartman" bez diakritiky |
| 6 | Bug | ❌ Medium | openingBanner UK celý transliterací místo cyrilice |

---

## Doporučení

**Musí být opraveno (blocker pro produkci):**
- Opravit CS texty v `lib/seo/landing-content.ts` pro 'praha-3' a 'praha-5' — přidat diakritiku
- Opravit UK texty — nahradit latinkou transliteraci skutečnou cyrilikou
- Opravit CS/UK texty v `openingBanner` v `pobocka/[slug]/page.tsx`

**Vhodné opravit:**
- Extrahovat `formatOpeningDate` do `lib/utils.ts` — odstranit duplicitu

**Akceptovatelné (bez akce):**
- ISR 1h na pobocka detail — hraniční případ jednou za 1-2 roky při otevření
