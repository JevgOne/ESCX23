# QA Report — Task #3: Kritické SEO bugy (BUG-1 až BUG-4)

**Datum:** 2026-09-03
**Kontrolor:** kontrolor agent
**Zadání:** Review implementace BUG-1, BUG-2, BUG-3, BUG-4 z TASK-012

---

## 1. Simplify — čistota kódu

### `app/[locale]/blog/page.tsx`
- Kód je čistý, žádný zbytečný kód
- `languages` objekt v `alternates` má všechny 4 lokalizace: `en`, `cs`, `de`, `uk` + `x-default` — OK
- Logika hreflang je přímočará, bez duplicit

### `app/[locale]/novinky/page.tsx`
- Kód je čistý, importy jsou všechny využity
- `openGraph` objekt obsahuje `url: canonical` — OK
- Používá helper funkce z `@/lib/seo/meta` (DRY princip dodržen)

### `app/llms.txt/route.ts`
- Čistý route handler, žádný dead code
- Dynamický obsah (apartments, facts) čten z DB — správně

### Env soubory
- GOOGLE_REDIRECT_URI bez trailing `\n` ve všech opravených souborech — OK

**Simplify verdict: PASS**

---

## 2. Debug — technické ověření

### TypeScript check (`npx tsc --noEmit`)
- **Produkční kód: 0 chyb** ✅
- Jedina chyba: `e2e/tests/full-test.spec.ts(26)` — `'sidebarText' is possibly 'null'`
  - Toto je v E2E testovacím souboru, NE v produkčním kódu
  - **Netýká se implementace BUG-1 až BUG-4**

### BUG-1: Blog hreflang — ověření

Soubor `app/[locale]/blog/page.tsx`, řádky 27–33:
```
languages: {
  en: `${BASE}/blog`,
  cs: `${BASE}/cs/blog`,
  de: `${BASE}/de/blog`,
  uk: `${BASE}/uk/blog`,
  'x-default': `${BASE}/blog`,
},
```
- Přítomny: `en` ✅, `cs` ✅, `de` ✅, `uk` ✅, `x-default` ✅
- **BUG-1: OPRAVENO ✅**

### BUG-2: Novinky og:url — ověření

Soubor `app/[locale]/novinky/page.tsx`, řádky 34–41:
```
openGraph: {
  images: ogImages,
  title: t('h1'),
  description: t('lead'),
  url: canonical,       ← přítomno
  locale: ogLocale(locale),
  type: 'website',
},
```
- `url: canonical` přítomno ✅
- `canonical` je správně generován přes `getCanonicalUrl(locale, '/novinky')` ✅
- **BUG-2: OPRAVENO ✅**

### BUG-3: GOOGLE_REDIRECT_URI — ověření env souborů

| Soubor | Hodnota | Status |
|--------|---------|--------|
| `.env.prod-check.local:6` | `https://www.lovelygirls.cz/api/gcal/callback` | ✅ |
| `.env.vercel-prod.local:6` | `https://www.lovelygirls.cz/api/gcal/callback` | ✅ |
| `.env.prod-pull.local:6` | `https://www.lovelygirls.cz/api/gcal/callback` | ✅ |
| `.env.prod-pulled.local:6` | `https://www.lovelygirls.cz/api/gcal/callback` | ✅ |
| `.env.blob:6` | `https://www.lovelygirls.cz/api/gcal/callback` | ✅ |

- Žádný soubor neobsahuje starou `escx23.vercel.app` URL
- Žádný soubor neobsahuje trailing `\n`
- **BUG-3: OPRAVENO ✅**

### BUG-4: llms.txt — ověření existence

- Soubor `app/llms.txt/route.ts` existuje ✅
- Route handler vrací `text/plain; charset=utf-8` ✅
- Obsah: kompletní site mapa pro AI crawlery (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended) ✅
- Dynamický obsah z DB (apartments, districts) ✅
- Cache headers: `max-age=3600` ✅
- **BUG-4: OPRAVENO ✅**

**Debug verdict: PASS**

---

## 3. Reverzní kontrola — zadání vs. implementace

| Bug | Zadání (TASK-012-full-web-audit.md §2.1) | Implementace | Shoda |
|-----|------------------------------------------|--------------|-------|
| BUG-1 | Přidat `de` a `uk` hreflang do blog listing | `de` + `uk` přítomny v `languages` | ✅ |
| BUG-2 | Přidat `url: canonical` do novinky OG metadata | `url: canonical` v `openGraph` | ✅ |
| BUG-3 | Opravit GOOGLE_REDIRECT_URI ve 4 env souborech (escx23→lovelygirls, odstranit `\n`) | 4+ souborů opraveno, správná URL | ✅ |
| BUG-4 | Vytvořit llms.txt (route handler nebo static file) | `app/llms.txt/route.ts` existuje | ✅ |

**Reverzní kontrola verdict: PASS**

---

## Celkový výsledek

| Kontrola | Výsledek |
|----------|----------|
| 1. Simplify | PASS ✅ |
| 2. Debug | PASS ✅ (TS chyba jen v e2e testech) |
| 3. Reverzní kontrola | PASS ✅ |

**CELKOVÝ VERDICT: APPROVED — všechny 4 kritické SEO bugy jsou správně implementovány.**

### Poznámky
- TS chyba v `e2e/tests/full-test.spec.ts:26` (`sidebarText possibly null`) nesouvisí s touto implementací a může být adresována samostatně
- Blog page správně redirectuje de/uk locale na /blog (řádky 63–66) — konzistentní s hreflang nastavením
