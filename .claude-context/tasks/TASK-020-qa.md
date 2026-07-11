# TASK-020 / TASK-5xx / TASK-sitemap: QA — SEO, redirecty, 5xx opravy

**Datum:** 2026-07-06
**Kontrolor:** kontrolor
**Scope:** Reverzní kontrola plánů vs. aktuální stav kódu

---

## Přehled: Co bylo naplánováno vs. co je implementováno

Tři plány z 2026-06-23:
- `TASK-020-redirects-plan.md` — redirect mapa stare URL → nove URL
- `TASK-5xx-analysis.md` — opravy applyDBOverride + not-found.tsx + blog render
- `TASK-sitemap-cleanup-plan.md` — zredukovat sitemap, noindex thin pages

---

## 1. Simplify kontrola

### Redirecty v next.config.ts

Implementovány. Struktura: specifické redirecty před wildcard `/cz/:path*`. Pořadí správné. ✅

**Odchylka od plánu:** `/cs/landing/escort-praha` v plánu cílí na `/cs/hashtag/spolecnice-praha`, v implementaci cílí na `/cs/divky`. Minor — oba cíle jsou smysluplné, `/cs/divky` je přijatelnější jako landing pro nové uživatele.

**BUG (střední):** Řádek 85:
```ts
{ source: '/escort-prague', destination: '/girls', permanent: true },
```
Cíl `/girls` **neexistuje** — není žádná route ani redirect na tuto URL. Výsledek: redirect z `/escort-prague` → 404. Mělo by být `/cs/divky` nebo `/en/profile`.

### Sitemap (app/sitemap.ts)

- `HASHTAG_SLUGS` zredukovány na 8 (jen s HASHTAG_CONTENT) ✅ — plán implementován
- Blog generuje jen `['en', 'cs']` locale varianty ✅ — plán implementován
- Komentář v kódu vysvětluje proč — čistá dokumentace ✅

### not-found.tsx

`app/[locale]/not-found.tsx` **EXISTS** ✅ — vytvoření proběhlo. Obsah:
- Lokalizace ze 4 jazyků (cs/en/de/uk) ✅
- Detekce locale z `x-next-url` header ✅
- Odkaz zpět na homepage ✅

### Thin hashtag noindex

`app/[locale]/hashtag/[slug]/page.tsx` řádek 103:
```ts
robots: { index: !!content, follow: true },
```
✅ Implementováno — thin hashtagy (bez HASHTAG_CONTENT) dostanou `noindex`.

---

## 2. Debug kontrola

### TypeScript

```
npx tsc --noEmit → 3 chyby POUZE v e2e/tests/full-test.spec.ts (pre-existing)
```
Produkční kód bez chyb. ✅

### Otevřené 5xx rizikové body — NEIMPLEMENTOVÁNO

Plán `TASK-5xx-analysis.md` identifikoval konkrétní opravy. Kontrola aktuálního kódu:

| Route | applyDBOverride try/catch | Status |
|-------|--------------------------|--------|
| `app/[locale]/page.tsx:52` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/profil/[slug]/page.tsx:117` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/pobocka/[slug]/page.tsx:289` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/hashtag/[slug]/page.tsx:83` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/blog/[slug]/page.tsx:39` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/divky/page.tsx:29` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/rozvrh/page.tsx:105` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/cenik/page.tsx:54` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/slevy/page.tsx:53` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |
| `app/[locale]/faq/page.tsx:52` | BEZ try/catch | ❌ NEIMPLEMENTOVÁNO |

Hotovo (dle plánu je tato jediná):
| `app/[locale]/sluzba/[slug]/page.tsx` | V try/catch ✅ | OK |

**`lib/db.ts:99` — runMigrations fire-and-forget:** NEIMPLEMENTOVÁNO ❌
```ts
runMigrations(db).catch(() => {});  // stale — nebyl změněn
```

**blog/[slug] render — getBlogPostBySlug bez .catch():**
```ts
// řádek 141 — NEIMPLEMENTOVÁNO ❌
const post = await getBlogPostBySlug(slug, locale);
// řádek 145 — NEIMPLEMENTOVÁNO ❌
getRelatedBlogPosts(post.id, locale, 3),  // bez .catch()
```

### Blog DE/UK noindex — NEIMPLEMENTOVÁNO ❌

Plan (TASK-sitemap-cleanup-plan.md ZMENA 4) doporučoval přidat noindex pro DE/UK blog varianty bez překladu.

Aktuální stav (`app/[locale]/blog/[slug]/page.tsx` řádek 74-80):
```ts
robots: {
  index: true,  // vždy true pro všechny locale — CHYBÍ DE/UK noindex
  follow: true,
  ...
},
```
DE a UK blog stranky stale indexovane i kdyz zobrazuji CS fallback.

---

## 3. Reverzní kontrola vs. plán

### TASK-020 redirecty

| Položka | Plán | Status |
|---------|------|--------|
| /cs/girls/:slug → /cs/profil/:slug | Implementováno | ✅ |
| /cs/profily/:slug → /cs/profil/:slug | Implementováno | ✅ |
| /cz/profiles, /cs/profiles → /cs/divky | Implementováno | ✅ |
| Landing pages (10 URL) | Implementováno | ✅ (cíle se mírně liší) |
| blog-cs/:slug, blogs-cz/:slug | Implementováno | ✅ |
| /cz/main, /cs/main → /cs/ | Implementováno | ✅ |
| /cz/pricing, /cs/pricing → /cs/cenik | Implementováno | ✅ |
| /cz/:path* wildcard | Implementováno | ✅ |
| WordPress era (bdsm, author) | Implementováno | ✅ |
| Sitemap XMLs | Implementováno | ✅ |
| **/escort-prague → /girls (404 cíl!)** | BUG | ❌ |

### TASK-5xx opravy

| FIX | Popis | Status |
|-----|-------|--------|
| FIX 1 (P0) | applyDBOverride try/catch ve všech generateMetadata | ❌ NEIMPLEMENTOVÁNO |
| FIX 2 (P0) | Přidat not-found.tsx | ✅ IMPLEMENTOVÁNO |
| FIX 3 (P1) | blog/[slug] render .catch() | ❌ NEIMPLEMENTOVÁNO |
| FIX 4 (P1) | runMigrations → await | ❌ NEIMPLEMENTOVÁNO |

### TASK-sitemap-cleanup

| ZMENA | Popis | Status |
|-------|-------|--------|
| ZMENA 1 (P0) | Zredukovat HASHTAG_SLUGS na 8 | ✅ IMPLEMENTOVÁNO |
| ZMENA 2 (P1) | Blog jen CS+EN v sitemap | ✅ IMPLEMENTOVÁNO |
| ZMENA 3 (P1) | Noindex thin hashtag stranky | ✅ IMPLEMENTOVÁNO |
| ZMENA 4 (P1) | Noindex blog DE/UK bez překladu | ❌ NEIMPLEMENTOVÁNO |
| ZMENA 5 (P2) | Snížit prioritu DE/UK v sitemap | Nevyžadováno ihned |

---

## Závěr

### Blokery

| # | Nález | Soubor:řádek | Závažnost |
|---|-------|-------------|-----------|
| 1 | `/escort-prague` redirect cílí na `/girls` (neexistující route → 404) | `next.config.ts:85` | **BLOKER** |
| 2 | `applyDBOverride()` není v try/catch v 10 generateMetadata funkcích — způsobuje 32 × 5xx v GSC | všechny pages | **BLOKER (P0)** |

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | `getBlogPostBySlug` v blog/[slug] render bez `.catch()` — při DB timeoutu = 500 místo 404 | Střední |
| 2 | `runMigrations` fire-and-forget v lib/db.ts — race condition při cold startu | Střední |
| 3 | Blog DE/UK noindex chybí — duplicitní obsah signál pro Google | Nízká |
| 4 | e2e TypeScript chyby (3× sidebarText possibly null) — pre-existing | Existující |

### Verdikt
**PARTIAL PASS** — Sitemap cleanup a not-found.tsx implementovány správně. Redirecty implementovány s jedním bugem (/escort-prague → /girls → 404). Hlavní P0 opravy z TASK-5xx (applyDBOverride try/catch) NEBYLY implementovány — 32× 5xx v GSC Coverage přetrvává.

### Doporučení pro implementátora

**P0 — opravit `/escort-prague` redirect:**
```ts
// PRED:
{ source: '/escort-prague', destination: '/girls', permanent: true },
// PO:
{ source: '/escort-prague', destination: '/en/profile', permanent: true },
// nebo:
{ source: '/escort-prague', destination: '/cs/divky', permanent: true },
```

**P0 — applyDBOverride try/catch (vzor):**
```ts
// Ve všech generateMetadata funkcích:
try {
  return await applyDBOverride(`/${locale}/...`, { title, description, ... });
} catch {
  return { title, description, ... };
}
```
Soubory k upravit: page.tsx, profil/[slug]/page.tsx, pobocka/[slug]/page.tsx, hashtag/[slug]/page.tsx, blog/[slug]/page.tsx, divky/page.tsx, rozvrh/page.tsx, cenik/page.tsx, slevy/page.tsx, faq/page.tsx
