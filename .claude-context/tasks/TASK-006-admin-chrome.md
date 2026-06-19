# TASK-006: Admin panel — Chrome test + kódový audit
# URL: https://escx23.vercel.app
# Datum: 2026-05-29

---

## Chrome test — Auth ochrana (HTTP checks na Vercel)

Všechny admin routes správně chráněny. Bez přihlášení → 307 → /admin/login.

```
307 /cs/admin
307 /cs/admin/divky
307 /cs/admin/aplikace
307 /cs/admin/schedules
307 /cs/admin/verifikace
307 /cs/admin/recenze
307 /cs/admin/clenove
307 /cs/admin/pobocky
307 /cs/admin/stories
307 /cs/admin/cenik
307 /cs/admin/slevy
307 /cs/admin/faq
307 /cs/admin/rezervace
307 /cs/admin/og
404 /cs/admin/seo   ← BROKEN (viz P1 níže)
```

I bez locale (/admin/divky atd.) → 307 → /admin/login ✅

## Chrome test — Admin login stránka

- /admin/login i /cs/admin/login → HTTP 200, h1 "Vítej zpět", forma s emailem + heslem ✅
- Login → Server Action `loginAdmin` → po úspěchu redirect na `/admin`
- Chybné heslo → /admin/login?error=invalid → zobrazí error box ✅

## BLOKUJÍCÍ: Admin heslo není dostupné

Admin password pro `info@lovelygirls.cz` na https://escx23.vercel.app není v `.env.local`
ani `.env`. Auth používá bcrypt hash z Turso DB.

**Interaktivní browser test (klikání po panelu) NELZE dokončit bez hesla.**
Heslo lze nastavit skriptem: `node scripts/set-admin-password.mjs <heslo>`

## Nalezené problémy (HTTP + kódový audit)

### P1 (HIGH): SEO admin link → 404
- AdminSidebar (`components/admin/AdminSidebar.tsx:29`) odkazuje na `/cs/admin/seo`
- `/cs/admin/seo` → HTTP 404 (ověřeno na Vercel)
- Stránka existuje v `app/(admin)/admin/seo/page.tsx` ale v route group `(admin)` **mimo** `[locale]`
- next-intl middleware ji nerozpozná → 404
- **Fix:** přesunout `app/(admin)/admin/seo/` do `app/[locale]/(admin)/admin/seo/`

### P2 (LOW): Sidebar hardcoduje `/cs/` locale
- `AdminSidebar.tsx` má všech 15 nav linků s `/cs/admin/...` prefixem
- Admin v EN/DE/UK locale bude mít nefunkční navigaci
- Pro aktuální provoz (pouze CS) není okamžitý problém

### P3 (LOW): Auth redirect bez callbackUrl
- `loginAdmin` (`lib/auth-actions.ts:17`) vždy přesměruje na `/admin` po přihlášení
- Pokud uživatel přišel na `/cs/admin/faq` a byl vyhozen na login, po přihlášení jde na `/admin` (dashboard), ne zpět na FAQ

---

## Statický kódový audit  
**Kontrolor:** kontrolor  
**Metoda:** Statická analýza kódu (browser test na escx23.vercel.app nutno doplnit test-chrome)

---

## 1. Dashboard — statistiky

**Stav: ✅ Implementováno**

`getAdminDashboardStats()` v `lib/queries.ts:566` vrací:
- Aktivní dívky, celkem dívek, nové za 30 dní
- Pending recenze, celkem recenzí
- Pending přihlášky
- Celkem fotek

Zobrazeno jako `StatCard` komponenty + sekce "Rychlé akce" (linky na verifikace, recenze, aplikace).

### Nález ⚠️
Dashboard stat "Pending fotek" (`pendingPhotos`) je počítán jako `SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END)` — tedy **všechny non-primary fotky**, ne skutečně "pending/neverifikované" fotky. Toto číslo bude vždy vysoké a zavádějící (každá galerie má spoustu non-primary fotek). Dashboard zobrazuje tuto hodnotu ale **neuvádí** ji jako StatCard (zobrazuje jen aktivní dívky, pending recenze, pending přihlášky, total dívek, total fotek, total recenzí) — takže na UI to není vidět.

---

## 2. Správa dívek — CRUD

**Stav: ✅ Kompletní CRUD**

| Route | Soubor | Funkce |
|-------|--------|--------|
| `/admin/divky` | `divky/page.tsx` | Seznam všech dívek s DataTable, filtry (status), search |
| `/admin/divky/nova` | `divky/nova/page.tsx` | Přidání nové dívky |
| `/admin/divky/[id]` | `divky/[id]/page.tsx` | Detail dívky |
| `/admin/divky/[id]/edit` | `divky/[id]/edit/page.tsx` | Editace profilu |
| `/admin/divky/[id]/fotky` | `divky/[id]/fotky/page.tsx` | Správa fotek |
| `/admin/divky/[id]/videa` | `divky/[id]/videa/page.tsx` | Videa (placeholder — sprint) |
| `/admin/divky/[id]/dostupnost` | `divky/[id]/dostupnost/page.tsx` | Týdenní rozvrh |
| `/admin/divky/[id]/dostupnost/den/[date]` | `...` | Denní override |

Všechny CRUD akce (`updateGirl`, `createGirl`, `deleteGirl`) mají auth guard od TASK-9. ✅

---

## 3. Správa fotek — verifikace

**Stav: ✅ Implementováno**

`/admin/verifikace` — zobrazuje frontu fotek, akce: Schválit / Zamítnout (server actions `approvePhoto`, `rejectPhoto`).

### Nález ⚠️ MEDIUM
`getPendingPhotos()` query (`lib/queries.ts:794`) vrací **VŠECHNY non-primary fotky** (`WHERE is_primary = 0`), ne jen čekající na verifikaci. Pokud DB nemá sloupec `verified` nebo `status` na `girl_photos`, verifikační fronta bude obsahovat tisíce fotek a bude nepoužitelná v reálu.

Sloupec `verified` na `girl_photos` neexistuje v Secretstory exportu (pouze `is_primary`, `display_order`). Toto je architektonické omezení Sprint 1 schématu.

---

## 4. Správa recenzí

**Stav: ✅ Implementováno**

`/admin/recenze` — zobrazuje pending recenze, akce: Schválit / Zamítnout (`approveReview`, `rejectReview`).

`getPendingReviews()` správně filtruje `WHERE status = 'pending'`. ✅

---

## 5. Rozvrhy

**Stav: ✅ Implementováno**

`/admin/schedules` — zobrazuje všechny dívky s jejich týdenním rozvrhem, editace dnů a časů.

Akce: `addGirlSchedule`, `deleteGirlSchedule`, `deleteAllSchedules`, `fixScheduleColors` — všechny s auth guard. ✅

Denní override: `/admin/divky/[id]/dostupnost/den/[date]` — nastavení výjimky pro konkrétní den. ✅

---

## 6. Přihlášky (Aplikace)

**Stav: ✅ Implementováno**

`/admin/aplikace` — seznam přihlášek s filtrem (pending/approved/rejected/all), badge s počtem pending.

`/admin/aplikace/[id]` — detail přihlášky s akcemi:
- `rejectApplication` — zamítnout
- `reopenApplication` — znovu otevřít
- `updateApplicationNotes` — poznámky
- `createGirlFromApplication` — schválit + vytvořit profil dívky

Všechny akce s auth guard. ✅

---

## 7. Stories

**Stav: ✅ Implementováno**

`/admin/stories` — seznam stories, akce: Schválit / Expire / Smazat. Plus možnost přidat "category story".

Akce: `approveStory`, `expireStory`, `deleteStory`, `createCategoryStory` — s auth guard. ✅

---

## 8. Bookings (Rezervace)

**Stav: ✅ Implementováno (read-only)**

`/admin/rezervace` — seznam rezervací z `getBookings()` query.

### Nález ⚠️
Stránka je **read-only** — žádné akce (žádné tlačítko pro změnu statusu, zrušení, atd.). Pro Sprint 1 akceptovatelné, ale pro produkci bude potřeba přidat CRUD.

Navíc **chybí v admin nav** (AdminSidebar) — uživatel se sem dostane jen přímou URL. *(Nález z TASK-005)*

---

## 9. SEO admin

**Stav: ⚠️ Funkční ale mimo auth layout**

`/admin/seo` a `/admin/seo/edit` jsou v `app/(admin)/admin/seo/` — **mimo `[locale]/(admin)/` layout**, tedy bez server-side auth ochrany layoutu.

Data jsou chráněna (GET/POST/DELETE `/api/seo` nyní vyžaduje auth — opraveno v TASK-9). Stránka samotná se načte nepřihlášenému ale zobrazí prázdný seznam.

Stránky jsou `"use client"` SPA — načítají data přes fetch z `/api/seo`. ✅ funkčnost

---

## 10. Navigace — přehled (aktuální stav AdminSidebar)

AdminSidebar má přesně 15 položek (CMS / Audit log / Nastavení byly odstraněny):

| Nav položka | HTTP status (bez auth) | Poznámka |
|-------------|----------------------|----------|
| Dashboard | 307 → login | ✅ |
| Dívky | 307 → login | ✅ S pending badge |
| Aplikace | 307 → login | ✅ |
| Rozvrhy | 307 → login | ✅ |
| Verifikace fotek | 307 → login | ✅ |
| Recenze | 307 → login | ✅ |
| Členové | 307 → login | ✅ |
| Pobočky | 307 → login | ✅ |
| Stories | 307 → login | ✅ |
| Ceník | 307 → login | ✅ |
| Slevy | 307 → login | ✅ |
| FAQ | 307 → login | ✅ |
| Rezervace | 307 → login | ✅ |
| OG Images | 307 → login | ✅ |
| SEO | **404** | ❌ viz P1 |

---

## Souhrn nálezů

| # | Severity | Oblast | Nález |
|---|----------|--------|-------|
| 1 | HIGH | SEO admin link | `/cs/admin/seo` → 404. Sidebar link broken. Fix: přesunout route do `[locale]/(admin)/` |
| 2 | MEDIUM | Verifikace fotek | `getPendingPhotos()` vrací všechny non-primary fotky, ne jen "pending" — fronta bude nepřesná |
| 3 | LOW | Sidebar locale | Sidebar hardcoduje `/cs/` — nefunkční pro EN/DE/UK adminy |
| 4 | LOW | Auth redirect | Po přihlášení vždy `/admin`, ne původní stránka |
| 5 | LOW | Rezervace read-only | Žádné akce pro změnu statusu booking |

**Celkový stav admin panelu: FUNKČNÍ pro Sprint 1.** 14 z 15 nav položek dostupných (SEO je jediný broken link). Všechny CRUD operace implementovány a chráněny auth guardem.

---

## Interaktivní test — status: BLOKOVÁNO

Vyžaduje admin heslo pro `info@lovelygirls.cz` na https://escx23.vercel.app.
Heslo není v .env.local. Nastavit lze: `node scripts/set-admin-password.mjs <heslo>`
