# QA Report: Fix middleware x-pathname (Task #4 → #5)

**Datum:** 2026-08-30  
**Kontrolor:** kontrolor  
**Soubory:** `middleware.ts`, `components/LanguageSwitcher.tsx`

---

## 1. Simplify kontrola

### middleware.ts

**Hodnocení: DOBŘE**

- Kód je čistý a přehledný.
- Logika je správně rozdělena: redirect → nové request headers → přenos response headers/cookies.
- Filtr `x-middleware-next` při kopírování response headers je správný — ten header se nesmí přeposílat.
- Cookies se kopírují přes `response.cookies.getAll()` → `result.cookies.set()`, což je správná cesta.
- Žádná zbytečná složitost ani duplicity.

**Drobná poznámka (nekritická):** Cyklus `response.headers.forEach` kopíruje všechny response headers mimo `x-middleware-next`. Pokud by next-intl v budoucnu přidal další interní hlavičky (např. `x-middleware-rewrite`), mohly by se nekontrolovaně přenést. Prozatím bezpečné.

### components/LanguageSwitcher.tsx

**Hodnocení: DOBŘE**

- Server Component (async funkce, `await headers()`) — správně.
- Fallback chain pro pathname je logický a defensivní: `x-pathname → x-invoke-path → x-next-url → next-url → '/'`.
- `SEGMENT_TO_KEY` se builduje jednou při module load (ne při každém renderu) — OK.
- `findCanonicalKey` správně zvládá statické i dynamické segmenty (`[slug]` pattern).
- `buildLocalizedHref` správně vynechává locale prefix pro defaultLocale (`en`) díky `localePrefix: as-needed`.

**Drobná poznámka (nekritická):** `SEGMENT_TO_KEY` mapuje lokalizované segmenty → canonical key, ale stejný lokalizovaný segment nemůže být klíčem pro dva různé canonical paths — kolize nehrozí, protože routing je bijekce. Bezpečné.

---

## 2. TypeScript kontrola (npx tsc --noEmit)

**Výsledek:** Chyby nalezeny, ale **NESOUVISÍ s fixem**.

```
e2e/tests/full-test.spec.ts(26,31): error TS18047: 'sidebarText' is possibly 'null'.
e2e/tests/full-test.spec.ts(26,66): error TS18047: 'sidebarText' is possibly 'null'.
e2e/tests/full-test.spec.ts(26,102): error TS18047: 'sidebarText' is possibly 'null'.
```

- Chyby jsou v `e2e/tests/full-test.spec.ts` řádek 26 — Playwright test soubor.
- Middleware.ts ani LanguageSwitcher.tsx žádné TS chyby nemají.
- Tyto chyby existovaly před Taskem #4 (pre-existing).

**Hodnocení fixu z TS pohledu: PASS**

---

## 3. Reverzní kontrola — odpovídá fix root cause?

### Root cause bugu
Přepínač jazyků házel uživatele na homepage místo na lokalizovanou verzi aktuální stránky.

**Proč:** `LanguageSwitcher` četl `x-pathname` z **response headers**, ale Next.js middleware `NextResponse.next()` nepropaguje custom response headers do Server Components. Server Components čtou pouze **request headers**. Header `x-pathname` tedy nikdy nedorazil do komponenty → fallback na `/`.

### Co fix dělá

**middleware.ts:**
```ts
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-pathname', pathname);
const result = NextResponse.next({ request: { headers: requestHeaders } });
```
`x-pathname` se nastavuje na **request** headers (ne response). Server Components via `headers()` čtou request headers — header tedy správně dorazí.

**LanguageSwitcher.tsx:**
```ts
const pathname = hdrs.get('x-pathname')
  ?? hdrs.get('x-invoke-path')
  ?? hdrs.get('x-next-url')
  ?? hdrs.get('next-url')
  ?? '/';
```
Přidán fallback chain pro případ, že by `x-pathname` chyběl (edge case: přímý render bez middleware, statická cesta apod.).

### Verdict

**Fix adresuje root cause přímo a správně.**

- Starý kód: `response.headers.set('x-pathname', ...)` → Server Components to nevidí
- Nový kód: `NextResponse.next({ request: { headers: requestHeaders } })` → Server Components to vidí
- Fallback chain v LanguageSwitcher je defensive programming, ale nenahrazuje fix — je to jen pojistka.

---

## 4. Souhrn

| Oblast | Výsledek |
|--------|----------|
| Simplify kontrola (middleware.ts) | PASS — kód čistý |
| Simplify kontrola (LanguageSwitcher.tsx) | PASS — kód čistý |
| TypeScript (tsc --noEmit) | PASS pro fix, pre-existing chyby v e2e testech |
| Reverzní kontrola (root cause) | PASS — fix správně cílí příčinu |

**Celkové hodnocení: SCHVÁLENO**

Fix je korektní, čistý a řeší bug. Doporučuji merge.

Pre-existing TS chyby v `e2e/tests/full-test.spec.ts` je třeba opravit separátně (nullable guard na `sidebarText`), ale nesouvisí s tímto taskem.
