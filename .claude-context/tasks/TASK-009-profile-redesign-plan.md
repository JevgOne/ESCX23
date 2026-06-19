# TASK-009: Profile redesign — round photo + full address + services between languages and hashtags

## Overview

Three changes to the profile page (`/profil/[slug]`):
1. **Round photo** in desktop header instead of rectangular
2. **Full address** instead of just district name ("Praha 2")
3. **Services between languages and hashtags** — reorder detail sections

---

## Change 1: Round photo in desktop header

### Current state
- **Mobile**: `ig-avatar` class in `ProfilHero.tsx:168-174` — 124x124px, `border-radius: 22px` (rounded square, not circle)
- **Desktop**: `profile-hero-photo` class in `ProfilHero.tsx:346-352` — `aspect-ratio: 4/5`, `border-radius: 16px` (rectangular)

### What to change

**Option A (recommended): Make desktop hero photo circular**

This is a significant layout change. The current rectangular 4:5 hero takes up the full left column. A circular photo would be much smaller and would change the entire layout balance.

**Recommended approach**: Add a circular avatar **above the name** in `ProfilDetails.tsx` (the right info column), similar to the mobile IG header pattern but for desktop. Keep the rectangular gallery/hero below as-is.

### Files to modify

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Add circular avatar image at top of the info column (before status line, line 249). Accept `primaryPhotoUrl` as new prop. |
| `app/[locale]/profil/[slug]/page.tsx` | Pass `primaryPhotoUrl` to `ProfilDetails` (derive from `photoTyped`). |
| `app/globals.css` | Add `.profile-details-avatar` class: `width: 96px; height: 96px; border-radius: 50%; overflow: hidden; object-fit: cover;` |

### Alternative approach (if user wants to replace the hero entirely)

| File | Change |
|------|--------|
| `app/globals.css` | Change `.profile-hero-photo`: `aspect-ratio: 1/1; border-radius: 50%; max-width: 300px; margin: 0 auto;` |

**Implementor should confirm with user which approach they prefer.** The task says "consider round photo" which suggests it's up for discussion.

---

## Change 2: Full address instead of just district

### Current state

**Data flow:**
1. `getGirlBySlug()` (`lib/queries.ts:145-153`) returns `girl.location` — this is a string like "Praha 2" stored directly on the `girls` table
2. `getGirlScheduleForToday()` (`lib/queries.ts:1267-1302`) JOINs `locations` table but only SELECTs `l.display_name AS schedule_location` (line 1276)
3. In `ProfilDetails.tsx:195`: `const district = scheduleLocation ?? String(girl.location ?? 'Praha');`
4. Displayed at line 263: `<span>📍 {cityName(locale)}{district !== 'Praha' ? ` · ${district}` : ''}</span>` — shows "Praha · Praha 2"
5. Also at line 361: `<span className="loc-chip-main">📍 {district}</span>` — shows just "Praha 2"

**Problem:** Neither query returns the `address` field from the `locations` table. The `locations` table has `address`, `postal_code`, `city`, `district` columns (confirmed in schema).

### What to change

**Step 1: Modify `getGirlScheduleForToday()` to also return address data**

In `lib/queries.ts:1271-1283`, the SQL SELECT needs to also fetch:
```sql
l.address AS schedule_address,
l.district AS schedule_district_name,
l.city AS schedule_city
```

And the `GirlTodaySchedule` return type (currently implicit) needs to include:
```ts
scheduleAddress: string | null;
```

**Step 2: Pass address through to components**

| File | Change |
|------|--------|
| `lib/queries.ts` | Modify `getGirlScheduleForToday()` SQL to SELECT `l.address`, return it as `scheduleAddress` |
| `app/[locale]/profil/[slug]/page.tsx` | Pass `scheduleAddress={todaySchedule.scheduleAddress}` to `ProfilDetails` (line 323-333) |
| `components/profil/ProfilDetails.tsx` | Add `scheduleAddress?: string \| null` to `ProfilDetailsProps` interface (line 87-97). Use it in the meta line (line 262-263) and location block (lines 358-367) |

**Step 3: Update display logic in ProfilDetails**

Current (line 263):
```tsx
<span>📍 {cityName(locale)}{district !== 'Praha' ? ` · ${district}` : ''}</span>
```

New:
```tsx
<span>📍 {scheduleAddress ?? district}</span>
```

Current location block (lines 358-367): Replace `district` chip with full address when available.

**Step 4: Update ProfilHero mobile view**

In `ProfilHero.tsx:179-184`, the `ig-loc` currently shows `locText` (which is `scheduleLocation ?? girl.location`). Also pass `scheduleAddress` as prop and display it if available.

| File | Change |
|------|--------|
| `components/profil/ProfilHero.tsx` | Add `scheduleAddress?: string \| null` to `ProfilHeroProps`. Update `ig-loc` to show full address. |
| `app/[locale]/profil/[slug]/page.tsx` | Pass `scheduleAddress` to `ProfilHero`. |

### GirlTodaySchedule interface

Currently the return type is implicit (`lib/queries.ts:1267`). Define it explicitly:

```ts
export interface GirlTodaySchedule {
  shiftFrom: string | null;
  shiftTo: string | null;
  scheduleLocation: string | null;
  scheduleAddress: string | null;
}
```

---

## Change 3: Services between languages and hashtags

### Current order in ProfilDetails.tsx

1. Status line (verified, stars, reviews) — line 249
2. Name h1 — line 258
3. Meta line with location — line 262
4. Stat hero strip (age/height/weight) — line 275
5. **Detail pills (bust, eyes, hair, tattoo, piercing + LANGUAGES)** — line 295, languages at lines 325-330
6. Bio — line 333
7. **Top services** (included + extras chips) — lines 336-355
8. Location block ("Kde ji najdes") — lines 358-367
9. **Hashtags** — lines 369-377
10. Reviews summary — lines 379-400
11. CTA card — lines 402-428

### Desired order

1. Status line
2. Name
3. Meta line with address
4. Stat hero strip
5. **Detail pills (bust, eyes, hair, tattoo, piercing + LANGUAGES)** — keep languages here
6. Bio
7. **TOP SERVICES** — move here (between bio/languages area and hashtags)
8. **HASHTAGS** — directly after services
9. Location block
10. Reviews summary
11. CTA card

**Wait — re-reading the user's request**: "Současne poradii je: stats → bust/eyes/hair → jazyky → hashtagy. Uzivatel chce pridat sekci sluzeb MEZI jazyky a hashtagy."

So the desired order is:
1. Status line
2. Name
3. Meta line
4. Stat hero strip
5. Detail pills (bust, eyes, hair, tattoo, piercing + **LANGUAGES**)
6. Bio
7. **TOP SERVICES** ← moved from after bio+location to between languages/bio area and hashtags
8. **HASHTAGS** ← stays after services
9. Location block
10. Reviews summary
11. CTA card

### Current vs desired diff

The current order already has services (lines 336-355) before hashtags (lines 369-377). The only thing between them is the **location block** (lines 358-367).

**Actual fix needed**: Move the location block ("Kde ji najdes", lines 358-367) to AFTER hashtags. This puts services immediately before hashtags.

### Files to modify

| File | Change |
|------|--------|
| `components/profil/ProfilDetails.tsx` | Move the location block JSX (lines 358-367) to after the hashtags block (after line 377). This makes the order: ...services → hashtags → location → reviews → CTA |

### ProfilHero mobile view

In `ProfilHero.tsx`, the mobile view already has the order: stats → details pills (with languages) → services (lines 264-278) → hashtags (lines 280-286). **This is already correct** — services are between languages and hashtags in mobile view.

---

## Summary of all file changes

| File | Changes |
|------|---------|
| `lib/queries.ts` | 1. Define `GirlTodaySchedule` interface with `scheduleAddress`. 2. Modify `getGirlScheduleForToday()` SQL to SELECT `l.address`. 3. Return `scheduleAddress` in result. |
| `app/[locale]/profil/[slug]/page.tsx` | 1. Pass `scheduleAddress` to `ProfilDetails` and `ProfilHero`. 2. (If round photo option A) Pass `primaryPhotoUrl` to `ProfilDetails`. |
| `components/profil/ProfilDetails.tsx` | 1. Add `scheduleAddress` prop. 2. Display full address in meta line and location block. 3. Move location block after hashtags (reorder JSX). 4. (If round photo option A) Add circular avatar at top. |
| `components/profil/ProfilHero.tsx` | 1. Add `scheduleAddress` prop. 2. Show full address in mobile `ig-loc`. |
| `app/globals.css` | 1. (If round photo option A) Add `.profile-details-avatar` styles. |

## Testing plan

1. Run `npm run build` — verify no TS/build errors
2. Open `/cs/profil/{any-slug}` — verify:
   - Full address shows in meta line (not just "Praha 2")
   - Services appear between languages area and hashtags
   - Location block appears after hashtags
   - (If round photo) Circular avatar visible
3. Check mobile view (< 768px) — verify mobile layout unchanged (already correct order)
4. Check all 4 locales (cs, en, de, uk)
5. Check with JS disabled — all content visible (server-rendered)

## Risk assessment

- **Low risk**: Layout reordering is purely JSX block moves, no logic changes
- **Medium risk**: Query change adds a new field — backwards-compatible (nullable)
- **Round photo decision needed**: Implementor should ask user to confirm approach before proceeding
