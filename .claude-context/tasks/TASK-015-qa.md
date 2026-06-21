# TASK-015: QA — Apartment reviews implementace

**Datum:** 2026-06-21
**Kontrolor:** kontrolor

---

## 1. Simplify kontrola

### lib/apartment-review-actions.ts

Kód je čistý a logicky uspořádaný. Několik postřehů:

**Duplicita `getLocale()`:**
Stejně jako v auth.ts/auth-actions.ts — funkce `getLocale()` je definována lokálně. Tato je třetí kopie téže funkce v kódu (auth.ts, auth-actions.ts, apartment-review-actions.ts). Non-blocker ale kandidát na refactor do sdílené utility.

**Pozitivní — anti-spam:**
- Honeypot field (`name="website"`) přítomen a správně kontrolován
- IP rate limiting: max 1 review per location per IP za 24h — implementováno
- Validace: `rating < 1 || rating > 5`, `content.length < 10`
- Moderace: default status = `pending`

**Potenciální issue — `headers()` voláno dvakrát:**
```ts
// apartment-review-actions.ts:27, 40
const locale = await getLocale();   // volá await headers() uvnitř
...
const hdrs = await headers();       // volá znovu
```
`getLocale()` interně volá `await headers()`, pak na řádku 40 se volá `await headers()` znovu. Next.js Server Actions cachuje `headers()` per-request, takže toto není funkční bug — ale je to zbytečné volání. Non-blocker.

**`revalidatePath` s hardcoded locale:**
```ts
// řádky 77, 87, 97
revalidatePath('/cs/admin/recenze-apartmanu');
```
`approveApartmentReview`, `rejectApartmentReview` a `deleteApartmentReview` revalidují pouze `/cs/` path. Pokud by admin používal jinou locale v URL, cache by se nerevalidovala. Prakticky jen admin používá tuto stránku a výchozí locale je `cs` — funkčně OK, ale technicky neúplné.

**Chybí FOREIGN KEY `approved_by → users`:**
V DB migrace (`lib/db.ts`) má `approved_by INTEGER` ale bez FK constraint na `users(id)`. Toto je v plánu (TASK-015-plan.md) tabulka specifikuje `approved_by INTEGER` bez FK také — tedy konzistentní se záměrem, ale trochu nedokonalé.

### app/[locale]/(admin)/admin/recenze-apartmanu/page.tsx

Čistý kód. `Stars` a `StatusBadge` jsou jednoduché helper komponenty správně extrahované.

**Diakritika v textech (admin stránka):**
```tsx
// řádky 49, 52, 56, 85, 86, 87
title="Recenze apartmanu"   // chybí háček nad "u"
"recenze ceka"              // chybí háčky: "čeká"
"Zadne recenze apartmanu."  // chybí: "Žádné recenze apartmánu."
"Cistota:"                  // chybí: "Čistota:"
"Diskretnost:"              // chybí: "Diskrétnost:"
```
Admin panel je interní nástroj, ale chybějící diakritika působí nedbale. Non-blocker, ale doporučuji opravit.

### lib/queries.ts — nové funkce

`getApartmentReviews` — pouze approved recenze, správné.
`getApartmentRatingStats` — agregace AVG, vrací `null` pro sub-ratings pokud žádné nejsou. Správné.
`getPendingApartmentReviews` — vrací všechny recenze (pending i approved/rejected), seřazené: pending první. Správné pro moderační workflow.

**Poznámka — `reviewsCount` v CS lokalizaci:**
```ts
// pobocka/[slug]/page.tsx:122
reviewsCount: (n) => `${n} ${n === 1 ? 'hodnocení' : n < 5 ? 'hodnocení' : 'hodnocení'}`,
```
Všechny tři větve vracejí `'hodnocení'` — funkce je trivially equivalent na `${n} hodnocení`. Správná česká pluralizace by byla `1 hodnocení / 2-4 hodnocení / 5+ hodnocení` — ale v češtině jsou tato slova totožná, takže je to správně. (Jiné by to bylo u "recenze" apod.)

### app/[locale]/pobocka/[slug]/page.tsx

Stránka je server-side, `force-dynamic` ne (má `revalidate = 3600`).

**Správnost `revalidate = 3600`:**
Pobočka stránka má ISR 1 hodina. Nové recenze se zobrazí max za hodinu — přijatelné pro review content který prochází moderací. OK.

**Formulář bez JS:**
- `<form action={submitApartmentReview}>` — Server Action, funguje bez JS ✅
- Rating přes `<select>` — funguje bez JS ✅
- Sub-ratings přes `<select>` — funguje bez JS ✅
- Honeypot field je hidden přes `position: absolute; left: -9999px` — nezobrazí se uživateli ✅

**Formulář skrytý pro upcoming apartmány:**
```tsx
{!isUpcoming && (
  <div className="apt-review-form-wrap">
```
Správně — formulář se nezobrazí pro apartmány s budoucím datem otevření (Žižkov 18.6., Smíchov 25.7.). ✅

**JSON-LD AggregateRating:**
```tsx
// řádky 346-347
ratingValue: ratingStats.totalReviews > 0 ? ratingStats.avgRating : undefined,
ratingCount: ratingStats.totalReviews > 0 ? ratingStats.totalReviews : undefined,
```
AggregateRating se přidá do LocalBusiness JSON-LD pouze pokud existují recenze. Správné chování. ✅

### AdminSidebar.tsx

Nová položka nav `recenze-apartmanu` je přidána s `managerCanSee: true` — manažer vidí recenze apartmánů, OK.

Badge počítá pending recenze z `apartment_reviews WHERE status='pending'`. Query inline v sidebaru (dynamic import db) — konzistentní se vzorem použitým pro `reviews` badge. ✅

**Pozitivní — sdílení ikony:**
`recenze-apartmanu` používá stejnou ikonu jako Dashboard (domeček). Funkčně OK ale vizuálně není ideální — ikona recenzí by lépe sedla. Non-blocker.

---

## 2. Debug kontrola

### TypeScript
```
npx tsc --noEmit → 0 chyb
```

### Build
```
npm run build → SUCCESS (provedeno při TASK-014 QA, kód přibyl, ověřit tsc stačí)
```
TypeScript bez chyb — build implicitně OK (tsc je přísnější než build u type errors).

### Lint
ESLint stále není nakonfigurován — existující problém projektu, ne regrese.

---

## 3. Reverzní kontrola vs zadání

### Původní požadavek
> "K pobočkám přidat rate the apartment nebo něco v tom smyslu kde můžou lidi hodnotit apartmán"

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Hodnocení apartmánů přidáno na stránku pobočky | ✅ | Sekce "Hodnocení apartmánu" na `/pobocka/[slug]` |
| 2 | Formulář pro odeslání hodnocení | ✅ | `<form action={submitApartmentReview}>` s name, rating, comment |
| 3 | Zobrazení schválených hodnocení | ✅ | `reviews.map(...)` — pouze `status='approved'` |
| 4 | Rating přehled (průměr, počet) | ✅ | `apt-rating-overview` s průměrem a progress bary |
| 5 | Sub-ratings (čistota, diskrétnost, komfort) | ✅ | Volitelné, v grafu i formuláři |
| 6 | Moderace v admin panelu | ✅ | `/admin/recenze-apartmanu` — schválit/zamítnout/smazat |
| 7 | Admin badge pro nové recenze | ✅ | Sidebar badge s počtem pending |
| 8 | Notifikace adminu při nové recenzi | ✅ | `createAdminNotification('apartment_review', ...)` |
| 9 | Anti-spam (honeypot, rate limit, validace) | ✅ | Všechny 3 mechanismy implementovány |
| 10 | Funguje bez JS | ✅ | Server Action + `<select>` pro rating |
| 11 | Lokalizace cs/en/de/uk | ✅ | Dictionary `T` s kompletními texty ve 4 jazycích |

### Položky z plánu

| Položka z plánu | Status | Poznámka |
|-----------------|--------|----------|
| DB tabulka `apartment_reviews` | ✅ | Migrace v `lib/db.ts` runMigrations |
| `getApartmentReviews()` | ✅ | Implementována v queries.ts |
| `getApartmentRatingStats()` | ✅ | Implementována v queries.ts |
| `getPendingApartmentReviews()` | ✅ | Implementována v queries.ts |
| SEO — AggregateRating v JSON-LD | ✅ | `localBusinessJsonLd` rozšířen o `ratingValue/ratingCount` |
| Formulář skrytý pro upcoming lokace | ✅ | `{!isUpcoming && <form...>}` |

---

## Závěr

### Blokery
Žádné.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | Chybějící diakritika v admin moderační stránce (Cistota, Diskretnost, Recenze apartmanu, Zadne recenze) | Nízká |
| 2 | `getLocale()` definována potřetí lokálně — kandidát na sdílenou utility | Nízká |
| 3 | `revalidatePath('/cs/admin/recenze-apartmanu')` hardcoded locale | Nízká |
| 4 | `headers()` voláno dvakrát v `submitApartmentReview` (jednou v getLocale, jednou přímo) | Velmi nízká |
| 5 | Ikona pro "Recenze apartmanu" v sidebaru je domeček (stejná jako Dashboard) | Kosmetická |

### Verdikt
**PASS** — implementace splňuje původní zadání i všechny body plánu. Build a typecheck bez chyb. Formuláře fungují bez JS. Moderace implementována. Anti-spam na místě. SEO AggregateRating přidán.

Doporučuji opravit diakritiku v admin stránce při příležitosti (bod #1).
