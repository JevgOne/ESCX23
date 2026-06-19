# TASK-009 QA Report: Auth guards do admin actions

**Datum:** 2026-05-29  
**Kontrolor:** kontrolor

---

## 1. lib/admin-actions.ts — všechny exportované async funkce

Celkem 34 exportovaných async funkcí. Každá má auth guard na prvním řádku těla.

| Funkce | Auth guard | Správný level? |
|--------|-----------|----------------|
| `updateGirl` | `requireAdmin()` | ✅ |
| `createGirl` | `requireAdmin()` | ✅ |
| `createGirlFromApplication` | `requireAdmin()` | ✅ |
| `rejectApplication` | `requireAdmin()` | ✅ |
| `reopenApplication` | `requireAdmin()` | ✅ |
| `updateApplicationNotes` | `requireAdmin()` | ✅ |
| `deleteGirl` | `requireAdmin()` | ✅ |
| `approvePhoto` | `requireAdmin()` | ✅ |
| `rejectPhoto` | `requireAdmin()` | ✅ |
| `createPobocka` | `requireFullAdmin()` | ✅ |
| `updatePobocka` | `requireFullAdmin()` | ✅ |
| `deletePobocka` | `requireFullAdmin()` | ✅ |
| `updatePricingPlan` | `requireFullAdmin()` | ✅ |
| `createPricingPlan` | `requireFullAdmin()` | ✅ |
| `deletePricingPlan` | `requireFullAdmin()` | ✅ |
| `createPricingExtra` | `requireFullAdmin()` | ✅ |
| `updatePricingExtra` | `requireFullAdmin()` | ✅ |
| `deletePricingExtra` | `requireFullAdmin()` | ✅ |
| `createSleva` | `requireFullAdmin()` | ✅ |
| `updateSleva` | `requireFullAdmin()` | ✅ |
| `deleteSleva` | `requireFullAdmin()` | ✅ |
| `createFaq` | `requireFullAdmin()` | ✅ |
| `updateFaq` | `requireFullAdmin()` | ✅ |
| `deleteFaq` | `requireFullAdmin()` | ✅ |
| `approveStory` | `requireAdmin()` | ✅ |
| `expireStory` | `requireAdmin()` | ✅ |
| `deleteStory` | `requireAdmin()` | ✅ |
| `createCategoryStory` | `requireAdmin()` | ✅ |
| `addGirlSchedule` | `requireAdmin()` | ✅ |
| `deleteGirlSchedule` | `requireAdmin()` | ✅ |
| `deleteAllSchedules` | `requireAdmin()` | ✅ |
| `fixScheduleColors` | `requireAdmin()` | ✅ |
| `approveReview` | `requireAdmin()` | ✅ |
| `rejectReview` | `requireAdmin()` | ✅ |

**Výsledek: ✅ 34/34 funkcí chráněno**

Role assignment je správný: Pobočky, ceník, slevy, FAQ → `requireFullAdmin()` (manažer nemá přístup). Operace s dívkami, fotky, recenze, stories, rozvrhy → `requireAdmin()` (manažer může).

---

## 2. dostupnost/actions.ts — 3 akce

| Funkce | Auth guard |
|--------|-----------|
| `saveWeeklySchedule` | ✅ `requireAdmin()` (řádek 15) |
| `setTodayOff` | ✅ `requireAdmin()` (řádek 64) |
| `applyMonthBulk` | ✅ `requireAdmin()` (řádek 86) |

**Výsledek: ✅ 3/3 akcí chráněno**

---

## 3. app/api/seo/route.ts — GET handler

```ts
// GET /api/seo
const isAuth = await requireAdmin().catch(() => null);
if (!isAuth) {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

**Výsledek: ✅ GET /api/seo chráněn** (řádek 8)

Poznámka: POST a DELETE handlery byly chráněny již dříve. Nyní jsou chráněny všechny 3 metody.

---

## 4. app/api/pages/route.ts — GET handler

```ts
// GET /api/pages
const isAuth = await requireAdmin().catch(() => null);
if (!isAuth) {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

**Výsledek: ✅ GET /api/pages chráněn** (řádek 7)

---

## 5. app/api/cron/*/route.ts — auth logika

Všechny 4 cron routes mají opravenou podmínku:

| Soubor | Stará logika | Nová logika |
|--------|-------------|-------------|
| `expire-stories` | `if (CRON_SECRET && auth !== ...)` | ✅ `if (!CRON_SECRET \|\| auth !== ...)` |
| `cleanup-old-overrides` | `if (CRON_SECRET && auth !== ...)` | ✅ `if (!CRON_SECRET \|\| auth !== ...)` |
| `recalc-stats` | `if (CRON_SECRET && auth !== ...)` | ✅ `if (!CRON_SECRET \|\| auth !== ...)` |
| `expire-loyalty-discounts` | `if (CRON_SECRET && auth !== ...)` | ✅ `if (!CRON_SECRET \|\| auth !== ...)` |

**Výsledek: ✅ 4/4 cron routes opraveny** — endpointy jsou nyní vždy chráněny (pokud CRON_SECRET není nastaven, vrátí 401)

---

## 6. npm run build + npm run typecheck

### Build
**Výsledek: ✅ PASS** (exit 0, 221 stránek)

Změna oproti předchozímu buildu: `/admin/seo` a `/admin/seo/edit` jsou nyní `ƒ (Dynamic)` místo dřívějšího `○ (Static)` — pravděpodobně důsledek přidání auth checku nebo jiné změny v těchto stránkách.

Warningy: Stejné jako dříve — `blog_posts` tabulka (non-fatal, expected).

### TypeScript
**Výsledek: ✅ PASS** (exit 0, 0 chyb)

Poznámka: `tsconfig.json` byl mezitím opraven — `.next/` typy jsou nyní správně includovány a `tsc --noEmit --skipLibCheck` prochází čistě.

---

## Závěr reverzní kontroly (zadání vs. výsledek)

| Bod zadání | Status | Detail |
|-----------|--------|--------|
| lib/admin-actions.ts — každá funkce má auth guard | ✅ | 34/34 |
| dostupnost/actions.ts — 3 akce mají auth guard | ✅ | 3/3 |
| GET /api/seo má auth | ✅ | requireAdmin() na řádku 8 |
| GET /api/pages má auth | ✅ | requireAdmin() na řádku 7 |
| Cron routes — auth logika opravena | ✅ | 4/4 |
| npm run build — nic se nerozbilo | ✅ | exit 0 |
| npm run typecheck — nic se nerozbilo | ✅ | exit 0 |

**TASK-9: APPROVED ✅** — všechny požadované změny jsou implementovány správně, build a typecheck prochází.

### Zbývající otevřená věc (mimo scope TASK-9)
- `/app/(admin)/admin/seo/page.tsx` — stále `"use client"` bez server-side auth. Data jsou chráněna (GET /api/seo nyní vrátí 401), ale stránka samotná se načte pro nepřihlášeného uživatele (zobrazí prázdný seznam). Nízká priorita.
