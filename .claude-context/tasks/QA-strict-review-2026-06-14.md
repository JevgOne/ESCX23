# Strict QA Review — 2026-06-14

**Kontrolor:** kontrolor agent
**Scope:** TASK-010 (auth/domain), TASK-011 (stats box), is_new implementace

---

## 1. Build + TypeScript

- ✅ `npm run build` — PASSED, žádné chyby ani warnings
- ✅ `npx tsc --noEmit` — PASSED, žádné type chyby

---

## 2. TASK-010 — Domain migration + auth redirects

**Commit:** `618595b` — "feat: migrate domain to www.lovelygirls.cz + fix auth redirects"

### ✅ Co je správně

- `next.config.ts` — 301 redirect `lovelygirls.cz → www.lovelygirls.cz` ✅
- `next.config.ts` — 301 redirect `escx23.vercel.app → www.lovelygirls.cz` ✅
- `lib/auth-actions.ts` — `loginAdmin` redirect na `/${locale}/admin` ✅
- `lib/auth-actions.ts` — `loginGirl` redirect na `/${locale}/studio` ✅
- `lib/auth-actions.ts` — `logoutAction` redirect na `/${locale}/admin/login` nebo `/${locale}/studio/login` ✅
- `lib/auth.ts` — `requireAdmin` redirect na `/${locale}/admin/login` ✅
- `lib/auth.ts` — `requireGirl` redirect na `/${locale}/studio/login` ✅
- SESSION_SECRET: výstražný log v produkci, random fallback v dev ✅
- Cookie: `httpOnly: true`, `secure: true` v produkci, `sameSite: 'lax'` ✅

### ⚠️ Drobné poznámky (neblokující)

- `lib/auth.ts:37` — `return 'dev-secret-change-in-prod-' + Math.random().toString(36)` — každý restart serveru vygeneruje nový secret → existující sessions se zneplatní. V dev OK, ale nutno nastavit SESSION_SECRET ve Verceli.
- `getLocale()` duplikovaná ve dvou souborech (`auth.ts` a `auth-actions.ts`) — nefunkční bug, ale zbytečná duplikace.

**TASK-010 VERDICT: ✅ PASSED**

---

## 3. TASK-011 — Věk/Váha/Výška box layout

**Implementace:** `components/profil/ProfilDetails.tsx:289-352` — `.profile-info-card.profile-desktop-only`

### ✅ Co je správně

- Desktop info card existuje jako key/value rows v kartě s border-radius ✅
- CSS `.profile-info-card` definováno v `globals.css:9639` — background, border, padding ✅
- `.profile-desktop-only` class přítomna → skryto na mobilu přes `globals.css:3268` ✅
- Věk má `.pic-value-coral` (coral barva) ✅
- Výška, váha, prsa, oči, vlasy, tetování, piercing, jazyky — vše přítomno ✅
- `.pic-row:last-child { border-bottom: none }` — čistý spodní okraj ✅
- Stará `.profile-stat-details` pill-row v ProfilDetails.tsx odstraněna ✅

### ✅ Mobilní layout nezlomen

- `.profile-info-card` nemá mobilní override → je hidden přes `.profile-desktop-only` ✅
- Na mobilu stále funguje `ProfilHero.tsx:206` — `.ig-stat-hero` grid ✅
- CSS konflikt `.profile-stat-hero:not(.ig-stat-hero)` (z předchozí verze) — neovlivňuje novou implementaci ✅

### ⚠️ Jedna odchylka od mobilu

- Na mobilu (`ig-stat-hero`): velká čísla s `.psh-num` + label pod ním
- Na desktopu (`profile-info-card`): label vlevo, hodnota vpravo (jiné rozložení)
- Uživatel chtěl "box jako na mobilu" — implementace je box, ale layout row je jiný. Funkčně splňuje požadavek (karta místo pills), ale vizuálně jiný přístup. Není chyba, jen odlišný design choice.

**TASK-011 VERDICT: ✅ PASSED**

---

## 4. is_new implementace — KRITICKÝ NÁlez ❌

### Stav implementace

- ✅ `girls` tabulka má sloupec `is_new` (číslo 0/1)
- ✅ `updateGirlById` v queries.ts ukládá `is_new` do DB
- ✅ Admin edit page (`/admin/divky/[id]/edit`) má checkbox `is_new` (řádek 891)
- ✅ `admin-actions.ts:70` správně čte `formData.get('is_new') === 'on' ? 1 : 0`

### ❌ KRITICKÁ CHYBA: `is_new` se nečte z DB při výpisu dívek

**Všechny query funkce vrátí `isNew` based pouze na `created_at`, nikdy na DB `is_new` sloupci:**

| Funkce | SQL SELECT | isNew logika |
|---|---|---|
| `getGirlsForListing` (queries.ts:1660) | `g.created_at` — bez `g.is_new` | `created_at < 30 dní` |
| `getGirlsForService` (queries.ts:58) | `g.created_at` — bez `g.is_new` | `created_at < 30 dní` |
| `getGirlsWithToday` (queries.ts:~160) | `g.created_at` — bez `g.is_new` | `created_at < 30 dní` |
| `getGirlsForHashtag` (queries.ts:~1822) | `g.created_at` — bez `g.is_new` | `created_at < 30 dní` |

**Dopad:**
- Admin nastaví Kim `is_new = 1` → nezobrazí se badge, nezobrazí se ve FeaturedNew sekci
- NOVÁ badge a homepage featured sekce fungují pouze pro dívky mladší 30 dní
- Admin toggle je zbytečný/nefunkční

**Kde to opravit (lib/queries.ts):**

V SQL SELECT přidat `g.is_new` pro každou listing query, pak v mapping logice:
```ts
// Místo:
const isNew = createdAt ? Date.now() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 : false;

// Správně:
const isNew = Number(r.is_new) === 1
  || (createdAt ? Date.now() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 : false);
```

Dotčené funkce (všechny 4 SQL queries v lib/queries.ts):
- `getGirlsForService` (~line 54)
- `getGirlsWithToday` (~line 155)
- `getGirlsForHashtag` (~line 1771)
- `getGirlsForListing` (~line 1657)

**is_new VERDICT: ❌ NEFUNKČNÍ — admin toggle neovlivňuje badge ani FeaturedNew**

---

## 5. Souhrn

| Oblast | Status |
|---|---|
| Build | ✅ PASSED |
| TypeScript | ✅ PASSED |
| TASK-010: auth redirects + domain | ✅ PASSED |
| TASK-011: stats box layout | ✅ PASSED |
| TASK-011: mobilní layout nezlomen | ✅ PASSED |
| is_new: DB sloupec + admin UI | ✅ existuje |
| is_new: badge/FeaturedNew funkčnost | ❌ NEFUNKČNÍ |

## 6. Akce nutná

Programátor musí opravit **4 query funkce** v `lib/queries.ts`:
1. Přidat `g.is_new` do SQL SELECT
2. Změnit `isNew` logiku na `is_new OR (created_at < 30d)`
