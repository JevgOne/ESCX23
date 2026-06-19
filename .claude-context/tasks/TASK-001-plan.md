# TASK-001: Kompletni audit codebase — routes, auth, forms, API, bezpecnostni rizika

**Datum:** 2026-05-29
**Status:** Hotovo

---

## 1. MAPA ROUTES

### 1.1 Public routes (`app/[locale]/...`)

| Route | Soubor | Dynamic? | Popis |
|-------|--------|----------|-------|
| `/[locale]` | `page.tsx` | ISR | Homepage |
| `/[locale]/divky` | `divky/page.tsx` | force-dynamic | Seznam divek s filtry |
| `/[locale]/profil/[slug]` | `profil/[slug]/page.tsx` | force-dynamic | Profil divky |
| `/[locale]/cenik` | `cenik/page.tsx` | static | Cenik |
| `/[locale]/slevy` | `slevy/page.tsx` | static | Slevy |
| `/[locale]/faq` | `faq/page.tsx` | static | FAQ |
| `/[locale]/rozvrh` | `rozvrh/page.tsx` | force-dynamic | Rozvrh na 7 dni |
| `/[locale]/kontakt` | `kontakt/page.tsx` | - | Kontakt |
| `/[locale]/o-nas` | `o-nas/page.tsx` | static | O nas |
| `/[locale]/podminky` | `podminky/page.tsx` | static | Podminky |
| `/[locale]/soukromi` | `soukromi/page.tsx` | static | Ochrana udaju |
| `/[locale]/blog` | `blog/page.tsx` | ISR (3600s) | Blog index |
| `/[locale]/blog/[slug]` | `blog/[slug]/page.tsx` | ISR (3600s) | Blog detail |
| `/[locale]/hashtag/[slug]` | `hashtag/[slug]/page.tsx` | force-dynamic | Landing page pro hashtag |
| `/[locale]/pobocka/[slug]` | `pobocka/[slug]/page.tsx` | - | Detail pobocky |
| `/[locale]/sluzba/[slug]` | `sluzba/[slug]/page.tsx` | force-dynamic | Detail sluzby |
| `/[locale]/recenze/nova/[slug]` | `recenze/nova/[slug]/page.tsx` | force-dynamic | Formular recenze |
| `/[locale]/join` | `join/page.tsx` | - | Prihlaska divky |
| `/[locale]/join/success` | `join/success/page.tsx` | - | Uspesne odeslano |
| `/[locale]/clenstvi/zadost` | `clenstvi/zadost/page.tsx` | - | Zadost o clenstvi |
| `/[locale]/clenstvi/zadost/odeslano` | `clenstvi/zadost/odeslano/page.tsx` | - | Potvrzeni |

### 1.2 Studio routes (`app/[locale]/studio/...`)

Chraneno pres `studio/layout.tsx` → `requireGirl()`.

| Route | Soubor | Popis |
|-------|--------|-------|
| `/[locale]/studio/login` | `studio/login/page.tsx` | Login pro divky (vyjimka z auth) |
| `/[locale]/studio` | `studio/page.tsx` | Dashboard |
| `/[locale]/studio/zakladni` | `studio/zakladni/page.tsx` | Zakladni udaje |
| `/[locale]/studio/telo` | `studio/telo/page.tsx` | Telesne parametry |
| `/[locale]/studio/zivotni-styl` | `studio/zivotni-styl/page.tsx` | Zivotni styl |
| `/[locale]/studio/fotky` | `studio/fotky/page.tsx` | Sprava fotek |
| `/[locale]/studio/dostupnost` | `studio/dostupnost/page.tsx` | Nastaveni dostupnosti |
| `/[locale]/studio/profil-status` | `studio/profil-status/page.tsx` | Status profilu |

### 1.3 Admin routes (`app/[locale]/(admin)/admin/...`)

Chraneno pres `admin/layout.tsx` → `requireAdmin()` + manager role check.

| Route | Soubor | Manager pristup? | Popis |
|-------|--------|-------------------|-------|
| `/[locale]/admin/login` | `admin/login/page.tsx` | - (vyjimka) | Login |
| `/[locale]/admin` | `admin/page.tsx` | ANO | Dashboard |
| `/[locale]/admin/divky` | `admin/divky/page.tsx` | ANO | Seznam divek |
| `/[locale]/admin/divky/[id]` | `admin/divky/[id]/page.tsx` | ANO | Detail divky |
| `/[locale]/admin/divky/[id]/edit` | `admin/divky/[id]/edit/page.tsx` | ANO | Editace divky |
| `/[locale]/admin/divky/[id]/fotky` | `admin/divky/[id]/fotky/page.tsx` | ANO | Fotky divky |
| `/[locale]/admin/divky/[id]/videa` | `admin/divky/[id]/videa/page.tsx` | ANO | Videa divky |
| `/[locale]/admin/divky/[id]/dostupnost` | `admin/divky/[id]/dostupnost/page.tsx` | ANO | Dostupnost divky |
| `/[locale]/admin/divky/[id]/dostupnost/den/[date]` | `.../den/[date]/page.tsx` | ANO | Denni override |
| `/[locale]/admin/divky/nova` | `admin/divky/nova/page.tsx` | ANO | Nova divka |
| `/[locale]/admin/aplikace` | `admin/aplikace/page.tsx` | ANO | Prihlasky |
| `/[locale]/admin/aplikace/[id]` | `admin/aplikace/[id]/page.tsx` | ANO | Detail prihlasky |
| `/[locale]/admin/cenik` | `admin/cenik/page.tsx` | NE | Sprava ceniku |
| `/[locale]/admin/cenik/plany/[id]` | `.../plany/[id]/page.tsx` | NE | Edit plan |
| `/[locale]/admin/cenik/extras/[id]` | `.../extras/[id]/page.tsx` | NE | Edit extra |
| `/[locale]/admin/cenik/nova-plan` | `.../nova-plan/page.tsx` | NE | Novy plan |
| `/[locale]/admin/cenik/nova-extra` | `.../nova-extra/page.tsx` | NE | Nova extra |
| `/[locale]/admin/faq` | `admin/faq/page.tsx` | NE | Sprava FAQ |
| `/[locale]/admin/faq/[id]` | `admin/faq/[id]/page.tsx` | NE | Edit FAQ |
| `/[locale]/admin/faq/nova` | `admin/faq/nova/page.tsx` | NE | Nova FAQ |
| `/[locale]/admin/slevy` | `admin/slevy/page.tsx` | NE | Sprava slev |
| `/[locale]/admin/slevy/[id]` | `admin/slevy/[id]/page.tsx` | NE | Edit sleva |
| `/[locale]/admin/slevy/nova` | `admin/slevy/nova/page.tsx` | NE | Nova sleva |
| `/[locale]/admin/pobocky` | `admin/pobocky/page.tsx` | NE | Sprava pobocek |
| `/[locale]/admin/pobocky/[id]` | `admin/pobocky/[id]/page.tsx` | NE | Edit pobocka |
| `/[locale]/admin/pobocky/nova` | `admin/pobocky/nova/page.tsx` | NE | Nova pobocka |
| `/[locale]/admin/recenze` | `admin/recenze/page.tsx` | ANO | Sprava recenzi |
| `/[locale]/admin/rezervace` | `admin/rezervace/page.tsx` | NE | Rezervace |
| `/[locale]/admin/schedules` | `admin/schedules/page.tsx` | ANO | Rozvrhy |
| `/[locale]/admin/verifikace` | `admin/verifikace/page.tsx` | ANO | Verifikace fotek |
| `/[locale]/admin/stories` | `admin/stories/page.tsx` | ANO | Stories |
| `/[locale]/admin/clenove` | `admin/clenove/page.tsx` | NE | Clenove |
| `/[locale]/admin/og` | `admin/og/page.tsx` | NE | OG image gen |

### 1.4 NECHRANNE admin routes (`app/(admin)/admin/...`) -- BEZ [locale], BEZ admin layout!

| Route | Soubor | Auth? | RIZIKO |
|-------|--------|-------|--------|
| `/admin/seo` | `app/(admin)/admin/seo/page.tsx` | ZADNA | **KRITICKE** — pristup bez prihlaseni |
| `/admin/seo/edit` | `app/(admin)/admin/seo/edit/page.tsx` | ZADNA | **KRITICKE** — editace bez prihlaseni |

### 1.5 API routes

| Route | Metody | Auth? | Popis |
|-------|--------|-------|-------|
| `GET /api/pages` | GET | ZADNA | Vraci seznam vsech stranek |
| `GET /api/seo` | GET | ZADNA | Vraci vsechna SEO metadata |
| `POST /api/seo` | POST | requireAdmin | Vytvori/upravi SEO |
| `DELETE /api/seo` | DELETE | requireAdmin | Smaze SEO |
| `GET /api/cron/cleanup-old-overrides` | GET | CRON_SECRET | Smaze stare overrides |
| `GET /api/cron/expire-stories` | GET | CRON_SECRET | Expiruje stories |
| `GET /api/cron/expire-loyalty-discounts` | GET | CRON_SECRET | Expiruje loyalty slevy |
| `GET /api/cron/recalc-stats` | GET | CRON_SECRET | Prepocita rating/reviews |
| `GET /llms.txt` | GET | ZADNA (public) | LLM crawler file |

### 1.6 Middleware

- Soubor: `proxy.ts` (NE `middleware.ts`)
- **PROBLEM:** Next.js ocekava `middleware.ts` v rootu. `proxy.ts` se pravdepodobne NEPOUZIVA jako middleware. Pouze `next-intl` plugin ve `next.config.ts` resi i18n routing, ale custom middleware logika (x-pathname header) nefunguje.
- **UPDATE:** .next/server/middleware.js existuje, takze je mozne ze build system to resi. Nicmene pojmenovani je nekonvencni.

---

## 2. AUTH SYSTEM

### 2.1 Architektura

- **Vlastni implementace** (ne NextAuth) — HMAC-signed session token v cookie.
- Cookie: `escx23_session`, httpOnly, SameSite=Lax, Secure v produkci.
- Token format: `base64url(userId.role.exp.hmac_sig)`
- Platnost: 30 dni.
- Secret: `process.env.SESSION_SECRET` s dev fallback `'dev-secret-change-in-prod-' + Math.random()`.

### 2.2 Role

| Role | Pristup | Guard funkce |
|------|---------|--------------|
| `admin` | Vsude v admin panelu | `requireAdmin()`, `requireFullAdmin()` |
| `manager` | Omezeny admin (divky, aplikace, schedules, verifikace, recenze, stories) | `requireAdmin()` + `isManagerAllowed()` v layout |
| `girl` | Studio self-service | `requireGirl()` |

### 2.3 Auth flow

1. `/admin/login` → form POST → `loginAdmin()` server action → `authenticate()` → `setSession()` → redirect `/admin`
2. `/studio/login` → form POST → `loginGirl()` server action → `authenticate()` → `setSession()` → redirect `/studio`
3. Logout: `logoutAction()` → `clearSession()` → redirect

### 2.4 Auth ochrana stránek

- **Admin layout** (`app/[locale]/(admin)/admin/layout.tsx`): vola `requireAdmin()` pro vsechny stranky krome `/admin/login`. Manager role check pres `isManagerAllowed()`.
- **Studio layout** (`app/[locale]/studio/layout.tsx`): vola `requireGirl()` pro vsechny krome `/studio/login`.
- **PROBLEM:** Tyto layouty chrani pouze STRANKY (rendering). NECHRANI server actions definovane v `lib/admin-actions.ts`.

---

## 3. FORMULARE A SERVER ACTIONS

### 3.1 Verejne formulare (zadna auth)

| Akce | Soubor | Form? | Validace |
|------|--------|-------|----------|
| `submitApplication` | `app/[locale]/join/actions.ts` | ANO | Name, phone, age 18-70 |
| `submitMemberApplication` | `app/[locale]/clenstvi/zadost/actions.ts` | ANO | Email contains @ |
| `submitReview` | `app/[locale]/recenze/nova/[slug]/page.tsx` | ANO (inline server action) | Rating 1-5, text min 10 chars, nickname required |
| `setAgeVerified` | `lib/age-gate-actions.ts` | ANO (button) | Zadna — nastavi cookie |

### 3.2 Studio akce (vyzaduji `requireGirl()`)

| Akce | Soubor |
|------|--------|
| `updateGirlBasic` | `lib/studio-actions.ts` |
| `updateGirlBody` | `lib/studio-actions.ts` |
| `updateGirlLifestyle` | `lib/studio-actions.ts` |
| `updateGirlStatus` | `lib/studio-actions.ts` |
| `studioSaveWeeklySchedule` | `app/[locale]/studio/dostupnost/actions.ts` |
| `studioSetTodayOff` | `app/[locale]/studio/dostupnost/actions.ts` |
| `studioApplyMonthBulk` | `app/[locale]/studio/dostupnost/actions.ts` |
| `uploadPhotoForm` (source=studio) | `lib/photo-actions.ts` |

### 3.3 Admin akce -- **BEZ AUTH GUARDU** (KRITICKE!)

Vsechny akce v `lib/admin-actions.ts` NEMAJI zadny `requireAdmin()` call:

| Akce | Operace | RIZIKO |
|------|---------|--------|
| `updateGirl` | UPDATE girls, DELETE/INSERT girl_services | **KRITICKE** |
| `createGirl` | INSERT girls + girl_services + UPDATE girl_applications | **KRITICKE** |
| `createGirlFromApplication` | INSERT girls, UPDATE girl_applications | **KRITICKE** |
| `deleteGirl` | DELETE girl + related data | **KRITICKE** |
| `rejectApplication` | UPDATE girl_applications status=rejected | **KRITICKE** |
| `reopenApplication` | UPDATE girl_applications status=pending | **KRITICKE** |
| `updateApplicationNotes` | UPDATE girl_applications notes | **KRITICKE** |
| `approvePhoto` | UPDATE girl_photos is_primary | **KRITICKE** |
| `rejectPhoto` | DELETE girl_photos | **KRITICKE** |
| `createPobocka` | INSERT locations | **KRITICKE** |
| `updatePobocka` | UPDATE locations | **KRITICKE** |
| `deletePobocka` | DELETE locations | **KRITICKE** |
| `updatePricingPlan` | UPDATE pricing_plans | **KRITICKE** |
| `createPricingPlan` | INSERT pricing_plans | **KRITICKE** |
| `deletePricingPlan` | DELETE pricing_plans | **KRITICKE** |
| `createPricingExtra` | INSERT pricing_extras | **KRITICKE** |
| `updatePricingExtra` | UPDATE pricing_extras | **KRITICKE** |
| `deletePricingExtra` | DELETE pricing_extras | **KRITICKE** |
| `createSleva` | INSERT discounts | **KRITICKE** |
| `updateSleva` | UPDATE discounts | **KRITICKE** |
| `deleteSleva` | DELETE discounts | **KRITICKE** |
| `createFaq` | INSERT faq_items | **KRITICKE** |
| `updateFaq` | UPDATE faq_items | **KRITICKE** |
| `deleteFaq` | DELETE faq_items | **KRITICKE** |
| `approveStory` | UPDATE stories status=live | **KRITICKE** |
| `expireStory` | UPDATE stories status=expired | **KRITICKE** |
| `deleteStory` | DELETE stories | **KRITICKE** |
| `createCategoryStory` | INSERT stories | **KRITICKE** |
| `addGirlSchedule` | DELETE+INSERT girl_schedules | **KRITICKE** |
| `deleteGirlSchedule` | DELETE girl_schedules | **KRITICKE** |
| `deleteAllSchedules` | DELETE ALL girl_schedules | **KRITICKE** |
| `approveReview` | UPDATE reviews status=approved | **KRITICKE** |
| `rejectReview` | UPDATE reviews status=rejected | **KRITICKE** |

### 3.4 Admin akce s auth

| Akce | Soubor | Guard |
|------|--------|-------|
| `updateApplicationStatus` | `app/[locale]/(admin)/admin/clenove/actions.ts` | `requireAdmin()` |
| `uploadPhotoForm` (source=admin) | `lib/photo-actions.ts` | `requireAdmin()` |
| `setPhotoAsPrimary` | `lib/photo-actions.ts` | `requireAdmin()` |
| `deletePhoto` | `lib/photo-actions.ts` | `requireAdmin()` |

### 3.5 Dostupnost admin akce -- **BEZ AUTH** (KRITICKE!)

Vsechny akce v `app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts` NEMAJI auth guard:

| Akce | RIZIKO |
|------|--------|
| `saveWeeklySchedule` | **KRITICKE** — muze zmenit rozvrh libovolne divky |
| `setTodayOff` | **KRITICKE** |
| `applyMonthBulk` | **KRITICKE** — muze vymazat mesic overrides |

---

## 4. API ENDPOINTY — DETAILNI ANALYZA

### 4.1 `GET /api/pages` — NECHRANENY
- Vraci vsechny stranky webu vcetne admina.
- **Riziko:** Informacni unik — utocnik ziska kompletni mapu webu.
- **Doporuceni:** Pridat `requireAdmin()`.

### 4.2 `GET /api/seo` — NECHRANENY
- Vraci vsechna SEO metadata z DB.
- **Riziko:** Informacni unik — meta data, keywords, stranky.
- **Doporuceni:** Pridat `requireAdmin()`.

### 4.3 `POST/DELETE /api/seo` — CHRANENY
- Pouziva `requireAdmin()` — OK.

### 4.4 Cron endpointy — PODMINENE CHRANENY
- Vsechny 4 cron routes kontroluji `CRON_SECRET`, ALE:
- **Riziko:** `if (process.env.CRON_SECRET && auth !== ...)` — kdyz `CRON_SECRET` NENI nastaveny, auth check se preskoci! Kdokoliv muze zavolat cron endpoint.
- **Doporuceni:** Zmenit na `if (!process.env.CRON_SECRET || auth !== ...)` — reject kdyz secret neni nastaveny.

---

## 5. BEZPECNOSTNI RIZIKA

### 5.1 KRITICKE (P0 — opravit okamzite)

#### 5.1.1 Chybejici auth v admin server actions
- **Soubor:** `lib/admin-actions.ts` (33 akci)
- **Soubor:** `app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts` (3 akce)
- **Dopad:** Utocnik muze primo zavolat server action bez prihlaseni a provest libovolnou CRUD operaci — vytvorit/smazat divku, zmenit ceny, smazat rozvrhy, schvalit recenze.
- **Fix:** Pridat `await requireAdmin()` na zacatek kazde server action v `lib/admin-actions.ts`. Pridat `await requireAdmin()` do dostupnost/actions.ts.
- **Priorita:** OKAMZITE — pred produkci.

#### 5.1.2 Nechranne SEO admin stranky
- **Soubor:** `app/(admin)/admin/seo/page.tsx`, `app/(admin)/admin/seo/edit/page.tsx`
- **Dopad:** Tyto stranky jsou v route group `(admin)` BEZ `[locale]` segmentu, takze NEMAJI admin layout s `requireAdmin()`. Kdokoliv muze pristupovat k SEO editoru.
- **Fix:** Bud presunout pod `app/[locale]/(admin)/admin/seo/` nebo pridat vlastni auth check.

#### 5.1.3 Nechrany `GET /api/seo` a `GET /api/pages`
- **Dopad:** Informacni unik — kompletni mapa stranek a SEO metadata.
- **Fix:** Pridat `requireAdmin()` do GET handleru.

### 5.2 VYSOKE (P1)

#### 5.2.1 Cron endpointy bez povinneho secretu
- **Soubory:** `app/api/cron/*/route.ts` (4 soubory)
- **Dopad:** Kdyz `CRON_SECRET` neni v env, kdokoliv muze spustit cron — smazat overrides, expirovat stories, prepocitat stats.
- **Fix:** `if (!process.env.CRON_SECRET || auth !== ...)` return 401.

#### 5.2.2 Session secret fallback
- **Soubor:** `lib/auth.ts:25-26`
- **Dopad:** Kdyz `SESSION_SECRET` neni v env, pouzije se `'dev-secret-change-in-prod-' + Math.random()`. Problem: `Math.random()` se generuje pri kazdem cold startu — vsechny existujici sessions se zneplatni. V produkci je to nestabilni ale NE zranitelne (random je nepredvidatelny).
- **Fix:** V produkci vynutit `SESSION_SECRET` v env (throw error kdyz chybi).

#### 5.2.3 XSS pres `dangerouslySetInnerHTML` s DB obsahem
- **Soubory:**
  - `components/faq/FaqList.tsx:47` — FAQ odpovedi z DB bez sanitizace
  - `app/[locale]/blog/[slug]/page.tsx:97` — blog content z DB bez sanitizace
  - `app/[locale]/sluzba/[slug]/page.tsx:127` — service content z DB s `.replace(/\n/g, '<br>')`
- **Dopad:** Admin ktery vlozi `<script>` do FAQ odpovedi, blog postu nebo popisu sluzby, spusti XSS na vsech navstevnicich.
- **Realny risk:** Nizky (data vklada admin), ale v pripade kompromitovaneho admin uctu muze byt zneuzito.
- **Fix:** Pouzit `DOMPurify.sanitize()` nebo jiny HTML sanitizer pred renderem. Nebo pouzit textContent misto innerHTML.

### 5.3 STREDNI (P2)

#### 5.3.1 Zadny rate limiting na verejnych formularich
- **Formulare:** submitApplication (join), submitMemberApplication (clenstvi), submitReview
- **Dopad:** Spam/abuse — utocnik muze zaplavit DB fakesnymi prihlaskami, recenzemi, zadostmi o clenstvi.
- **Fix:** Rate limiting na server actions (napr. IP-based throttle, CAPTCHA, honeypot field).

#### 5.3.2 Review auto-approval
- **Soubor:** `app/[locale]/recenze/nova/[slug]/page.tsx:63` — `status: 'approved'`
- **Dopad:** Recenze se automaticky schvaluji — kdokoliv muze napsat falesnou recenzi.
- **Fix:** Default status na 'pending', admin schvaluje.

#### 5.3.3 Zadna CSRF ochrana na server actions
- Next.js server actions maji built-in CSRF ochranu (origin header check), ale neni explicitne overena.
- **Realny risk:** Nizky diky SameSite cookie + Next.js built-in check.

#### 5.3.4 Zadne audit logy
- Neexistuje zadny logovani kdo co kdy zmenil (admin, manager, girl).
- **Dopad:** Neni mozne vystopovat zmeny — dulezite pro bezpecnost i provoz.

### 5.4 NIZKE (P3)

#### 5.4.1 Middleware v nekonvencnim souboru
- `proxy.ts` misto `middleware.ts` — potencialne nefunkcni middleware.
- **Dopad:** `x-pathname` header se nepridava, coz ovlivnuje admin layout path check.

#### 5.4.2 `dangerouslySetInnerHTML` pro staticke styly
- Admin layout, studio layout, login stranka — bezpecne (hardcoded strings).
- JSON-LD skripty — bezpecne (server-rendered, kontrolovany vstup).

---

## 6. SQL INJECTION ANALYZA

**Vysledek: BEZPECNE**

- Vsechny SQL dotazy pouzivaji parameterizovane dotazy s `?` placeholder a `args` polem.
- Dynamicke nazvy sloupcu (napr. `name_${locale}`) jsou validovany vuci whitelistu pred interpolaci.
- ORDER BY (`orderSQL`) pouziva explicitni enum porovnani, ne uzivatelsky vstup.
- LIKE patterny pouzivaji parameterizovane `%${q}%` kde `q` je v args poli.

---

## 7. DOPORUCENI OPRAV — PORADÍ

### Faze 1: OKAMZITE (pred produkcnim nasazenim)

1. **Pridat `requireAdmin()` do VSECH akci v `lib/admin-actions.ts`**
   - Na zacatek kazde exportovane async funkce pridat: `await requireAdmin();`
   - Pro akce jako cenik, FAQ, slevy, pobocky, OG — pouzit `requireFullAdmin()` misto `requireAdmin()` (manager nema pristup).
   - Odhadovany pocet editu: 33 akci.

2. **Pridat `requireAdmin()` do `app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts`**
   - 3 akce: `saveWeeklySchedule`, `setTodayOff`, `applyMonthBulk`.

3. **Opravit necranne SEO stranky** — presunout `app/(admin)/admin/seo/` pod `app/[locale]/(admin)/admin/seo/` nebo pridat auth do page komponent.

4. **Pridat auth do `GET /api/seo` a `GET /api/pages`** — `requireAdmin()`.

5. **Opravit cron auth** — zmenit `if (process.env.CRON_SECRET && ...)` na `if (!process.env.CRON_SECRET || auth !== ...)`.

### Faze 2: VYSOKE (pred spustenim)

6. **Vynutit `SESSION_SECRET` v produkci** — throw Error kdyz neni nastaveny a NODE_ENV === 'production'.

7. **Sanitizovat HTML v FAQ, blog, sluzba** — pridat DOMPurify nebo jiny sanitizer.

8. **Zmenit auto-approval recenzi** — default status 'pending'.

### Faze 3: STREDNI (po spusteni)

9. **Rate limiting** na verejne formulare.
10. **Audit logging** pro admin/studio akce.
11. **CAPTCHA/honeypot** na join form a review form.

---

## 8. SOUBORY K UPRAVE (implementacni checklist)

| Priorita | Soubor | Akce |
|----------|--------|------|
| P0 | `lib/admin-actions.ts` | Pridat auth guard do 33 akci |
| P0 | `app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts` | Pridat auth guard do 3 akci |
| P0 | `app/(admin)/admin/seo/page.tsx` | Presunout nebo pridat auth |
| P0 | `app/(admin)/admin/seo/edit/page.tsx` | Presunout nebo pridat auth |
| P0 | `app/api/seo/route.ts` | Auth do GET |
| P0 | `app/api/pages/route.ts` | Auth do GET |
| P1 | `app/api/cron/*/route.ts` (4 soubory) | Opravit auth logiku |
| P1 | `lib/auth.ts` | Vynutit SESSION_SECRET v produkci |
| P1 | `components/faq/FaqList.tsx` | Sanitizovat HTML |
| P1 | `app/[locale]/blog/[slug]/page.tsx` | Sanitizovat HTML |
| P1 | `app/[locale]/sluzba/[slug]/page.tsx` | Sanitizovat HTML |
| P2 | `app/[locale]/recenze/nova/[slug]/page.tsx` | Zmenit na status 'pending' |
