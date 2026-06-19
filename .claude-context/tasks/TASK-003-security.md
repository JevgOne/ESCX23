# TASK-003 QA Report: Bezpečnostní audit

**Datum:** 2026-05-29  
**Kontrolor:** kontrolor  
**Status:** HOTOVO

---

## Přehled nálezů

| Severity | Počet | Stav |
|----------|-------|------|
| CRITICAL | 5 | Vyžaduje okamžitý fix |
| HIGH | 3 | Fix před produkčním deployem |
| MEDIUM | 4 | Fix doporučen |
| LOW | 5 | Monitoring / informativní |

---

## CRITICAL

### C1 — Admin server actions bez auth guard
**Soubor:** `lib/admin-actions.ts`  
**Popis:** Všech 34 exportovaných server actions (`updateGirl`, `createGirl`, `deleteGirl`, `createPricingPlan`, `deleteFaq`, atd.) NEOBSAHUJÍ žádnou autorizaci. Kdokoliv, kdo zná název akce, ji může zavolat přímo bez přihlášení.

Příklad zneužití: POST na `/[locale]/admin/divky/[id]/edit` s `_action=updateGirl` změní data bez ověření identity.

**Tracked:** Task #9 je in_progress.

---

### C2 — CRON_SECRET logická chyba (otevřené cron endpointy)
**Soubory:** `app/api/cron/expire-stories/route.ts`, `app/api/cron/cleanup-old-overrides/route.ts`, `app/api/cron/recalc-stats/route.ts`, `app/api/cron/expire-loyalty-discounts/route.ts`  
**Popis:** Auth podmínka je:
```ts
if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
```
Pokud `CRON_SECRET` **není nastaven** (výchozí stav v dev/staging), podmínka je `false` a autorizace se přeskočí — endpoint je volně dostupný každému. Správná logika:
```ts
if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
```
**Dopad:** Kdokoliv může triggernout `DELETE FROM schedule_exceptions`, `UPDATE stories`, `UPDATE girls` (recalc-stats).

---

### C3 — GET /api/seo bez autentizace
**Soubor:** `app/api/seo/route.ts`  
**Popis:** GET handler vrací všechna SEO metadata z DB bez jakékoliv autentizace. POST/DELETE mají `requireAdmin()`, ale GET nikoliv (řádky 7–56).  
**Dopad:** Veřejně dostupný přehled všech interních SEO dat webu.

---

## HIGH

### H1 — SESSION_SECRET fallback na náhodnou hodnotu
**Soubor:** `lib/auth.ts:26-27`  
**Kód:**
```ts
const SECRET =
  process.env.SESSION_SECRET ||
  'dev-secret-change-in-prod-' + Math.random().toString(36);
```
**Dopad:**  
1. Pokud `SESSION_SECRET` není nastaven v produkci, všechny session tokeny jsou při každém restartu serveru invalidovány (HMAC secret se mění).  
2. V dev prostředí je secret slabý a předvídatelný.  
**Fix:** Vyhodit error (nebo alespoň `console.warn`) pokud `SESSION_SECRET` chybí v `NODE_ENV=production`.

---

### H2 — /admin/seo stránka bez server-side auth
**Soubory:** `app/(admin)/admin/seo/page.tsx`, `app/(admin)/admin/seo/edit/page.tsx`  
**Popis:** Tyto stránky jsou MIMO `app/[locale]/(admin)/` layout strom — tedy mimo `AdminLayout`, který volá `requireAdmin()`. Jsou to `"use client"` komponenty bez server-side auth check. Kdokoliv může načíst URL `/admin/seo` a vidět stránku (i když data se načítají přes `/api/seo` GET, který je také nechráněný — viz C3).  
**Tracked:** Zmíněno v Task #9.

---

## MEDIUM

### M1 — dangerouslySetInnerHTML s admin-spravovaným obsahem (blog, FAQ, sluzba)
**Soubory:**
- `app/[locale]/blog/[slug]/page.tsx:97` — `post.content` přímo do HTML
- `components/faq/FaqList.tsx:47` — FAQ odpovědi přímo do HTML
- `app/[locale]/sluzba/[slug]/page.tsx:127` — service content s `.replace(/\n/g, '<br>')`

**Popis:** Obsah je admin-spravovaný (ne user-generated), tedy bezprostřední XSS riziko je nízké. Nicméně pokud dojde k SQL injection nebo kompromitaci admin účtu, útočník může injektovat libovolný HTML/JS do veřejných stránek.  
**Doporučení:** Sanitizovat HTML přes knihovnu `DOMPurify` nebo `sanitize-html` alespoň pro blog content.

---

### M2 — Chybí ESLint config (viz TASK-002)
Bez ESLint nelze automaticky detekovat bezpečnostní anti-patterny (např. `any` typy, unsafe template literals). Vytvořit `eslint.config.mjs`.

---

### M3 — `any` typ v API route
**Soubor:** `app/api/seo/route.ts:16`  
```ts
const args: any[] = [];
```
TypeScript strict mode toto povoluje přes přímou typovou anotaci. Potenciálně maskuje chyby při sestavování SQL.

---

## LOW

### L1 — SQL dynamické sestavování WHERE/ORDER (bezpečné, ale pozor)
**Soubory:** `lib/queries.ts:1348`, `lib/admin-actions.ts:450,489`  
**Popis:** `whereSQL` je sestaveno z hardcoded string konstant (ne z user inputu), `orderSQL` je vybrán přes `if-else` switch — ne interpolací user hodnot. `IN (${slugPlaceholders})` používá `?` placeholders pro data. **Toto je bezpečné.**  
**Pozn.:** Při budoucí úpravě dávat pozor, aby se user input NIKDY nedostal přímo do SQL stringu.

---

### L2 — Soubory v NEXT_PUBLIC_ jsou pouze site URL a brand name
Všechny `NEXT_PUBLIC_*` proměnné jsou pouze `NEXT_PUBLIC_SITE_URL` a `NEXT_PUBLIC_BRAND_NAME` — žádné tajemství (API keys, tokeny) nejsou leaknuty na frontend. ✅

---

### L3 — File upload validace je správná
**Soubor:** `lib/photo-actions.ts`  
- Whitelist extensions: `jpg, jpeg, png, webp, avif, heic` ✅
- Max size: 10MB ✅
- Auth: `requireGirl()` pro studio, `requireAdmin()` pro admin ✅
- Filename: `girlId/timestamp-uuid.ext` (žádný path traversal) ✅

---

## Doplnkove nalezy (planovac — hlubsi analyza)

### C4 — Admin dostupnost actions bez auth guard (CRITICAL)
**Soubor:** `app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts`
**Popis:** 3 server actions (`saveWeeklySchedule`, `setTodayOff`, `applyMonthBulk`) NEMAJI `requireAdmin()`. Utocnik muze zmenit rozvrh libovolne divky, vymazat mesic overrides, nastavit "dnes volno".
**Fix:** Pridat `await requireAdmin();` na zacatek kazde z 3 akci.
**Pozn.:** Toto NENI pokryto v TASK-9 (ktery resi jen lib/admin-actions.ts).

---

### C5 — GET /api/pages bez autentizace (CRITICAL)
**Soubor:** `app/api/pages/route.ts`
**Popis:** Vraci kompletni mapu vsech stranek webu vcetne admin URL. Zadna auth.
**Fix:** Pridat `requireAdmin()` do GET handleru.

---

### H3 — Review auto-approval (HIGH)
**Soubor:** `app/[locale]/recenze/nova/[slug]/page.tsx:63`
**Kod:** `status: 'approved'` — recenze se OKAMZITE zverejni.
**Dopad:** Kdokoliv muze napsat falesnou/spamovou recenzi. Zadna moderace.
**Fix:** Zmenit na `status: 'pending'`, admin schvaluje pres existujici approveReview action.

---

### M4 — Zadny rate limiting na verejnych formularich (MEDIUM)
**Formulare bez throttlingu:**
- `submitApplication` (join) — prihlaska divky
- `submitMemberApplication` (clenstvi) — zadost o clenstvi
- `submitReview` (recenze) — recenze
- `loginAdmin` / `loginGirl` — login (brute force mozny)
**Dopad:** Spam, DB flooding, brute-force hesla.
**Fix:** IP-based rate limiting (napr. Vercel Edge Middleware, nebo `next-rate-limit`), CAPTCHA na join/review, account lockout po N neuspechem.

---

### L4 — Age gate cookie httpOnly:false (LOW)
**Soubor:** `lib/age-gate-actions.ts:10`
**Popis:** Cookie `age_verified` ma `httpOnly: false` — klientsky JS muze nastavit `document.cookie = 'age_verified=1'` a obejit age gate.
**Realny dopad:** Nizky — age gate je pravni formalita, ne bezpecnostni bariera. Nicmene pro compliance by melo byt httpOnly:true.

---

### L5 — File upload: MIME type vs extension mismatch (LOW)
**Soubor:** `lib/photo-actions.ts:22-23`
**Popis:** Validace kontroluje POUZE file extension (`file.name.split('.').pop()`), ne MIME type (Content-Type/magic bytes). Utocnik muze poslat `.jpg` soubor s obsahem SVG/HTML. Nicmene: sharp zpracovani (watermark) by takovy soubor odmitlo s chybou, a Vercel Blob ulozi pod spravnym content type z extension.
**Realny dopad:** Velmi nizky diky sharp + Vercel Blob.

---

## Doporučené priority oprav

1. **Okamzite (pred jakymkoliv verejnym pristupem):**
   - C1: Pridat `requireAdmin()` do vsech 34 admin server actions (viz Task #9)
   - C2: Opravit CRON_SECRET logiku ve 4 cron routes
   - C3: Pridat `requireAdmin()` do GET `/api/seo`
   - C4: Pridat `requireAdmin()` do 3 dostupnost actions (NENI v Task #9!)
   - C5: Pridat `requireAdmin()` do GET `/api/pages`

2. **Pred produkcnim deployem:**
   - H1: Pridat validaci `SESSION_SECRET` v production
   - H2: Pridat server-side auth do `/app/(admin)/admin/seo/` stranek
   - H3: Zmenit review auto-approval na status='pending'

3. **Doporuceno (next sprint):**
   - M1: Sanitizovat blog/FAQ HTML obsah
   - M2: Vytvorit eslint.config.mjs
   - M4: Rate limiting na login, join, review formulare
