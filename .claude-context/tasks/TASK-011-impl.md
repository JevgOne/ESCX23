# TASK-011: Profil detail — Stat box layout — Implementation Report

## Changes Made

### 1. `components/profil/ProfilDetails.tsx` (lines 288-351)
Replaced the horizontal pill-badge row (`.profile-stat-details` with `.psd-pill` items) with a vertical card layout (`.profile-info-card` with `.pic-row` items).

**Before:** Inline flex-wrap pills (Age, Height, Weight, Bust, Eyes, Hair, Tattoo, Piercing, Languages as separate chips)

**After:** Vertical key/value card with divider lines between rows:
- Age row (coral accent)
- Height (if present)
- Weight (if present)
- Bust (if present, with natural/implant note)
- Eyes (if present)
- Hair (if present)
- Tattoo (if present, with level text)
- Piercing (if present)
- Languages (combined as comma-separated list with flags)

Each row: label left, value right, separated by `border-bottom: 1px solid var(--color-line)`. Last row has no bottom border.

Wrapper has `profile-desktop-only` class so it's hidden on mobile (mobile pill layout in ProfilHero.tsx is unchanged).

### 2. `app/globals.css`
Added CSS classes after the existing `.psd-pill` styles (which remain for mobile):

- `.profile-info-card` — card container with `--color-bg-card` background, `--color-line-mid` border, 12px radius
- `.pic-row` — flex row with space-between, 10px padding, bottom border
- `.pic-row:last-child` — no bottom border
- `.pic-label` — muted text color
- `.pic-value` — bold white text
- `.pic-value-coral` — coral accent for age

## Unchanged
- Mobile layout in `ProfilHero.tsx` — no changes
- Existing `.psd-pill` CSS — kept for mobile
- `.profile-desktop-only` mobile hide rule (line 3268) — already handles hiding the card on mobile

## Build Status
Clean — no TypeScript errors, no CSS issues.
