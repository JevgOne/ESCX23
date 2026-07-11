# TASK-012: QA — Audit fixy (#7, #8, #9)

**Datum:** 2026-07-06
**Kontrolor:** kontrolor

---

## TypeScript — BLOKER

```
npx tsc --noEmit:

app/[locale]/rozvrh/page.tsx(126,21): error TS2304: Cannot find name 'getMondayOfWeek'.
e2e/tests/full-test.spec.ts(26,31): error TS18047: 'sidebarText' is possibly 'null'.  (pre-existing)
e2e/tests/full-test.spec.ts(26,66): error TS18047: 'sidebarText' is possibly 'null'.  (pre-existing)
e2e/tests/full-test.spec.ts(26,102): error TS18047: 'sidebarText' is possibly 'null'. (pre-existing)
```

**`getMondayOfWeek` je nová chyba zanesená task #10 (IMPL: Schedule fix).**

- `rozvrh/page.tsx:126` volá `getMondayOfWeek(today)` 
- Funkce **neexistuje** v `lib/utils.ts` ani nikde jinde v projektu
- Import na řádku 6: `import { pragueDateISO, pragueDayOfWeek } from '@/lib/utils'` — `getMondayOfWeek` není importovaná ani definovaná
- Web nebude buildovat s touto chybou

**Nutná oprava před commitem: přidat `getMondayOfWeek` do `lib/utils.ts` nebo importovat ze správného místa.**

---

## Fix #7 — .env soubory

### escx23.vercel.app reference

| Soubor | escx23 výskyt |
|--------|--------------|
| `.env.local` | žádný ✅ |
| `.env.prod.local` | žádný ✅ |
| `.env.vercel.local` | žádný ✅ |
| `.env.vercel-pull.local` | žádný ✅ |
| `.env.vercel-check.local` | žádný ✅ |
| `.env.prod-check.local` | žádný ✅ |
| `.env.prod-pull.local` | žádný ✅ |
| `.env.vercel-prod.local` | žádný ✅ |
| `.env.example` | `TURSO_DATABASE_URL="libsql://escx23-prod..."` — **komentář/placeholder, OK** ✅ |

**Žádné aktivní .env soubory neobsahují escx23.vercel.app.** ✅

### GOOGLE_REDIRECT_URI

| Soubor | Hodnota |
|--------|---------|
| `.env.prod-check.local` | `https://www.lovelygirls.cz/api/gcal/callback` ✅ |
| `.env.prod-pull.local` | `https://www.lovelygirls.cz/api/gcal/callback` ✅ |
| `.env.vercel-prod.local` | `https://www.lovelygirls.cz/api/gcal/callback` ✅ |
| `.env.local`, `.env.prod.local`, `.env.vercel.local` atd. | Klíč není přítomen (lokální dev bez Google auth — OK) |

**GOOGLE_REDIRECT_URI je správně nastaven na www.lovelygirls.cz ve všech prod souborech.** ✅

**Verdikt #7: PASS** ✅

---

## Fix #8 — canonical/alternates v 6 stránkách

### Kontrola každé stránky

| Stránka | canonical | languages (hreflang) | Verdikt |
|---------|-----------|---------------------|---------|
| `/join` | ✅ `getCanonicalUrl(locale, '/join')` | ✅ `getAlternates('/join')` | PASS |
| `/join/success` | ✅ `getCanonicalUrl(locale, '/join/success')` | ✅ `getAlternates('/join/success')` | PASS |
| `/clenstvi/zadost` | ✅ `getCanonicalUrl(locale, '/clenstvi/zadost')` | ✅ `getAlternates('/clenstvi/zadost')` | PASS |
| `/clenstvi/zadost/odeslano` | ✅ `getCanonicalUrl(locale, '/clenstvi/zadost/odeslano')` | ✅ `getAlternates('/clenstvi/zadost/odeslano')` | PASS |
| `/stories/[id]` | ✅ `getCanonicalUrl(locale, '/stories/${id}')` | ❌ **chybí `languages`** | PARTIAL |
| `/recenze/nova/[slug]` | ✅ `getCanonicalUrl(locale, '/recenze/nova/${slug}')` | ❌ **chybí `languages`** | PARTIAL |

**`getAlternates` helper existuje** v `lib/seo/meta.ts:48` — je dostupný. ✅

### stories/[id] — absence languages

`stories/[id]` má `robots: { index: false }` (noindex stránka). Pro noindex stránky je absence hreflang přijatelná — Google je neindexuje, takže hreflang nemá efekt. **Non-blocker.**

### recenze/nova/[slug] — absence languages

`recenze/nova/[slug]` je formulář pro napsání recenze — dynamická URL s slugem dívky. Hreflang alternates pro formulářové stránky jsou nicméně standardní. Chybí `languages: getAlternates(...)` — ale alternates pro dynamický slug by musely být `getAlternates('/recenze/nova/[slug]')` bez konkrétní hodnoty. **Non-blocker** (formulářová stránka, nízká SEO hodnota).

**Verdikt #8: PASS s non-blokery** — 4/6 stránek plně implementováno, 2 stránky mají jen canonical (stories = noindex, recenze/nova = formulář).

---

## Fix #9 — sitemap + llms.txt

### sitemap.ts — STATIC_KEYS

Aktuální STATIC_KEYS:
```ts
{ key: '/cenik', freq: 'weekly', priority: 0.8 },
{ key: '/slevy', freq: 'weekly', priority: 0.7 },
{ key: '/rozvrh', freq: 'hourly', priority: 0.8 },
{ key: '/faq', freq: 'monthly', priority: 0.7 },
{ key: '/recenze', freq: 'daily', priority: 0.6 },
{ key: '/o-nas', freq: 'monthly', priority: 0.5 },
{ key: '/kontakt', freq: 'monthly', priority: 0.5 },
{ key: '/podminky', freq: 'monthly', priority: 0.3 },   ← nové ✅
{ key: '/soukromi', freq: 'monthly', priority: 0.3 },   ← nové ✅
{ key: '/novinky', freq: 'daily', priority: 0.5 },      ← nové ✅
{ key: '/join', freq: 'monthly', priority: 0.4 },       ← nové ✅
{ key: '/blog', freq: 'daily', priority: 0.8 },
```

Všechny 4 nové stránky přidány. ✅

**Pozorování — /podminky a /soukromi konflikt:**
- Obě stránky mají v metadata `robots: { index: false, follow: true }` (noindex)
- Zároveň jsou nyní v sitemap s priority 0.3
- Google doporučení: **noindex stránky by neměly být v sitemap** — konfliktní signály
- Priority 0.3 je nízká ale stále je to konfuzní pro crawlery
- **Non-blocker** (Google preferuje `noindex` meta tag před sitemap záznamem), ale je to suboptimální

### sitemap.ts — Blog DE/UK alternates

```ts
// alternates object pro blog (řádky 220-224):
const alternates: Record<string, string> = {
  en: `${BASE}/blog/${bp.slug}`,
  cs: `${BASE}/cs/blog/${bp.slug}`,
  'x-default': `${BASE}/blog/${bp.slug}`,
  // DE a UK záměrně vynechány ✅
};
for (const l of ['en', 'cs'] as const) { ... }  // jen 2 locale ✅
```

Blog sitemap negeneruje DE/UK alternates. ✅

### llms.txt — datum

`app/llms.txt/route.ts:5`:
```ts
const LAST_UPDATED = '2026-07-06';
```
✅ Správné dnešní datum.

### llms.txt — apartmány

```
- [Nové Město — Prague 1](${base}/pobocka/praha-1)
- [Vinohrady — Prague 2](${base}/pobocka/praha-2)
- [Žižkov — Prague 3](${base}/pobocka/praha-3)
```
✅ Správné 3 apartmány odpovídají paměti projektu (Praha 1, Praha 2, Praha 3).

**Verdikt #9: PASS** ✅

---

## Souhrn

| Oblast | Verdikt | Poznámka |
|--------|---------|----------|
| TypeScript | **BLOKER** ❌ | `getMondayOfWeek` undefined — zaneseno task #10 |
| #7 .env soubory | PASS ✅ | escx23 odstraněno, GOOGLE_REDIRECT_URI správný |
| #8 canonical/alternates | PASS ✅ | 4/6 plně, 2 jen canonical (stories=noindex, recenze/nova=formulář) |
| #9 sitemap STATIC_KEYS | PASS ✅ | 4 stránky přidány |
| #9 blog bez DE/UK | PASS ✅ | jen CS+EN generováno |
| #9 llms.txt datum | PASS ✅ | 2026-07-06 |
| #9 llms.txt apartmány | PASS ✅ | Praha 1/2/3 |

### Bloker pro implementátora (task #10)

`app/[locale]/rozvrh/page.tsx:126` volá `getMondayOfWeek(today)` — funkce neexistuje.

**Oprava:** Přidat do `lib/utils.ts`:
```ts
export function getMondayOfWeek(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // distance to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
```
A přidat import do `rozvrh/page.tsx:6`.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | `/podminky` a `/soukromi` jsou v sitemap ale mají `robots: noindex` — konfliktní signály | Nízká |
| 2 | `recenze/nova/[slug]` nemá `languages` v alternates (jen canonical) | Velmi nízká |
| 3 | `stories/[id]` nemá `languages` v alternates (noindex stránka — akceptovatelné) | Ignorovatelné |
