# FULL STATUS REPORT — www.lovelygirls.cz
**Datum:** 2026-06-14  
**Kontrolor:** kontrolor agent

---

## 1. BUILD

✅ **PASSED** — `npm run build` compiled successfully, 295 static pages generated, 0 errors, 0 warnings.

---

## 2. AUTH / MIDDLEWARE

### Middleware (`middleware.ts`)
✅ next-intl routing správně, `x-pathname` header nastaveno pro getLocale()  
✅ Matcher vylučuje api, _next, statické soubory  

### Admin auth (`app/[locale]/(admin)/admin/layout.tsx`)
✅ Layout má `requireAdmin()` — chrání CELÝ `/admin/*` subtree  
✅ Manager role-check — přesměruje na dashboard pokud přistoupí na admin-only stránky  
✅ Login stránka správně exempt z auth  

### Studio auth (`app/[locale]/studio/layout.tsx`)
✅ Layout má `requireGirl()` — chrání CELÝ `/studio/*` subtree  
✅ Login stránka správně exempt  

### Auth logic (`lib/auth.ts`, `lib/auth-actions.ts`)
✅ SESSION_SECRET HMAC signing — varování v produkci pokud není nastaveno  
✅ Locale prefix ve všech redirect (`/${locale}/admin`, `/${locale}/studio`)  
✅ `requireAdmin`, `requireFullAdmin`, `requireGirl` — vše správně  
✅ Cookie: `httpOnly: true`, `secure: true` v prod, `sameSite: 'lax'`  

---

## 3. VEŘEJNÉ STRÁNKY

| Stránka | generateMetadata | canonical | hreflang | OG | Status |
|---|---|---|---|---|---|
| `/` homepage | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/divky` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/profil/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/cenik` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/faq` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/blog` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/blog/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/recenze` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rozvrh` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/slevy` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/o-nas` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/kontakt` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/podminky` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/soukromi` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/hashtag/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/sluzba/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/pobocka/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/join` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/clenstvi/zadost` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/recenze/nova/[slug]` | ⚠️ žádná generateMetadata | — | — | — | ⚠️ chybí SEO meta, má `robots: noindex` |

### Poznámka k `/recenze/nova/[slug]`
Stránka má statické `metadata: { robots: { index: false } }` — záměrně noindex. generateMetadata tedy není potřeba — jen noindex metadata. ✅ OK

---

## 4. is_new — KRITICKÝ STAV

### `computeIsNew` funkce (lib/queries.ts:15)
✅ Správně implementovaná: `is_new=1 → true`, fallback na `created_at < 30 dní`

### Stav po funkcích:

| Funkce | `g.is_new` v SQL SELECT | `computeIsNew` volána | Funguje? |
|---|---|---|---|
| `getGirlsForService` (ř. 66) | ✅ | ✅ (ř. 114) | ✅ |
| `getGirlsWithToday` (ř. 164) | ✅ | ✅ (ř. 209) | ✅ |
| `getGirlsForDay` (ř. 621) | ❌ CHYBÍ | ✅ (ř. 665) | ❌ r.is_new = undefined |
| `getGirlsForListing` (ř. 1665) | ❌ CHYBÍ | ✅ (ř. 1737) | ❌ r.is_new = undefined |
| `getGirlsForHashtag` (ř. 1777) | ❌ CHYBÍ | ✅ (ř. 1823) | ❌ r.is_new = undefined |

**Dopad:**
- `/divky` listing (`getGirlsForListing`) — Kim nebude mít NOVÁ badge ani po admin nastavení `is_new=1`
- `/hashtag/*` stránky — stejný problém
- `/rozvrh` (`getGirlsForDay`) — stejný problém

**Oprava — 3 řádky v lib/queries.ts:**
```
řádek 621: změnit  g.created_at, g.languages,
           na      g.created_at, g.is_new, g.languages,

řádek 1665: změnit g.created_at, g.languages, g.rating,
            na     g.created_at, g.is_new, g.languages, g.rating,

řádek 1777: změnit g.created_at, g.languages, g.hashtags,
            na     g.created_at, g.is_new, g.languages, g.hashtags,
```

---

## 5. ADMIN STRÁNKY

✅ Všechny chráněny přes `admin/layout.tsx` → `requireAdmin()`  
✅ Manager role: může přistoupit jen na MANAGER_ALLOWED_PATHS  
✅ 25 stránek má navíc individuální `requireAdmin`/`requireFullAdmin` (double protection)  

Všechny admin stránky nalezeny a přítomny:
- divky CRUD (list, detail, edit, fotky, videa, dostupnost, den override) ✅
- blog CRUD ✅, blog tagy CRUD ✅
- cenik (plany, extras) CRUD ✅
- slevy CRUD ✅, faq CRUD ✅, pobocky CRUD ✅
- recenze, rezervace, verifikace, schedules, stories ✅
- seo editor, og editor, clenove, aplikace ✅

---

## 6. STUDIO STRÁNKY

✅ Všechny chráněny přes `studio/layout.tsx` → `requireGirl()`  

Nalezeny stránky (19):
dostupnost, fotky, hashtagy, hlas, jazyky, kalendar, login, hlavní, profil-status, program, recenze, rezervace, sluzby, statistiky, stories, telo, zakladni, zivotni-styl, zprava ✅

---

## 7. API ROUTES

| Route | Ochrana | Status |
|---|---|---|
| `/api/admin/seo/upload-image` | ✅ `requireAdmin` | ✅ |
| `/api/seo` | ✅ auth check | ✅ |
| `/api/pages` | ✅ auth check | ✅ |
| `/api/gcal/auth` | ✅ `getCurrentUser` | ✅ |
| `/api/gcal/callback` | ✅ oauth_states lookup | ✅ |
| `/api/gcal/disconnect` | ✅ `getCurrentUser` | ✅ |
| `/api/cron/cleanup-old-overrides` | ✅ CRON_SECRET | ✅ |
| `/api/cron/expire-loyalty-discounts` | ✅ CRON_SECRET | ✅ |
| `/api/cron/expire-stories` | ✅ CRON_SECRET | ✅ |
| `/api/cron/recalc-stats` | ✅ CRON_SECRET | ✅ |

---

## 8. HARDCODED HODNOTY / DOMAIN

✅ `lovelygirls.cz` (bez www) v kódu jen na 4 místech — všechna záměrná:
- `lib/watermark.ts:22` — watermark text na fotky (záměrné, bez www)
- `lib/seo/og-template.tsx:20` — OG image brand URL (záměrné, bez www)
- `app/[locale]/opengraph-image.tsx:92` — OG image brand text (záměrné)
- `app/[locale]/(admin)/admin/login/page.tsx:277` — email placeholder (záměrné)

✅ `next.config.ts` — 301 redirect `lovelygirls.cz → www.lovelygirls.cz` ✅  
✅ `next.config.ts` — 301 redirect `escx23.vercel.app → www.lovelygirls.cz` ✅  

---

## 9. CELKOVÉ SHRNUTÍ

| Oblast | Status |
|---|---|
| Build | ✅ PASSED |
| TypeScript | ✅ PASSED |
| Middleware | ✅ |
| Admin auth (layout guard) | ✅ |
| Studio auth (layout guard) | ✅ |
| Auth logic (login/logout/redirects) | ✅ |
| Všechny veřejné stránky — SEO meta | ✅ |
| Všechny veřejné stránky — canonical | ✅ |
| Všechny veřejné stránky — hreflang | ✅ |
| API routes — ochrana | ✅ |
| Domain redirects | ✅ |
| is_new — getGirlsForService | ✅ |
| is_new — getGirlsWithToday | ✅ |
| is_new — getGirlsForDay | ❌ g.is_new chybí v SELECT |
| is_new — getGirlsForListing | ❌ g.is_new chybí v SELECT |
| is_new — getGirlsForHashtag | ❌ g.is_new chybí v SELECT |

---

## 10. JEDINÁ ZBÝVAJÍCÍ OPRAVA

**lib/queries.ts — 3 jednořádkové změny:**

```diff
# getGirlsForDay — řádek 621
-       g.created_at, g.languages, g.rating, g.reviews_count,
+       g.created_at, g.is_new, g.languages, g.rating, g.reviews_count,

# getGirlsForListing — řádek 1665
-       g.created_at, g.languages, g.rating, g.reviews_count, g.status,
+       g.created_at, g.is_new, g.languages, g.rating, g.reviews_count, g.status,

# getGirlsForHashtag — řádek 1777
-       g.created_at, g.languages, g.hashtags, g.rating, g.reviews_count,
+       g.created_at, g.is_new, g.languages, g.hashtags, g.rating, g.reviews_count,
```

Po těchto 3 změnách je is_new plně funkční ve všech 5 funkcích.
