# TASK-009: Profile redesign — round photo + full address + services order + fill content

## Overview

Four changes to the profile page (`/profil/[slug]`):
1. **Round photo** — `border-radius: 50%` on profile photo (user is considering)
2. **Full address** — show complete location address instead of just "Praha 2"
3. **Services between languages and hashtags** — reorder detail sections
4. **Fill the profile** — profile looks empty, add more visible content

---

## Change 1: Round photo in desktop header

### Current state
- **Mobile**: `ig-avatar` class in `ProfilHero.tsx:168-174` — 124x124px, `border-radius: 22px` (rounded square)
- **Desktop**: `profile-hero-photo` class in `ProfilHero.tsx:346-352` — `aspect-ratio: 4/5`, `border-radius: 16px` (rectangular)

### What to change

The user is undecided ("zvazit"). Prepare as a **CSS-only change** that can be easily toggled.

**Approach: CSS class toggle on desktop hero photo**

Add a new CSS class `.profile-hero-photo--round` that makes the hero circular. The implementor applies this class conditionally or permanently depending on user feedback.

### Files to modify

| File | Change |
|------|--------|
| `app/globals.css` | Add `.profile-hero-photo--round { aspect-ratio: 1/1; border-radius: 50%; max-width: 340px; margin: 0 auto; }` |
| `components/profil/ProfilHero.tsx:346` | Add `profile-hero-photo--round` to className (can be toggled later) |

**Note:** Making the hero circular will significantly shrink it (from 4:5 rectangle filling 280-380px column to a 340px circle). The left column may look sparse. This pairs well with Change 4 (fill content) — if the photo is round, move some content blocks into the left column below the photo.

### Alternative: Round avatar in the info column

If user prefers to keep the large rectangular hero AND add a round avatar:

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Add `<div className="profile-details-avatar"><img .../></div>` before the status line (line 249). New prop: `primaryPhotoUrl: string`. |
| `app/[locale]/profil/[slug]/page.tsx` | Pass `primaryPhotoUrl` derived from `photoTyped`. |
| `app/globals.css` | Add `.profile-details-avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin-bottom: 12px; } .profile-details-avatar img { width: 100%; height: 100%; object-fit: cover; }` |

**Implementor should confirm with user which approach they want.**

---

## Change 2: Full address instead of just district

### Current state

**Data flow:**
1. `getGirlBySlug()` (`lib/queries.ts:145-153`) returns `girl.location` — a string like "Praha 2" stored on the `girls` table
2. `getGirlScheduleForToday()` (`lib/queries.ts:1267-1302`) JOINs `locations` table but only SELECTs `l.display_name AS schedule_location` (line 1276)
3. In `ProfilDetails.tsx:195`: `const district = scheduleLocation ?? String(girl.location ?? 'Praha');`
4. Meta line at line 263: `📍 Praha · Praha 2` — only district name
5. Location block at line 361: `📍 Praha 2` — only district name

**DB schema** (`locations` table):
- `address TEXT` — street address (e.g. "Vinohrady")
- `postal_code TEXT` — e.g. "120 00"
- `city TEXT NOT NULL` — e.g. "Praha"
- `district TEXT` — e.g. "Praha 2"

### What to change

**Step 1: Modify `getGirlScheduleForToday()` query**

File: `lib/queries.ts:1271-1302`

Current SQL SELECT (line 1274-1276):
```sql
gs.start_time AS shift_from, gs.end_time AS shift_to,
se.exception_type, se.start_time AS ex_from, se.end_time AS ex_to,
l.display_name AS schedule_location
```

Add:
```sql
l.address AS schedule_address
```

Current return (line 1300-1302):
```ts
const scheduleLocation = r.schedule_location ? String(r.schedule_location) : null;
return { shiftFrom: from, shiftTo: to, scheduleLocation };
```

New:
```ts
const scheduleLocation = r.schedule_location ? String(r.schedule_location) : null;
const scheduleAddress = r.schedule_address ? String(r.schedule_address) : null;
return { shiftFrom: from, shiftTo: to, scheduleLocation, scheduleAddress };
```

**Step 2: Define explicit return type**

Add before/above `getGirlScheduleForToday()`:
```ts
export interface GirlTodaySchedule {
  shiftFrom: string | null;
  shiftTo: string | null;
  scheduleLocation: string | null;
  scheduleAddress: string | null;
}
```

**Step 3: Pass address to components**

| File | Line | Change |
|------|------|--------|
| `app/[locale]/profil/[slug]/page.tsx` | 142 | Default fallback: `{ shiftFrom: null, shiftTo: null, scheduleLocation: null, scheduleAddress: null }` |
| `app/[locale]/profil/[slug]/page.tsx` | 323-333 | Add `scheduleAddress={todaySchedule.scheduleAddress}` to `ProfilDetails` props |
| `app/[locale]/profil/[slug]/page.tsx` | 298-322 | Add `scheduleAddress={todaySchedule.scheduleAddress}` to `ProfilHero` props |
| `components/profil/ProfilDetails.tsx` | 87-97 | Add `scheduleAddress?: string \| null` to `ProfilDetailsProps` |
| `components/profil/ProfilHero.tsx` | 89-101 | Add `scheduleAddress?: string \| null` to `ProfilHeroProps` |

**Step 4: Display full address**

In `ProfilDetails.tsx`:
- Line 195: `const address = scheduleAddress ?? null;`
- Line 263: Replace `📍 {cityName(locale)}{district !== 'Praha' ? \` · \${district}\` : ''}` with `📍 {address ? \`\${address}, \${district}\` : district}`
- Line 361: Replace `📍 {district}` with `📍 {address ? \`\${address}, \${district}\` : district}`

In `ProfilHero.tsx`:
- Line 113: `const locText = scheduleAddress ? \`\${scheduleAddress}, \${scheduleLocation ?? String(girl.location ?? city)}\` : scheduleLocation ?? String(girl.location ?? city);`

---

## Change 3: Services between languages and hashtags

### Current order in ProfilDetails.tsx (desktop right column)

1. Status line (verified, stars, reviews) — line 249
2. Name h1 — line 258
3. Meta line with location — line 262
4. Stat hero strip (age/height/weight) — line 275
5. Detail pills (bust, eyes, hair, tattoo, piercing + **LANGUAGES**) — line 295, languages at lines 325-330
6. Bio — line 333
7. **Top services** (included + extras chips) — lines 336-355
8. **Location block** ("Kde ji najdes") — lines 358-367
9. **Hashtags** — lines 369-377
10. Reviews summary — lines 379-400
11. CTA card — lines 402-428

### User's request

"stats -> bust/eyes/hair -> jazyky -> hashtagy. Chce pridat sekci sluzeb MEZI jazyky a hashtagy."

Current order already has services (lines 336-355) before hashtags (lines 369-377). The only thing breaking the sequence is the **location block** (lines 358-367) between services and hashtags.

### Desired order

5. Detail pills + LANGUAGES
6. Bio
7. **TOP SERVICES** (stays here)
8. **HASHTAGS** (stays here)
9. **Location block** ← moved from between services and hashtags to after hashtags
10. Reviews summary
11. CTA card

### Fix

Move the location block JSX (lines 358-367 in `ProfilDetails.tsx`) to **after** the hashtags block (after line 377).

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Cut lines 358-367 (location block). Paste after line 377 (after hashtags closing `}`). |

### ProfilHero mobile view

Already correct order: stats -> detail pills with languages -> services (`profile-ig-services`, lines 264-278) -> hashtags (`profile-ig-hashtags`, lines 280-286). **No change needed.**

---

## Change 4: Fill the profile ("musime to zaplnit")

The profile right column currently only shows content conditionally — if a girl has no bio, few services, no hashtags, the column looks empty. Several data fields exist in the DB/interface but are not displayed.

### 4a. Add waist/hips pills to detail pills section

`ProfilDetails.tsx` already has `waist` and `hips` in the `Girl` interface (lines 11-12) and labels (lines 74-75), but they are **never rendered** as pills.

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | After the bust pill (line 297-301), add waist pill and hips pill using the same pattern. Use `girl.waist` / `girl.hips` with `labels.acc.waist` / `labels.acc.hips`. |

```tsx
{girl.waist != null && (
  <span className="psd-pill">
    <span className="psd-label">{labels.acc.waist}</span>
    <span className="psd-value">{String(girl.waist)} cm</span>
  </span>
)}
{girl.hips != null && (
  <span className="psd-pill">
    <span className="psd-label">{labels.acc.hips}</span>
    <span className="psd-value">{String(girl.hips)} cm</span>
  </span>
)}
```

### 4b. Add piercing pill to detail pills

Currently only tattoo is displayed as a pill (lines 314-324). Piercing data exists (`girl.piercing`) but is not rendered in ProfilDetails.

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | After tattoo pill (line 324), add piercing pill if `girl.piercing` is not null/empty/'none'. |

### 4c. Show more services (increase from 3+3 to 4+4)

Currently shows 3 included + 3 extras (lines 340-349). Increase to show more.

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Change `.slice(0, 3)` to `.slice(0, 4)` on lines 340 and 345. Change `services.length - 6` to `services.length - 8` on line 351. |

### 4d. Show "Styl" / experience block if data exists

The labels `styl_h`, `styl_sub`, `styl_note`, `experience_h` etc. are already passed (lines 53-63) but never used in the JSX. These could fill a new block.

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Add a "Styl" card after the bio. Shows `labels.styl_h` heading, `labels.styl_sub` subtext, and `labels.styl_note` (which includes the girl's name via interpolation). This is a static content block that always renders — helps fill the page. |

### 4e. Move personal message and voice to desktop view

Currently `personalMessage` and `voiceUrl` are only rendered in `ProfilHero.tsx` (left column, lines 322-343) and only visible on mobile. These should also appear in the desktop right column (ProfilDetails).

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Add `personalMessage?: string \| null` and `voiceUrl?: string \| null` to props. Render a blockquote with personal message after bio if present. Render voice player after personal message if present. |
| `app/[locale]/profil/[slug]/page.tsx` | Pass `personalMessage` and `voiceUrl` to `ProfilDetails`. |

---

## Summary of all file changes

| File | Changes |
|------|---------|
| **`lib/queries.ts`** | Define `GirlTodaySchedule` interface. Modify `getGirlScheduleForToday()` to SELECT `l.address` and return `scheduleAddress`. |
| **`app/[locale]/profil/[slug]/page.tsx`** | Pass `scheduleAddress` to both components. Pass `personalMessage` and `voiceUrl` to `ProfilDetails`. Optionally pass `primaryPhotoUrl`. |
| **`components/profil/ProfilDetails.tsx`** | (1) Add `scheduleAddress` prop + display full address. (2) Move location block after hashtags. (3) Add waist/hips/piercing pills. (4) Show more service chips (4+4). (5) Add "Styl" content block. (6) Add personal message + voice player for desktop. (7) Optionally add round avatar. |
| **`components/profil/ProfilHero.tsx`** | Add `scheduleAddress` prop, show full address in mobile `ig-loc`. Optionally add `profile-hero-photo--round` class. |
| **`app/globals.css`** | Add `.profile-hero-photo--round` (if round photo). Add `.profile-details-avatar` (if avatar approach). |

## Implementation order

1. Query change (`lib/queries.ts`) — add `scheduleAddress`
2. Reorder JSX in `ProfilDetails.tsx` — move location block after hashtags
3. Add waist/hips/piercing pills, increase service count
4. Add styl block, personal message, voice player to ProfilDetails
5. Pass new props through `page.tsx`
6. CSS changes for round photo (pending user decision)

## Testing plan

1. `npm run build` — no TS/build errors
2. Open `/cs/profil/{slug}` — verify:
   - Full address shows (not just "Praha 2")
   - Order is: languages -> services -> hashtags -> location
   - Waist/hips pills visible (if girl has data)
   - Piercing pill visible
   - More service chips shown
   - Styl block renders
   - Personal message blockquote appears (if girl has one)
3. Check mobile view (< 520px) — verify mobile layout still works
4. Check all 4 locales (cs, en, de, uk)
5. Check with JS disabled — all content server-rendered
6. (If round photo) Verify the circular hero looks acceptable

## Risk assessment

- **Low risk**: JSX reordering, adding pills, showing more chips — no logic changes
- **Low risk**: Query change adds a nullable field — backwards-compatible
- **Medium risk**: "Styl" block is static content — needs proper i18n labels (already exist in labels)
- **Decision needed**: Round photo approach (CSS toggle vs avatar in info column)
