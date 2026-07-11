# TASK-013: QA — Styl & Šatník

**Datum:** 2026-06-23
**Kontrolor:** kontrolor

---

## 1. Simplify kontrola

### lib/db.ts — migrace

```sql
'ALTER TABLE girls ADD COLUMN style_wardrobe TEXT DEFAULT NULL',
```

Přidáno jako poslední migrace v `runMigrations()`. Idempotentní (try/catch ignoruje "column already exists"). ✅

### lib/queries.ts — updateGirlById()

`GirlUpdateData` interface má `style_wardrobe?: string | null` (řádek 1033). SQL UPDATE na řádku 1051 správně obsahuje `style_wardrobe=?` a v args `data.style_wardrobe ?? null`. ✅

`getGirlBySlug()` používá `SELECT g.*` — automaticky vrátí nový sloupec. ✅
`getGirlById()` používá `SELECT * FROM girls` — taktéž. ✅

### lib/admin-actions.ts — 3 místa

**updateGirl() (admin edit):**
```ts
style_wardrobe: (() => {
  const styleTypes = formData.getAll('style_types').map(String).filter(Boolean);
  const wardrobeItems = formData.getAll('wardrobe_items').map(String).filter(Boolean);
  return (styleTypes.length > 0 || wardrobeItems.length > 0)
    ? JSON.stringify({ style: styleTypes, wardrobe: wardrobeItems })
    : null;
})(),
```
Správné. Pokud admin nezaškrtne nic → uloží `null` (vymaže data). ✅

**createGirl() (nová dívka z admin):**
Identická logika — stejný IIFE pro style_wardrobe. ✅

**convertApplicationToGirl():**
```ts
const styleWardrobe = app.style_wardrobe != null ? String(app.style_wardrobe) : null;
// ... INSERT INTO girls (..., style_wardrobe, ...) VALUES (... ?, ...)
args: [..., styleWardrobe]
```
Přenos z přihlášky do profilu správně implementován. ✅

### app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx — SEKCE 6

- `styleWardrobeRaw` čte `gr.style_wardrobe` z DB (řádek 429)
- Parsuje JSON do `activeStyles` a `activeWardrobe` Sets
- Checkbox `defaultChecked={activeStyles.has(s.id)}` / `defaultChecked={activeWardrobe.has(s.id)}`
- Form field names: `style_types` (multi-value) a `wardrobe_items` (multi-value)

STYLE_OPTIONS (9 možností): elegant, casual, sporty, glamour, minimalist, romantic, streetwear, business, bohemian ✅
WARDROBE_OPTIONS (14 možností): lingerie, stockings, high_heels, boots, latex, leather, corset, bodystocking, costume, nurse, schoolgirl, maid, secretary, swimwear ✅

**Porovnání s přihláškou (`app/[locale]/join/page.tsx`):**
Přihláška používá `wardrobe_item` (singulár), admin edit používá `wardrobe_items` (plurál) — ale to je OK, jsou to různé formy s různými Server Actions. ✅

**Porovnání hodnot ID:**
Přihláška má `swimwear` — admin edit má `swimwear` ✅. Konzistentní IDs.

**Chybí styl v přihlášce:** `sporty` je v admin edit ale **NEní** v přihlášce join formě (ta má Elegantní, Casual, Glamour, Minimalistický, Romantický, Streetwear, Business, Bohémský — bez Sportovní). Minor inconsistency, ale non-blocker (admin může doplnit ručně).

### components/profil/ProfilHero.tsx — mobile inline block

`styleWardrobe` prop (řádek 114) přijat, rendering na řádku 355-:
- `JSON.parse()` s try/catch — bezpečné
- Null/empty check — vrátí null pokud prázdné
- `STYLE_LABELS` a `WARDROBE_LABELS` lokalizované do cs/en/de/uk pro každý key
- CSS: `.ig-styl-chip-style` a `.ig-styl-chip-wardrobe` — ve `globals.css` přítomny ✅

### components/profil/ProfilDetails.tsx — desktop block

`styleWardrobe` prop přijat (řádek 383 v profil page). Rendering na řádku 381-:
- Identická logika jako ProfilHero — samostatná kopie (né sdílená komponenta)
- CSS: `.mini-chip-style` a `.mini-chip-wardrobe` — ve `globals.css` přítomny ✅
- `.profile-desktop-only` class — desktop only ✅

**Poznámka — duplikace parsovací logiky:**
`ProfilHero` a `ProfilDetails` oba samostatně parsují `styleWardrobe` JSON a definují `STYLE_LABELS`/`WARDROBE_LABELS`. Jde o ~60 řádků zdvojeného kódu. Non-blocker (inline pattern konzistentní s ostatním kódem v projektu), ale kandidát na extrakci do utility funkce.

### app/[locale]/profil/[slug]/page.tsx

Na řádcích 377-380 a 406-409 — `styleWardrobe` předáváno do obou komponent přes `g.style_wardrobe`. Používá `unknown` cast (existující pattern v tomto souboru). ✅

---

## 2. Debug kontrola

### TypeScript
```
npx tsc --noEmit → pouze 3 pre-existing chyby v e2e/tests/full-test.spec.ts
```
Produkční kód bez chyb. ✅

### Build
Žádné nové strukturální změny které by rozbily build. SQL query strings jsou runtime, nekontroluje je TS.

---

## 3. Reverzní kontrola vs zadání

Původní zadání: "tohle tam vubec není ani v admin panelu když se upravuje profil, ani na profilu jako takovym a má to tam bejt"

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Veřejný profil zobrazuje Styl & Šatník | ✅ | ProfilHero (mobile) + ProfilDetails (desktop) |
| 2 | Admin editace umožňuje editovat Styl & Šatník | ✅ | SEKCE 6 v edit/page.tsx s checkboxy |
| 3 | girls tabulka má sloupec style_wardrobe | ✅ | Migrace v db.ts, řádek 43 |
| 4 | Konverze přihlášky → profil přenáší style_wardrobe | ✅ | convertApplicationToGirl() řádek 339+349 |
| 5 | Admin může vymazat style_wardrobe (unchecknout vše) | ✅ | Pokud nic nezaškrtne, ukládá null |
| 6 | Lokalizace: cs/en/de/uk labely | ✅ | STYLE_LABELS i WARDROBE_LABELS v obou komponentách |
| 7 | Zobrazuje se podmíněně (jen pokud jsou data) | ✅ | Null check před renderem |

---

## Závěr

### Blokery
Žádné.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | `sporty` styl chybí v přihlášce (join formě), ale je v admin edit | Velmi nízká |
| 2 | Parsovací logika + LABELS objekty zdvojeny v ProfilHero i ProfilDetails (~60 řádků) | Nízká |

### Verdikt
**PASS** — všechny 3 požadavky ze zadání splněny: (1) zobrazení na profilu, (2) editace v adminu, (3) migrace `girls.style_wardrobe` + přenos z přihlášky. TypeScript čistý.
