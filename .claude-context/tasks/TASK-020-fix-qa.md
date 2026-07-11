# TASK-020-fix: QA — Ověření 2 fixů (redirect + applyDBOverride)

**Datum:** 2026-07-06
**Kontrolor:** kontrolor

---

## Fix 1: `/escort-prague` redirect

### Aktuální stav

`next.config.ts:85`:
```ts
{ source: '/escort-prague', destination: '/en/girls', permanent: true },
```

### Ověření cíle `/en/girls`

**Existuje `/en/girls` jako validní URL?**

`i18n/routing.ts` definuje pathnames:
```ts
'/divky': {
  cs: '/divky',
  en: '/girls',    ← EN překlad /divky je /girls
  de: '/maedchen',
  uk: '/divchata',
},
```

`defaultLocale: 'en'` + `localePrefix: { mode: 'as-needed' }` → EN locale **nemá prefix**.

Tedy:
- EN URL pro /divky je: `https://www.lovelygirls.cz/girls` (BEZ `/en/` prefixu)
- `/en/girls` → next-intl to vezme jako request pro locale `en` s path `/girls` → přeloží zpět na `/divky` → **funguje jako 200**, ale URL v adresním řádku bude `/en/girls`

**Verdict na funkcionalitu:** Technicky funguje (next-intl přijme `/en/girls`), ale kanonická EN URL je `/girls` bez prefixu. Redirect posílá uživatele na ne-kanonické URL.

**Lepší cíl by byl `/girls`** (bez `/en/` prefixu) — to je skutečná kanonická EN URL. Ale `/en/girls` **nezpůsobí 404** — pouze suboptimální URL.

**Oproti původnímu bugu (`/girls` → 404):** FIX je platný — 404 je vyřešeno. ✅

### Kontrola ostatních redirect destinations

Žádné jiné destination necílí na neexistující route:

| Destination | Existuje? |
|-------------|-----------|
| `/cs/profil/:slug` | ✅ |
| `/cs/divky` | ✅ |
| `/cs/hashtag/spolecnice-praha` | ✅ |
| `/cs/hashtag/blondynky-praha` | ✅ |
| `/cs/hashtag/brunetky-praha` | ✅ |
| `/cs/hashtag/gfe-praha` | ✅ |
| `/cs/hashtag/studentky-praha` | ✅ |
| `/cs/pobocka/praha-2` | ✅ |
| `/cs/pobocka/praha-3` | ✅ |
| `/cs/rozvrh` | ✅ |
| `/cs/` | ✅ |
| `/cs/blog/:slug` | ✅ |
| `/cs/blog` | ✅ |
| `/cs/cenik` | ✅ |
| `/cs/slevy` | ✅ |
| `/cs/faq` | ✅ |
| `/sitemap.xml` | ✅ |
| `/cs/:path*` | ✅ |
| **`/en/girls`** | ✅ (funguje, ale ne-kanonické — viz výše) |

**Žádná 404 destination.** ✅

---

## Fix 2: `applyDBOverride` try/catch

### Aktuální stav `lib/seo/db-override.ts`

```ts
export async function applyDBOverride(
  pagePath: string,
  inlineMetadata: Metadata,
): Promise<Metadata> {
  try {
    const dbSeo = await getSEOMetadata(pagePath);
    if (!dbSeo || (!dbSeo.meta_title && !dbSeo.meta_description)) {
      return inlineMetadata;
    }
    // ... merge logic ...
    return { ...inlineMetadata, ... };
  } catch {
    return inlineMetadata;   ← fallback při jakékoliv chybě
  }
}
```

**Celá funkce je obalená try/catch.** ✅

**`catch` vrací `inlineMetadata`** — správný fallback, generateMetadata dostane původní inline metadata místo výjimky. ✅

**Pokrývá `getSEOMetadata()` volání** (řádek 14) — DB timeout z Turso nebublá nahoru z generateMetadata. ✅

**Scope opravy:** Oprava je na správném místě — v samotné `applyDBOverride` funkci, ne v každém volajícím. Všechny pages které volají `applyDBOverride()` jsou nyní automaticky chráněny bez nutnosti měnit každý page.tsx zvlášť. ✅

---

## TypeScript

```
npx tsc --noEmit → 3 chyby POUZE v e2e/tests/full-test.spec.ts (pre-existing)
```

Produkční kód bez chyb. ✅

---

## Reverzní kontrola vs. zadání

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | `/en/girls` route existuje | ✅ | next-intl přeloží `/en/girls` na EN `/divky` — funguje |
| 2 | Redirect syntakticky správný | ✅ | `permanent: true`, platný objekt |
| 3 | Žádné další redirecty na neexistující routes | ✅ | Všechny destinations ověřeny |
| 4 | applyDBOverride celá funkce v try/catch | ✅ | `try { ... } catch { return inlineMetadata; }` |
| 5 | Fallback vrací inlineMetadata | ✅ | `catch { return inlineMetadata; }` |
| 6 | TypeScript projde | ✅ | Pouze 3 pre-existing e2e chyby |

---

## Závěr

### Blokery
Žádné.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | `/escort-prague` → `/en/girls` funguje, ale kanonická EN URL je `/girls` (bez prefixu). Redirect posílá na ne-kanonické URL — Google může vidět jako zbytečný extra hop `/en/girls` → `/girls`. | Velmi nízká |

### Verdikt
**PASS** — Oba fixy implementovány správně. Bug `/escort-prague` → 404 vyřešen (nový cíl `/en/girls` funguje). `applyDBOverride` je celá obalena try/catch s fallbackem na inlineMetadata — eliminuje 5xx z DB timeoutu v generateMetadata. TypeScript čistý.
