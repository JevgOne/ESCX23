# TASK-5xx: Analyza 32 x 5xx server erroru z GSC Coverage

## Prehled dynamickych routes a jejich error handling

### 1. `/profil/[slug]` — VYSOKE RIZIKO 5xx

**Soubor:** `app/[locale]/profil/[slug]/page.tsx`

**generateMetadata (radek 73-143):**
- `getGirlBySlug(slug)` — v try/catch (radek 76-79) ✅
- `getPhotosForGirl()` — v .catch() (radek 113) ✅
- `applyDBOverride()` — **BEZ try/catch** (radek 117) ❌ KRITICKE
  - Pokud Turso DB selze (timeout, cold start), `getSEOMetadata()` uvnitr vyhodi error
  - Error probubla z generateMetadata → Next.js vrati 500

**render (radek 146-270+):**
- `getGirlBySlug(slug).catch(() => null)` — OK ✅
- `getCurrentUser().catch(() => null)` — OK ✅
- 6 dalsich DB queries v Promise.all, vsechny s .catch() — OK ✅
- `if (!girl) notFound()` na radku 172 — OK ✅

**Pocet DB queries:** 8-10 paralelnich (girl, photos, reviews, plans, services, girlServices, schedule, videos, seo-metadata, SimilarGirls)

**Verdikt:** 5xx muze nastat v generateMetadata kvuli `applyDBOverride()` bez try/catch. Render je bezpecny.

---

### 2. `/pobocka/[slug]` — STREDNI RIZIKO 5xx

**Soubor:** `app/[locale]/pobocka/[slug]/page.tsx`

**generateMetadata (radek 281-302):**
- `getLocationBySlug(slug).catch(() => null)` — OK ✅
- `if (!loc) return {}` — OK ✅
- `applyDBOverride()` — **BEZ try/catch** (radek 289) ❌ KRITICKE
  - Stejna chyba jako profil — DB timeout crashne metadata

**render (radek 305-793):**
- `getLocationBySlug(slug).catch(() => null)` — OK ✅
- `if (!loc) notFound()` — OK ✅
- Dalsi queries s .catch() — OK ✅

**Pocet DB queries:** 4-5 (location, reviews, ratings, others, girls)

**Verdikt:** 5xx z generateMetadata. Render bezpecny.

---

### 3. `/hashtag/[slug]` — STREDNI RIZIKO 5xx

**Soubor:** `app/[locale]/hashtag/[slug]/page.tsx`

**generateMetadata (radek 71-105):**
- `getTitle(slug, locale)` — ciste JS, zadna DB ✅
- `getHashtagContent(slug)` — ciste JS, zadna DB ✅
- `applyDBOverride()` — **BEZ try/catch** (radek 83) ❌ KRITICKE

**render (radek 108-250+):**
- `getTitle(slug, locale)` — ciste JS ✅
- `if (!title) notFound()` — OK ✅
- `getGirlsForHashtag(slug).catch(() => [])` — OK ✅

**Verdikt:** 5xx z generateMetadata. Render bezpecny.

---

### 4. `/sluzba/[slug]` — NIZKE RIZIKO 5xx ✅

**Soubor:** `app/[locale]/sluzba/[slug]/page.tsx`

**generateMetadata (radek 26-56):**
- CELY v try/catch bloku (radek 28-55) ✅
- `applyDBOverride()` je UVNITR try/catch (radek 38) ✅

**render (radek 58-250+):**
- `getServiceBySlug(slug)` v try/catch → `notFound()` ✅
- Dalsi queries v try/catch s console.error ✅

**Verdikt:** Bezpecna implementace. 5xx nepravdepodobne.

---

### 5. `/blog/[slug]` — STREDNI RIZIKO 5xx

**Soubor:** `app/[locale]/blog/[slug]/page.tsx`

**generateMetadata (radek 24-81):**
- `getBlogPostBySlug(slug, locale)` — **BEZ try/catch** ❌
  - Pokud DB selze, error probubla nahoru → 500
- `applyDBOverride()` — **BEZ try/catch** (radek 38) ❌

**render (radek 129-250+):**
- `getBlogPostBySlug(slug, locale)` — **BEZ try/catch** ❌
  - Na radku 134: `const post = await getBlogPostBySlug(slug, locale);`
  - Na radku 135: `if (!post) notFound();`
  - ALE: pokud query VYHODI error (DB timeout), nebude null ale exception → 500
- `getRelatedBlogPosts()` — **BEZ try/catch** (radek 137) ❌

**Verdikt:** 5xx mozny v OBOU generateMetadata i render. Nejhorsi error handling ze vsech routes.

---

### 6. `/` (homepage) — STREDNI RIZIKO 5xx

**Soubor:** `app/[locale]/page.tsx`

**generateMetadata (radek 40-73):**
- `applyDBOverride()` — **BEZ try/catch** (radek 51) ❌
- `getCustomOgImage('home')` — **BEZ try/catch** (radek 49) ❌

**render (radek 75-125):**
- `getHomepageStats().catch(() => ({...}))` — OK ✅
- Vsechny komponenty (StoriesRow, FeaturedNew, etc.) zpracovavaji errory interno

**Verdikt:** 5xx z generateMetadata. Render pravdepodobne bezpecny.

---

### 7. `/recenze/nova/[slug]` — NIZKE RIZIKO ✅

**Soubor:** `app/[locale]/recenze/nova/[slug]/page.tsx`

- DB query v try/catch (radek 94-103) → `notFound()` ✅
- Server Action `submitReview` v try/catch (radek 55-83) → redirect s error param ✅

---

### 8. `/stories/[id]` — NIZKE RIZIKO ✅

**Soubor:** `app/[locale]/stories/[id]/page.tsx`

- NaN check (radek 56-58) → redirect ✅
- `getStoryById` bez try/catch ale neni v sitemap (noindex) — 5xx by neovlivnilo GSC

---

### 9. `/divky` — STREDNI RIZIKO 5xx

**Soubor:** `app/[locale]/divky/page.tsx`

- `getGirlsWithToday()` — slozity JOIN query. Pokud selze v render, 500.
- `applyDBOverride()` v generateMetadata — pravdepodobne BEZ try/catch (jako ostatni routes)

---

### 10. `/rozvrh` — STREDNI RIZIKO 5xx

**Soubor:** `app/[locale]/rozvrh/page.tsx`

- Slozity schedule query, `force-dynamic`
- `applyDBOverride()` v generateMetadata — pravdepodobne BEZ try/catch

---

## Chybejici error boundaries

| Soubor | Existuje? |
|--------|-----------|
| `app/[locale]/error.tsx` | ANO ✅ — zachyti render errory, zobrazi "Neco se pokazilo" |
| `app/[locale]/not-found.tsx` | NE ❌ — chybi! Next.js default 404 |
| `app/not-found.tsx` | NE ❌ — chybi! |
| `app/error.tsx` | NE ❌ — chybi! Pokud error nastane mimo locale layout |

**Problem s chybejicim not-found.tsx:**
Kdyz `notFound()` je zavolano (napr. pro `/cs/profil/neexistujici-slug`), Next.js hleda `not-found.tsx` v tomto poradi:
1. `app/[locale]/profil/[slug]/not-found.tsx` — neexistuje
2. `app/[locale]/not-found.tsx` — neexistuje
3. `app/not-found.tsx` — neexistuje
4. Pouzije default Next.js 404

Default 404 se renderuje MIMO locale layout. Pokud layout ocekava locale context (next-intl provider), muze to zpusobit error → 500 misto 404.

---

## Middleware analyza

**Soubor:** `middleware.ts`

```ts
export default function middleware(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const response = intl(request);
  response.headers.set('x-pathname', originalPathname);
  return response;
}
```

- `createMiddleware(routing)` je next-intl middleware — stabilni, maly risk ✅
- `localeDetection: false` v routing.ts — nebude redirect na zaklade Accept-Language ✅
- Middleware nema try/catch ale next-intl je dobre otestovany — NIZKY risk

---

## Runtime migrace — race condition

**Soubor:** `lib/db.ts` (radek 98-99)

```ts
runMigrations(db).catch(() => {});
```

Migrace bezi fire-and-forget pri importu modulu. Problem:
1. Prvni request spusti import `lib/db.ts`
2. `runMigrations()` se SPUSTI ale nepocka se na dokonceni
3. Request pokracuje a vola query ktera pouziva novy sloupec (napr. `girls.ethnicity`)
4. Sloupec jeste neexistuje → SQL error → 500

Dopad: Ovlivni jen PRVNI request po cold startu, pak uz je migrace hotova. Na Vercel Serverless = 1 z ~50 cold startu (odhad).

---

## Souhrn: co presne zpusobuje 32 x 5xx

### Hlavni pricina: `applyDBOverride()` v generateMetadata

Dotcene routes (vsechny BEZ try/catch kolem applyDBOverride v generateMetadata):

| Route | Soubor:radek |
|-------|-------------|
| `/` | `app/[locale]/page.tsx:51` |
| `/profil/[slug]` | `app/[locale]/profil/[slug]/page.tsx:117` |
| `/pobocka/[slug]` | `app/[locale]/pobocka/[slug]/page.tsx:289` |
| `/hashtag/[slug]` | `app/[locale]/hashtag/[slug]/page.tsx:83` |
| `/blog/[slug]` | `app/[locale]/blog/[slug]/page.tsx:38` |
| `/divky` | `app/[locale]/divky/page.tsx` (overit radek) |
| `/rozvrh` | `app/[locale]/rozvrh/page.tsx` (overit radek) |

### Vedlejsi priciny

1. **`/blog/[slug]` render** — `getBlogPostBySlug()` a `getRelatedBlogPosts()` BEZ try/catch
2. **Chybejici `not-found.tsx`** — `notFound()` muze vyustit v 500
3. **Runtime migrace race condition** — sporadicke 500 pri cold startu

### Scenar vzniku 5xx

```
Googlebot crawluje /cs/profil/anetta
  → Vercel spusti serverless funkci (cold start)
  → generateMetadata() se zavola
    → applyDBOverride('/cs/profil/anetta', {...})
      → getSEOMetadata('/cs/profil/anetta')
        → db.execute('SELECT * FROM seo_metadata WHERE page_path = ?')
          → Turso DB timeout (cold start, 1-3s)
          → THROW Error('Connection timeout')
        → Error probubla z getSEOMetadata
      → Error probubla z applyDBOverride
    → Error probubla z generateMetadata
  → Next.js zachyti unhandled error → 500 Internal Server Error
```

---

## Opravy pro implementatora

### FIX 1 (P0): Zabalit applyDBOverride do try/catch

Ve VSECH generateMetadata funkcich kde se vola `applyDBOverride()`, zmenit na:

```ts
// PRED (crashne pri DB timeout):
return applyDBOverride(`/${locale}/profil/${slug}`, { title, description, ... });

// PO (bezpecne):
try {
  return await applyDBOverride(`/${locale}/profil/${slug}`, { title, description, ... });
} catch {
  return { title, description, ... };
}
```

**Soubory k upravit:**
- `app/[locale]/page.tsx` — radek 51
- `app/[locale]/profil/[slug]/page.tsx` — radek 117
- `app/[locale]/pobocka/[slug]/page.tsx` — radek 289
- `app/[locale]/hashtag/[slug]/page.tsx` — radek 83
- `app/[locale]/blog/[slug]/page.tsx` — radek 38
- `app/[locale]/divky/page.tsx` — overit a opravit
- `app/[locale]/rozvrh/page.tsx` — overit a opravit
- `app/[locale]/recenze/page.tsx` — overit a opravit
- `app/[locale]/cenik/page.tsx` — overit a opravit
- `app/[locale]/slevy/page.tsx` — overit a opravit
- `app/[locale]/faq/page.tsx` — overit a opravit

### FIX 2 (P0): Pridat not-found.tsx

Vytvorit `app/[locale]/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>404</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Stránka nenalezena
        </p>
        <Link href="/" className="btn btn-primary">Zpět na hlavní stránku</Link>
      </div>
    </main>
  );
}
```

### FIX 3 (P1): blog/[slug] render error handling

```ts
// PRED:
const post = await getBlogPostBySlug(slug, locale);
if (!post) notFound();
const related = await getRelatedBlogPosts(post.id, locale, 3);

// PO:
const post = await getBlogPostBySlug(slug, locale).catch(() => null);
if (!post) notFound();
const related = await getRelatedBlogPosts(post.id, locale, 3).catch(() => []);
```

### FIX 4 (P1): Zmenit runMigrations na await

```ts
// PRED (lib/db.ts radek 98-99):
runMigrations(db).catch(() => {});

// PO:
let migrationsDone = false;
export async function ensureMigrations() {
  if (migrationsDone) return;
  await runMigrations(db);
  migrationsDone = true;
}
// A volat ensureMigrations() v getDB() wrapperu
```

---

## Odhad rozlozeni 32 x 5xx

| Pricina | Odhad poctu | Duvod |
|---------|------------|-------|
| applyDBOverride v generateMetadata (DB timeout) | ~20 | Nejvice routes, kazdy cold start = risk |
| blog/[slug] render bez try/catch | ~5 | Menej requestu nez profily |
| not-found → 500 (chybejici not-found.tsx) | ~4 | Stare URL pred redirecty |
| Runtime migrace race condition | ~2-3 | Sporadicke, jen pri cold startu |
| **Celkem** | **~32** | Odpovida GSC reportu |
