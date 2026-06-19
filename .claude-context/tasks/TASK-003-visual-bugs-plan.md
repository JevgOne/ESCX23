# TASK-003: Fix visual bugs on homepage (eyebrow + trust row) — Plan

## Analysis

Without direct access to the user's screenshot, this plan identifies the most likely issues based on code analysis and provides specific areas for the implementor to investigate and fix.

---

## Bug 1: Section eyebrow formatting

### Where
`components/home/ActivityFeed.tsx:19` (and all other homepage sections using the same pattern):
```tsx
<div className="section-eyebrow">— {t('eyebrow')}</div>
```

### CSS
`app/globals.css:282-289`:
```css
.section-eyebrow {
  font-size: 11px;
  letter-spacing: 0.3em;
  color: var(--color-coral);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
}
```

### Likely issue
The `letter-spacing: 0.3em` applies to the em dash `—` character too, creating awkward spacing. When rendered with uppercase text, it looks like:
```
—   L A T E S T   U P D A T E S
```
The gap after the em dash is visually too large because letter-spacing adds after every character including `—`.

### Possible fixes (implementor should verify visually which one the user wants)

**Option A: Remove the em dash from JSX, use CSS instead**
```tsx
<div className="section-eyebrow">{t('eyebrow')}</div>
```
And add the em dash via CSS pseudo-element where letter-spacing doesn't apply:
```css
.section-eyebrow::before {
  content: '— ';
  letter-spacing: normal;
}
```

**Option B: Keep as-is but wrap the em dash**
```tsx
<div className="section-eyebrow"><span style={{ letterSpacing: 'normal' }}>— </span>{t('eyebrow')}</div>
```

**Option C: The em dash was never supposed to be there**
Some of the i18n eyebrow texts might already include the dash. Check all `eyebrow` values in messages/*.json — they do NOT include the dash (it's hardcoded in JSX). The mockup uses `— Aktualizace` etc. which matches current behavior.

### Recommendation
Option A is the cleanest. Apply to ALL files that use this pattern:
- `components/home/ActivityFeed.tsx:19`
- `components/home/GirlsGridSection.tsx:24`
- `components/home/ContactSteps.tsx:14`
- `components/home/HashtagCloud.tsx:54`
- `components/home/LocationsRow.tsx:38`
- `components/home/ReviewsStrip.tsx:45`

The `FeaturedNew` component does NOT use this pattern — it uses `section-eyebrow-new` class. Leave it as is.

### Files to modify
| File | Change |
|------|--------|
| `components/home/ActivityFeed.tsx` | Remove `—` from JSX |
| `components/home/GirlsGridSection.tsx` | Remove `—` from JSX |
| `components/home/ContactSteps.tsx` | Remove `—` from JSX |
| `components/home/HashtagCloud.tsx` | Remove `—` from JSX |
| `components/home/LocationsRow.tsx` | Remove `—` from JSX |
| `components/home/ReviewsStrip.tsx` | Remove `—` from JSX |
| `app/globals.css` | Add `.section-eyebrow::before` with `content: '— '` and `letter-spacing: normal` |

---

## Bug 2: Stray element near trust cards (bottom-left)

### Where
`components/home/TrustRow.tsx` and `app/globals.css:1353-1397`

### Current CSS
```css
.trust-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
}
.trust-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-line);
  border-radius: 14px;
  padding: 24px 20px;
  text-align: center;
  transition: all 0.15s;
}
.trust-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  background: rgba(217, 69, 112, 0.1);
  color: var(--color-coral);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
```

### Possible causes of "stray arc"

**Cause A: The `.trust-card:hover` transform + border change creating a visual artifact**
The `transform: translateY(-2px)` on hover with `border-color` change could cause a rendering artifact in some browsers, but this shouldn't be visible without hover.

**Cause B: An artifact from the `.activity-feed` section's background gradient above**
The activity feed section has a multi-stop linear-gradient background. If the sections are not properly spaced, the gradient edge could show as a visible "arc" between sections.

**Cause C: Browser-specific emoji rendering**
The `✓` icon in the first trust card could render differently across browsers/OS, potentially causing overflow from the 56x56 icon container.

### Investigation steps for implementor
1. Open Chrome DevTools on the homepage
2. Inspect the area around the trust row at bottom-left
3. Check if there's an overlapping element from another section
4. Check if the stray element is part of the `.activity-feed` gradient bleeding into the trust section
5. Check if any parent element has `overflow: visible` causing content to leak

### Likely fix
The implementor needs to visually identify the exact element. Most likely solutions:
- Add `overflow: hidden` to `.trust-row` or the parent `.section`
- If it's the activity-feed gradient: ensure the sections have proper stacking/separation
- If it's an emoji rendering issue: use SVG icons instead of emoji characters for the trust icons

### Files to check/modify
| File | What to check |
|------|---------------|
| `app/globals.css` | `.trust-row`, `.trust-card`, `.trust-icon`, `.activity-feed` |
| `components/home/TrustRow.tsx` | Component structure |

---

## Testing plan
1. Run dev server: `npm run dev`
2. Open homepage in both CS and EN locales
3. Verify eyebrow text formatting looks correct across all sections
4. Verify no stray elements near trust cards at any viewport width
5. Check mobile responsive view (768px breakpoint) for trust row grid
6. Verify with disabled JS (no-JS compliance per project rules)
