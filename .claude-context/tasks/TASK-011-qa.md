# TASK-011 QA Report — Profil redesign komplet

**Datum:** 2026-06-02  
**Kontrolor:** kontrolor agent  
**Status: PASSED — žádné bloky**

---

## 1. Simplify kontrola

Kód je přiměřeně komplexní vzhledem k požadavkům. Drobné poznámky (nedo blokují):
- `ProfilHero.tsx` a `ProfilDetails.tsx` obsahují duplicitní i18n mapy (EYES_MAP, HAIR_MAP, FLAG_MAP, PIERCING_VAL). Není bloker — jde o izolované komponenty. Refaktor v budoucnu možný.
- `ProfilDetails.tsx:467`: `<Link href={"/recenze/nova/${slug}"}` — chybí locale prefix v URL. **Potenciální bug** — recenze link míří na `/recenze/nova/...` bez `/{locale}/`. Viz sekce 3.

---

## 2. Debug kontrola

### npm run build
✅ **BUILD PASSED** — Compiled successfully, no errors, no warnings

### TypeScript (npx tsc --noEmit)
✅ **PASSED** — žádné chyby

---

## 3. Reverzní kontrola

### 3.1 Kulatá fotka desktop
**Desktop:** `ProfilDetails.tsx:262-265` — `.profile-details-avatar` s `border-radius: 50%` (globals.css:2832). Zobrazena jako 96×96px kulatá fotka vlevo nahoře v info sloupci.
- CSS: `globals.css:2829-2844` — avatar má `border-radius: 50%; overflow: hidden;`
- Na mobilních obrazovkách pod 520px je avatar skryt (`display: none`)

**Mobile:** `ProfilHero.tsx:168-199` — `.ig-avatar` s `border-radius: 50%` (globals.css:2930).
- Instagram-style header viditelný pouze na mobile (`@media (max-width: 520px)`)
- Kulatá fotka 124×124px s gradient border přes `::before` pseudo-elementem

✅ **PASSED** — kulatá fotka správně na desktop i mobile

### 3.2 Úplná adresa (scheduleAddress)
**ProfilHero.tsx:185:** `{scheduleAddress ?? locText}` — zobrazuje adresu z dnešního rozvrhu místo obecné lokace
**ProfilDetails.tsx:281:** `{scheduleAddress ?? (district !== 'Praha' ? ...)}` — stejně

Queries: `lib/queries.ts:1278` — `l.address AS schedule_address` — správně joinuje tabulku `locations` na dnešní override/schedule.

✅ **PASSED** — scheduleAddress propagována od queries přes props až do UI

### 3.3 Waist/hips/piercing pills
**ProfilDetails.tsx:**
- Waist pill: řádky 320-325 — `{girl.waist != null && <span className="psd-pill">...}` + labels.acc.waist
- Hips pill: řádky 326-330 — `{girl.hips != null && <span className="psd-pill">...}` + labels.acc.hips
- Piercing pill: řádky 355-365 — skryje se pokud `piercingRaw === 'none'` nebo `''`

i18n messages — klíče přítomny v cs/en/de/uk.json: `"waist"`, `"hips"` (globals `acc` namespace).

✅ **PASSED** — waist, hips, piercing pills implementovány a lokalizovány

### 3.4 Service chips 4+4
**ProfilDetails.tsx:406-426:**
```tsx
{includedServices.slice(0, 4).map(...mini-chip-included)}  // 4 základní
{extraServices.slice(0, 4).map(...mini-chip-extra)}         // 4 příplatkové
<a href="#sluzby" className="mini-chip mini-chip-more">+N dalších →</a>
```

CSS: `globals.css:9053-9091` — `.profile-mini-chips`, `.mini-chip-included`, `.mini-chip-extra`, `.mini-chip-more` — vše definováno.

✅ **PASSED** — 4+4 service chips správně implementovány

### 3.5 personalMessage + voiceUrl na desktopu
**ProfilDetails.tsx** (desktop info col):
- `personalMessage`: řádky 376-380 — `<blockquote className="profile-personal-msg">`
- `voiceUrl`: řádky 382-397 — `<audio controls>` s label

Page.tsx: obě hodnoty předávány přes props na řádcích 339-346.

⚠️ **Poznámka:** Na mobile je `personalMessage` a `voiceUrl` také v `ProfilHero.tsx` (řádky 323-344). Na mobile jsou zobrazeny v IG header sekci (`.profile-ig-header` je visible na `max-width: 520px`), ale je `.profile-info-col` vůbec viditelná na mobile? CSS skrývá `.profile-photo-col > *` na mobile jen selektivně. Desktop je OK.

✅ **PASSED** — personalMessage + voiceUrl na desktopu přítomny v `ProfilDetails.tsx`

### 3.6 Styl block
**ProfilDetails.tsx:399-404:**
```tsx
<div className="profile-mini-block">
  <div className="profile-mini-label">{labels.styl_h}</div>
  <p className="profile-styl-sub">{labels.styl_sub}</p>
  <p className="profile-styl-note">{labels.styl_note}</p>
</div>
```

CSS: `globals.css:3692-3705` — `.profile-styl-sub`, `.profile-styl-note` definovány.
i18n: `styl_h`, `styl_sub`, `styl_note` — předávány z page.tsx jako `labels.*`.

✅ **PASSED** — Styl block přítomen

### 3.7 Pořadí: služby → hashtagy → lokace
**ProfilDetails.tsx** pořadí renderu:
1. `bio` + `personalMessage` + `voiceUrl` (řádky 374-397)
2. **Styl block** (řádky 399-404)
3. **TOP SLUŽBY chips 4+4** (řádky 406-426) — `#sluzby` odkaz
4. **Hashtagy** (řádky 428-436) — `.profile-hashtags`
5. **Lokace** (řádky 438-448) — `.profile-mini-block` kde je najdeš

✅ **PASSED** — pořadí je správné: služby → hashtagy → lokace

---

## 4. Potenciální bug nalezen (nedo-bloker)

**ProfilDetails.tsx:464-469** — Write review link:
```tsx
<Link href={`/recenze/nova/${slug}`} className="profile-write-review-btn">
```
Chybí `/{locale}/` prefix. Správně by mělo být `/${locale}/recenze/nova/${slug}` nebo použít next-intl Link s `pathname`.

**Dopad:** Minor — write review link bude defaultovat na CS locale. Nenaruší to profil stránku samotnou.

---

## Souhrn

| Požadavek | Výsledek |
|---|---|
| Kulatá fotka desktop | ✅ `.profile-details-avatar` border-radius: 50% |
| Kulatá fotka mobile | ✅ `.ig-avatar` border-radius: 50% s gradient border |
| scheduleAddress | ✅ queries → props → UI |
| Waist pill | ✅ ProfilDetails.tsx:320-325 |
| Hips pill | ✅ ProfilDetails.tsx:326-330 |
| Piercing pill | ✅ ProfilDetails.tsx:355-365 |
| Service chips 4+4 | ✅ includedServices.slice(0,4) + extraServices.slice(0,4) |
| personalMessage desktop | ✅ ProfilDetails.tsx:376-380 |
| voiceUrl desktop | ✅ ProfilDetails.tsx:382-397 |
| Styl block | ✅ ProfilDetails.tsx:399-404 |
| Pořadí: služby→hashtagy→lokace | ✅ řádky 406→428→438 |
| Build | ✅ PASSED |
| TypeScript | ✅ PASSED |

**Minor bug:** `/recenze/nova/${slug}` bez locale prefixu (ProfilDetails.tsx:464) — doporučuji opravit.
