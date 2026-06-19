# TASK-011: Profil detail — Stat details box layout (desktop)

## Problem

On desktop, the profile page shows Age, Height, Weight, Bust, Eyes, Hair, Tattoo, Piercing, and Languages as **pill badges in a horizontal row** (class `profile-stat-details` with `psd-pill` items). The user wants these displayed in a **card/box layout** matching the mockup (`mockups/profil-anetta.html` lines 2905-2938).

## Mockup Reference

The mockup shows a **compact info card** with vertical rows:
```
+-----------------------------------------+
| Vyska                           165 cm  |
|--------------------------------------...|
| Vaha                             50 kg  |
|--------------------------------------...|
| Prsa                     A - Prirodni   |
|--------------------------------------...|
| Oci                            Modre    |
|--------------------------------------...|
| Vlasy                  Blond - Dlouhe   |
|--------------------------------------...|
| Tetovani                          Ne    |
|--------------------------------------...|
| Piercing                         Usi    |
+-----------------------------------------+
```

Style from mockup:
- `background: var(--bg-card)` 
- `border: 1px solid var(--line-mid)`
- `border-radius: 12px`
- `padding: 4px 16px`
- Each row: `display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px`
- Label: `color: var(--text-muted)`
- Value: `color: var(--text); font-weight: 600`
- Last row has no `border-bottom`

## Current Implementation

**Desktop** (`components/profil/ProfilDetails.tsx:289-351`):
- Container: `<div className="profile-stat-details profile-desktop-only">`
- Items: `<span className="psd-pill">` with `<span className="psd-label">` + `<span className="psd-value">`
- Layout: Horizontal flex-wrap pills

**Mobile** (`components/profil/ProfilHero.tsx:229`):
- Uses `<div className="profile-stat-details ig-stat-details">` — same pill layout
- Mobile CSS in `globals.css` line ~3137 reuses `.psd-pill` chip style

**CSS** (`app/globals.css:9607-9636`):
- `.profile-stat-details` — flex, wrap, gap: 6px
- `.psd-pill` — inline-flex, background, border, rounded

## Implementation Plan

### Step 1: Replace Desktop Pill Layout with Card Layout

In `components/profil/ProfilDetails.tsx` (lines 288-351), replace the pill row with a card component:

```tsx
{/* Info card — key/value rows */}
<div className="profile-info-card profile-desktop-only">
  {/* Age row */}
  <div className="pic-row">
    <span className="pic-label">{locale === 'cs' ? 'Věk' : ...}</span>
    <span className="pic-value pic-value-coral">{age} {ageUnit}</span>
  </div>
  {/* Height row */}
  {girl.height != null && (
    <div className="pic-row">
      <span className="pic-label">{heightLabel}</span>
      <span className="pic-value">{girl.height} cm</span>
    </div>
  )}
  {/* Weight, Bust, Eyes, Hair, Tattoo, Piercing — same pattern */}
  ...
  {/* Languages as last row(s) */}
  {languages.length > 0 && (
    <div className="pic-row pic-row-last">
      <span className="pic-label">{langLabel}</span>
      <span className="pic-value">{languages.map(l => getLangName(l, locale)).join(', ')}</span>
    </div>
  )}
</div>
```

### Step 2: Add CSS for Card Layout

In `app/globals.css`, add new styles and keep the existing `.psd-pill` styles for mobile:

```css
/* Profile info card — desktop stat box */
.profile-info-card {
  background: var(--bg-card);
  border: 1px solid var(--color-line-mid, rgba(255,255,255,0.08));
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 18px;
}
.pic-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line);
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
.pic-value-coral {
  color: var(--color-coral);
  font-weight: 700;
}
```

### Step 3: Keep Mobile Pill Layout Unchanged

The mobile version in `ProfilHero.tsx` uses `.ig-stat-details` with `.psd-pill` and is hidden on desktop via CSS (`profile-desktop-only` class). **No changes needed to mobile.**

The existing CSS that hides `.profile-stat-details:not(.ig-stat-details)` on mobile (line 3160) should be updated to also target `.profile-info-card`:

```css
@media (max-width: 768px) {
  .profile-info-card {
    display: none !important;
  }
}
```

But since `.profile-desktop-only` is already applied, this may already be handled.

### Step 4: Verify `profile-desktop-only` CSS

Check that `.profile-desktop-only` class correctly hides on mobile. If so, no additional mobile-hide CSS is needed.

## Files to Modify

| File | Changes |
|------|---------|
| `components/profil/ProfilDetails.tsx` | Replace pill row (lines 288-351) with card layout |
| `app/globals.css` | Add `.profile-info-card`, `.pic-row`, `.pic-label`, `.pic-value` styles |

## Scope
- 2 files modified
- ~60 lines of JSX replaced, ~25 lines of CSS added
- Low risk — desktop-only visual change, mobile untouched
- No `'use client'` needed — this is server-rendered HTML+CSS
