# TASK-011: Profile detail — Replace desktop pill row with info card

## Problem

On the desktop profile page (e.g., `/cs/profil/anetta`), the stats (Age, Height, Weight, Bust, Eyes, Hair, Tattoo, Piercing, Languages) are displayed as **pill badges in a horizontal wrapping row** (`components/profil/ProfilDetails.tsx:289-351`, class `.profile-stat-details.profile-desktop-only`).

The user wants these in a **box/card layout** -- similar to the mobile stat hero or the mockup card.

## Current Architecture

### Desktop (what the user sees)
The profile page uses two components side by side:
- **ProfilHero** (left column) — photo gallery + IG-style header (hidden on desktop, shown on mobile)
- **ProfilDetails** (right column) — name, status, meta line, **stat pill row**, bio, services, schedule, reviews

The desktop stat pill row is at `ProfilDetails.tsx:289-351`:
```tsx
<div className="profile-stat-details profile-desktop-only">
  <span className="psd-pill psd-pill-age">...</span>  // Age
  <span className="psd-pill">...</span>               // Height
  <span className="psd-pill">...</span>               // Weight
  <span className="psd-pill">...</span>               // Bust
  <span className="psd-pill">...</span>               // Eyes
  <span className="psd-pill">...</span>               // Hair
  <span className="psd-pill">...</span>               // Tattoo
  <span className="psd-pill">...</span>               // Piercing
  <span className="psd-pill lang">...</span>           // Languages
</div>
```

CSS (globals.css:9607-9636): horizontal flex-wrap with gap, each pill has background + border + rounded corners.

### Mobile (what user references as "like mobile")
ProfilHero has TWO mobile-only sections:
1. **`ig-stat-hero`** (lines 206-225) — 3-column grid: Age (coral gradient), Height, Weight — big numbers with small labels below. CSS: `profile-stat-hero` is a dark grid with gradient background cells.
2. **`ig-stat-details`** (lines 228-267) — pill badges for Bust/Eyes/Hair/Tattoo/Piercing/Languages (same `.psd-pill` style).

### Mockup Reference
`mockups/profil-anetta.html:2905-2938` shows a **compact info card** with vertical key-value rows:

```
+-------------------------------------------+
| Vyska                             165 cm  |
|-------------------------------------------|
| Vaha                               50 kg  |
|-------------------------------------------|
| Prsa                       A · Prirodni   |
|-------------------------------------------|
| Oci                              Modre    |
|-------------------------------------------|
| Vlasy                    Blond · Dlouhe   |
|-------------------------------------------|
| Tetovani                            Ne    |
|-------------------------------------------|
| Piercing                           Usi    |
+-------------------------------------------+
```

Mockup CSS:
- Container: `background: var(--bg-card); border: 1px solid var(--line-mid); border-radius: 12px; padding: 4px 16px`
- Each row: `display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px`
- Label: `color: var(--text-muted)`
- Value: `color: var(--text); font-weight: 600`
- Last row: no border-bottom

## Implementation Plan

### Step 1: Replace Pill Row with Info Card (ProfilDetails.tsx)

Replace lines 288-351 in `components/profil/ProfilDetails.tsx`.

**Before:** Horizontal `<div className="profile-stat-details profile-desktop-only">` with `<span className="psd-pill">` items.

**After:** A card `<div className="profile-info-card profile-desktop-only">` with `<div className="pic-row">` items.

```tsx
{/* Info card — vertical key/value rows */}
<div className="profile-info-card profile-desktop-only">
  <div className="pic-row">
    <span className="pic-label">{ageLabel}</span>
    <span className="pic-value pic-value-accent">{age} {ageUnit}</span>
  </div>
  {girl.height != null && (
    <div className="pic-row">
      <span className="pic-label">{heightLabel}</span>
      <span className="pic-value">{girl.height} cm</span>
    </div>
  )}
  {girl.weight != null && (
    <div className="pic-row">
      <span className="pic-label">{weightLabel}</span>
      <span className="pic-value">{girl.weight} kg</span>
    </div>
  )}
  {girl.bust != null && (
    <div className="pic-row">
      <span className="pic-label">{bustLabel}</span>
      <span className="pic-value">{girl.bust}{bustUnit ? ` · ${bustUnit}` : ''}</span>
    </div>
  )}
  {/* Eyes, Hair, Tattoo, Piercing — same pattern */}
  ...
  {languages.length > 0 && (
    <div className="pic-row">
      <span className="pic-label">{langLabel}</span>
      <span className="pic-value">{languages.map(l => `${FLAG_MAP[l] ?? ''} ${getLangName(l, locale)}`).join(', ')}</span>
    </div>
  )}
</div>
```

Key details:
- Keep all existing localization logic (`locale === 'cs' ? ...` patterns)
- Keep all existing conditional rendering (`girl.height != null &&`, etc.)
- Keep the `localizeValue()` calls for eyes/hair
- Keep the tattoo level calculation IIFE
- Keep the piercing rendering logic
- Languages: join into a single comma-separated value instead of individual pills

### Step 2: Add CSS (globals.css)

Add new styles near the existing `.profile-stat-details` block (~line 9607):

```css
/* Profile info card — desktop stat box (mockup style) */
.profile-info-card {
  background: var(--bg-card, rgba(22, 16, 28, 0.8));
  border: 1px solid var(--color-line-mid, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 18px;
}
.pic-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line, rgba(255, 255, 255, 0.06));
  font-size: 13px;
}
.pic-row:last-child {
  border-bottom: none;
}
.pic-label {
  color: var(--color-text-muted);
}
.pic-value {
  font-weight: 600;
  color: var(--color-text);
}
.pic-value-accent {
  color: var(--color-coral);
  font-weight: 700;
}
```

### Step 3: No Mobile Changes

- Mobile uses `ig-stat-hero` + `ig-stat-details` from `ProfilHero.tsx` — completely separate code
- The new `.profile-info-card` has class `profile-desktop-only` which is hidden on mobile (CSS: `@media (max-width: 768px) { .profile-desktop-only { display: none !important; } }`)
- Old `.profile-stat-details` CSS in globals.css can be kept (it's still used by mobile's `.ig-stat-details` which extends it)

### Step 4: Clean Up

- Do NOT remove the `.profile-stat-details` or `.psd-pill` CSS from globals.css — it's reused by mobile's `ig-stat-details`
- The old `<div className="profile-stat-details profile-desktop-only">` block in ProfilDetails.tsx is fully replaced

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `components/profil/ProfilDetails.tsx` | 288-351 | Replace pill row with card layout |
| `app/globals.css` | ~9607 (insert) | Add `.profile-info-card`, `.pic-row`, `.pic-label`, `.pic-value` |

## Scope
- 2 files modified
- ~65 lines of JSX replaced, ~30 lines of CSS added
- No new components, no `'use client'`, pure server-rendered HTML+CSS
- Mobile completely untouched
- Low risk — isolated desktop-only visual change
