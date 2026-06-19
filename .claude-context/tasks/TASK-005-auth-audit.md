# TASK-005 Statický audit: Auth flow + Admin panel navigace

**Datum:** 2026-05-29  
**Kontrolor:** kontrolor  
**Metoda:** Statická analýza kódu (Read/Grep/Glob)

---

## 1. lib/auth.ts — Session logika, cookie handling, guardy

### Session implementace
- **Algoritmus:** Custom HMAC-SHA256 token (ne JWT, ne NextAuth)
- **Token formát:** `base64url(userId.role.exp.sig)` — 4 části oddělené tečkou
- **Expiration:** 30 dní (`SESSION_MAX_AGE_DAYS = 30`)
- **Cookie:** `escx23_session`, `httpOnly: true`, `secure: true` (v produkci), `sameSite: 'lax'`

### Silné stránky
- ✅ `httpOnly` cookie — JS na stránce nemůže přečíst token
- ✅ `secure` jen v produkci — dev funguje přes http
- ✅ `sameSite: 'lax'` — CSRF ochrana pro standard navigaci
- ✅ DB lookup při každém `getCurrentUser()` — revokace stačí smazat uživatele
- ✅ Expirace tokenu ověřena serverem (`Number(exp) < Date.now()`)
- ✅ HMAC podpis — token nelze zfalšovat bez znalosti `SESSION_SECRET`
- ✅ `bcrypt` s cost factor 12 — silný hash hesel

### Slabiny (viz také TASK-003)
- ⚠️ **SESSION_SECRET fallback na `Math.random()`** (`lib/auth.ts:26-27`) — pokud env není nastavena v produkci, secret se mění při každém restartu → všechny sessions jsou invalidovány. Fix: vyhodit error v `NODE_ENV=production` pokud chybí.
- ⚠️ **`requireAdmin` redirect bez locale** — `redirect('/admin/login')` místo `redirect('/cs/admin/login')`. V prostředí s povinným locale prefixem může způsobit 404. Stejný problém u `requireGirl` → `redirect('/studio/login')`.

### Guard funkce — přehled

| Funkce | Podmínka přístupu | Redirect na |
|--------|------------------|-------------|
| `requireAdmin()` | role = `admin` NEBO `manager` | `/admin/login` |
| `requireFullAdmin()` | role = `admin` ONLY | `/cs/admin` (manager) nebo `/admin/login` |
| `requireGirl()` | role = `girl` ONLY | `/studio/login` |

---

## 2. Admin layout — app/[locale]/(admin)/admin/layout.tsx

### Auth ochrana
- ✅ `requireAdmin()` voláno na řádku 48 pro všechny non-login stránky
- ✅ Login stránka (`/admin/login`) je explicitně vyjmuta z auth check: `if (!isLogin) { user = await requireAdmin() }`
- ✅ Manager role check — pokud manager přistupí na nepovolený admin path, redirect na `/[locale]/admin`
- ✅ `export const dynamic = 'force-dynamic'` — žádné cachování

### Manager allowed paths (MANAGER_ALLOWED_PATHS)
Manažer může přistupovat na:
- `/admin` (dashboard)
- `/admin/divky`
- `/admin/aplikace`
- `/admin/schedules`
- `/admin/verifikace`
- `/admin/recenze`
- `/admin/stories`

Manažer **nemůže** (redirectován na dashboard):
- `/admin/cenik`, `/admin/slevy`, `/admin/faq`, `/admin/pobocky` — správně chrání citlivá data

### Slabina
- ⚠️ **`x-pathname` header** — layout čte `x-pathname` z `headers()` pro detekci login stránky. Pokud middleware tento header nenastavuje konzistentně, detekce selže a login stránka by mohla vyžadovat auth před přihlášením. Nutno ověřit v runtime (test-chrome).

---

## 3. Studio layout — app/[locale]/studio/layout.tsx

### Auth ochrana
- ✅ `requireGirl()` voláno pro všechny non-login stránky
- ✅ Login stránka (`/studio/login`) vyjmuta: `if (!isLogin) { await requireGirl() }`
- ✅ `export const dynamic = 'force-dynamic'`
- ✅ `metadata.robots = noindex` — studio není indexováno

### Struktura
Jednoduchá — bez role hierarchie (všechny `girl` role mají plný přístup ke svému studiu).

---

## 4. Navigace — Admin sidebar vs. skutečné routes

### Admin sidebar (NAV v AdminSidebar.tsx) vs. existující routes

| Nav item | Nav href | Route existuje? |
|----------|----------|-----------------|
| Dashboard | `/cs/admin` | ✅ |
| Dívky | `/cs/admin/divky` | ✅ |
| Aplikace | `/cs/admin/aplikace` | ✅ |
| Rozvrhy | `/cs/admin/schedules` | ✅ |
| Verifikace fotek | `/cs/admin/verifikace` | ✅ |
| Recenze | `/cs/admin/recenze` | ✅ |
| Členové | `/cs/admin/clenove` | ✅ |
| Pobočky | `/cs/admin/pobocky` | ✅ |
| Stories | `/cs/admin/stories` | ✅ |
| Ceník | `/cs/admin/cenik` | ✅ |
| Slevy | `/cs/admin/slevy` | ✅ |
| FAQ | `/cs/admin/faq` | ✅ |
| CMS | `/cs/admin/cms/homepage` | ❌ **CHYBÍ** — route neexistuje |
| OG Images | `/cs/admin/og` | ✅ |
| SEO | `/cs/admin/seo` | ⚠️ Existuje jako `/app/(admin)/admin/seo/` (mimo locale layout, bez auth) |
| Audit log | `/cs/admin/audit` | ❌ **CHYBÍ** — route neexistuje |
| Nastavení | `/cs/admin/nastaveni` | ❌ **CHYBÍ** — route neexistuje |

### Nalezené problémy:
1. **CMS `/cs/admin/cms/homepage`** — v nav, ale route neexistuje → 404
2. **Audit log `/cs/admin/audit`** — v nav, ale route neexistuje → 404
3. **Nastavení `/cs/admin/nastaveni`** — v nav, ale route neexistuje → 404
4. **Rezervace `/cs/admin/rezervace`** — route existuje, ale **CHYBÍ v nav** (není vidět v menu)
5. **SEO** — odkaz vede na `/cs/admin/seo` (redirect na `/admin/seo`) — tato stránka je mimo `[locale]/(admin)/` layout, tedy **mimo auth ochranu layout.tsx** (H2 z TASK-003)

### Studio sidebar vs. studio routes

| Nav item | Route existuje? |
|----------|-----------------|
| Dashboard (`/cs/studio`) | ✅ |
| Základní info (`/cs/studio/zakladni`) | ✅ |
| Tělo (`/cs/studio/telo`) | ✅ |
| Životní styl (`/cs/studio/zivotni-styl`) | ✅ |
| Dostupnost (`/cs/studio/dostupnost`) | ✅ |
| Status profilu (`/cs/studio/profil-status`) | ✅ |

- ⚠️ **Fotky (`/cs/studio/fotky`)** — route existuje, ale **CHYBÍ v studio nav**

---

## 5. Login flow — přehled

### Admin login
- URL: `/[locale]/admin/login`
- Form action: `loginAdmin` (server action v `lib/auth-actions.ts`)
- Po úspěchu: `redirect('/admin')` (bez locale — potenciální problém viz výše)
- Po chybě: `redirect('/admin/login?error=invalid')`
- Role check: pouze `admin` nebo `manager`, jiné role odmítnuty

### Studio login
- URL: `/[locale]/studio/login`
- Form action: `loginGirl`
- Po úspěchu: `redirect('/studio')` (bez locale)
- Role check: pouze `girl`

### Logout
- `logoutAction()` — server action dostupná z obou sidebars
- Maže cookie → redirect na příslušný login podle předchozí role

---

## 6. TASK-9 verifikace (požadovaný QA)

### ✅ admin-actions.ts — všech 34 funkcí má auth guard:
- `updateGirl`, `createGirl`, `createGirlFromApplication`, `rejectApplication`, `reopenApplication`, `updateApplicationNotes`, `deleteGirl` → `requireAdmin()`
- `approvePhoto`, `rejectPhoto` → `requireAdmin()`
- `createPobocka`, `updatePobocka`, `deletePobocka` → `requireFullAdmin()`
- `updatePricingPlan`, `createPricingPlan`, `deletePricingPlan` → `requireFullAdmin()`
- `createPricingExtra`, `updatePricingExtra`, `deletePricingExtra` → `requireFullAdmin()`
- `createSleva`, `updateSleva`, `deleteSleva` → `requireFullAdmin()`
- `createFaq`, `updateFaq`, `deleteFaq` → `requireFullAdmin()`
- `approveStory`, `expireStory`, `deleteStory`, `createCategoryStory` → `requireAdmin()`
- `addGirlSchedule`, `deleteGirlSchedule`, `deleteAllSchedules`, `fixScheduleColors` → `requireAdmin()`
- `approveReview`, `rejectReview` → `requireAdmin()`

### ✅ dostupnost/actions.ts — 3 funkce mají `requireAdmin()`

### ✅ Cron routes — CRON_SECRET logika opravena (4/4):
```ts
if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
```

### ✅ GET /api/seo — nyní chráněno `requireAdmin()` (řádek 8)
### ✅ GET /api/pages — nyní chráněno `requireAdmin()` (řádek 7)

### ⚠️ /app/(admin)/admin/seo/page.tsx — stále BEZ server-side auth:
Tento soubor je `"use client"` komponenta mimo `[locale]/(admin)/` layout. Žádný `requireAdmin()` nebyl přidán. Stránka se načte pro nepřihlášeného uživatele (i když data z `/api/seo` GET jsou nyní chráněna → prázdný seznam).

---

## Souhrn nálezů

| # | Severity | Nález | Stav |
|---|----------|-------|------|
| 1 | HIGH | SESSION_SECRET fallback na Math.random() | Existující, neFixnuto |
| 2 | MEDIUM | `requireAdmin/requireGirl` redirect bez locale prefix | Existující, neFixnuto |
| 3 | MEDIUM | Nav položky CMS, Audit log, Nastavení → 404 | Existující |
| 4 | LOW | Rezervace existuje jako route, chybí v admin nav | Existující |
| 5 | LOW | Fotky existují jako studio route, chybí v studio nav | Existující |
| 6 | LOW | `/admin/seo` stránka bez server-side auth (data jsou chráněna API) | Částečně fixnuto |
| 7 | ✅ | Všech 34 admin-actions mají requireAdmin/requireFullAdmin | FIXNUTO (TASK-9) |
| 8 | ✅ | Cron routes CRON_SECRET logika opravena | FIXNUTO (TASK-9) |
| 9 | ✅ | GET /api/seo + /api/pages chráněny | FIXNUTO (TASK-9) |
