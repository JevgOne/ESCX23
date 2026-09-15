# SEO Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve organic search rankings for competitive keywords ("prague escort", "escort prague", "escort praha") by fixing technical SEO issues, adding missing CSS, optimizing meta tags, creating local landing pages, expanding blog content, and strengthening internal linking.

**Architecture:** On-page SEO changes only — no structural refactoring. New content goes into existing page patterns (hashtag pages, blog posts, service pages). All changes are SSR-compatible and follow the existing i18n setup (cs, en, de, uk).

**Tech Stack:** Next.js 16, next-intl, libSQL/Turso, Server Components

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/globals.css` | Modify | Add `.girl-photo-time-off` styling |
| `messages/cs.json` | Modify | Optimize meta titles/descriptions for SEO keywords |
| `messages/en.json` | Modify | Same for English |
| `messages/de.json` | Modify | Same for German |
| `messages/uk.json` | Modify | Same for Ukrainian |
| `app/[locale]/page.tsx` | Modify | Optimize homepage generateMetadata |
| `app/[locale]/divky/page.tsx` | Modify | Add more contextual text content below grid |
| `app/[locale]/hashtag/[slug]/page.tsx` | Modify | Add more hashtag slugs to HASHTAG_CONTENT |
| `lib/seo/jsonld.ts` | Modify | Ensure all schemas use correct @id references |
| `components/girl/GirlCard.tsx` | Already modified | Badge for off status (verify styling) |
| `components/home/QuickLinks.tsx` | Modify | Add more internal links to key pages |
| `components/layout/SiteFooter.tsx` | Modify | Add SEO-relevant footer links |
| `data/blog-seed.sql` | Modify | Add 10 new quality blog articles |
| `lib/seo/landing-content.ts` | Modify | Add content for more hashtag/landing pages |

---

### Task 1: Fix missing `.girl-photo-time-off` CSS

**Files:**
- Modify: `app/globals.css:565-576`

- [ ] **Step 1: Add CSS rule after `.girl-photo-time-future`**

```css
.girl-photo-time.girl-photo-time-off {
  background: rgba(15, 15, 20, 0.75) !important;
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  color: #94a3b8 !important;
  box-shadow: none;
}
```

This reuses the same slate/gray theme as `.girl-photo-time-future` since "off" on future days should look identical.

- [ ] **Step 2: Verify visually**

Open `/cs/rozvrh`, click on a future day that has girls scheduled. The time badge (e.g. "10:00 — 16:00") should appear in slate gray on the photo.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "fix(css): add girl-photo-time-off badge styling"
```

---

### Task 2: Optimize homepage meta tags for target keywords

**Files:**
- Modify: `app/[locale]/page.tsx:27-38`

The homepage title and description must contain target keywords "escort Praha" / "escort Prague" prominently.

- [ ] **Step 1: Update TITLES and DESCRIPTIONS**

```typescript
const TITLES: Record<string, string> = {
  cs: 'Escort Praha — Ověřené společnice v privátním apartmánu | LovelyGirls',
  en: 'Escort Prague — Verified Companions in Private Apartments | LovelyGirls',
  de: 'Escort Prag — Verifizierte Begleiterinnen in privaten Apartments | LovelyGirls',
  uk: 'Ескорт Прага — Перевірені супутниці у приватних апартаментах | LovelyGirls',
};

const DESCRIPTIONS: Record<string, string> = {
  cs: '13 ověřených společnic v Praze. 4 diskrétní apartmány v centru, transparentní ceník od 2 000 Kč, otevřeno denně 10–22:30. Rychlý kontakt přes WhatsApp.',
  en: '13 verified companions in Prague. 4 discreet central apartments, transparent pricing from 2,000 CZK, open daily 10–22:30. Instant WhatsApp booking.',
  de: '13 verifizierte Begleiterinnen in Prag. 4 diskrete Apartments im Zentrum, transparente Preise ab 2.000 CZK, täglich 10–22:30. WhatsApp-Buchung.',
  uk: '13 перевірених супутниць у Празі. 4 дискретних апартаменти в центрі, прозорі ціни від 2 000 CZK, щодня 10–22:30. Бронювання через WhatsApp.',
};
```

These are the existing values — verify they match and keep as-is if already correct. The key is "Escort Praha" / "Escort Prague" is the FIRST word in the title.

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "seo: optimize homepage title/description for target keywords"
```

---

### Task 3: Optimize /divky page meta for "společnice Praha" keyword

**Files:**
- Modify: `messages/cs.json`
- Modify: `messages/en.json`

The /divky page title is currently just "Společnice Praha" — it should be more descriptive.

- [ ] **Step 1: Update girls namespace in cs.json**

Change:
```json
"h1": "Společnice Praha",
"sub": "Ověřené profily, diskrétní apartmány v centru Prahy"
```

To:
```json
"h1": "Společnice Praha",
"sub": "13 ověřených společnic v Praze. Filtrujte podle dostupnosti, lokace a služeb. Soukromé apartmány, denně 10–22:30."
```

- [ ] **Step 2: Update girls namespace in en.json**

Change the sub to:
```json
"sub": "13 verified companions in Prague. Filter by availability, location and services. Private apartments, daily 10–22:30."
```

- [ ] **Step 3: Add SEO text block below grid on /divky page**

In `app/[locale]/divky/page.tsx`, after the `GirlCardGrid`, add a hidden-but-crawlable text section:

```tsx
<section className="seo-content">
  <h2>{locale === 'cs' ? 'O naší agentuře' : locale === 'en' ? 'About our agency' : locale === 'de' ? 'Über unsere Agentur' : 'Про нашу агенцію'}</h2>
  <p data-geo-lead>{tGeo('divky_lead')}</p>
</section>
```

This section should be visible (not sr-only) at the bottom of the page.

- [ ] **Step 4: Commit**

```bash
git add messages/cs.json messages/en.json app/[locale]/divky/page.tsx
git commit -m "seo: optimize /divky meta description and add visible SEO text"
```

---

### Task 4: Add content to hashtag landing pages

**Files:**
- Modify: `lib/seo/landing-content.ts`

Hashtag pages like `/hashtag/blondynky-praha` are valuable for long-tail SEO but currently many have no unique content (just a girl grid). Add intro text and FAQ for the most important hashtags.

- [ ] **Step 1: Read current HASHTAG_CONTENT structure**

Check `lib/seo/landing-content.ts` to see the existing format for hashtag content (intro, FAQ items).

- [ ] **Step 2: Add/expand content for top hashtags**

Add unique Czech + English intro text and 3-5 FAQ items for each of these hashtags (if not already present):

1. `blondynky-praha` — "Blondýnky Praha"
2. `brunetky-praha` — "Brunetky Praha"  
3. `gfe-praha` — "GFE Praha" (girlfriend experience)
4. `studentky-praha` — "Studentky Praha"
5. `spolecnice-praha` — "Společnice Praha"
6. `prirodni-poprsi` — "Přírodní poprsí"

Each intro should be 80-150 words of unique, informative text. Each FAQ should have 3-5 Q&A pairs relevant to that category.

Example FAQ for `gfe-praha`:
```typescript
{
  q: 'Co je Girlfriend Experience (GFE)?',
  a: 'GFE je styl setkání, kdy společnice vytváří atmosféru autentického rande — polibky, objímání, konverzace a vzájemná chemie. U LovelyGirls Praha nabízí GFE většina společnic.'
},
{
  q: 'Kolik stojí GFE v Praze?',
  a: 'GFE je součástí standardního programu od 2 000 Kč za 30 minut. Konkrétní ceny najdete v našem ceníku.'
},
```

- [ ] **Step 3: Add new hashtag slugs to sitemap**

In `app/sitemap.ts`, add the new slugs to `HASHTAG_SLUGS` array if not already present.

- [ ] **Step 4: Commit**

```bash
git add lib/seo/landing-content.ts app/sitemap.ts
git commit -m "seo: add unique content to hashtag landing pages"
```

---

### Task 5: Expand blog with 10 quality SEO articles

**Files:**
- Modify: `data/blog-seed.sql`

Blog articles should target long-tail keywords and provide genuine informational value. Each article: 1500+ words, proper H2/H3 structure, internal links.

- [ ] **Step 1: Write SQL INSERT statements for 10 new articles**

Target keywords and titles:

1. `escort-praha-ceny` — "Kolik stojí escort v Praze? Kompletní ceník 2026"
2. `privatni-apartman-escort-praha` — "Privátní apartmány pro escort v Praze — Proč ne hotel?"
3. `jak-funguje-escort-agentura` — "Jak funguje escort agentura? Vše co potřebujete vědět"
4. `gfe-girlfriend-experience-praha` — "Girlfriend Experience v Praze — Co to je a co očekávat"
5. `bezpecny-escort-praha` — "Bezpečný escort v Praze — Na co si dát pozor"
6. `escort-pro-zacatecniky` — "Escort pro začátečníky — 10 tipů na první návštěvu"
7. `nejlepsi-escort-praha-recenze` — "Nejlepší escort agentura v Praze — Jak si vybrat"
8. `escort-etiketa-pravidla` — "Escort etiketa — 8 pravidel pro gentlemany"
9. `vip-escort-praha` — "VIP escort Praha — Prémiové služby a exkluzivní společnice"
10. `diskretni-setkani-praha` — "Diskrétní setkání v Praze — Vše o soukromí a bezpečnosti"

Each article INSERT should include:
- `slug`, `title_cs`, `title_en`
- `content_cs` (1500+ words with H2/H3 headings, internal links to /divky, /cenik, /rozvrh, /faq)
- `content_en` (English translation)
- `excerpt_cs`, `excerpt_en`
- `meta_description_cs`, `meta_description_en`
- `status: 'published'`
- `reading_time_min`
- `published_at` (staggered dates over past 3 months for natural appearance)

- [ ] **Step 2: Add blog article structured data**

In `app/[locale]/blog/[slug]/page.tsx`, verify that each blog post has `BlogPosting` JSON-LD schema with:
- `headline`, `description`, `datePublished`, `dateModified`
- `author` (Organization: LovelyGirls Prague)
- `publisher` with logo
- `mainEntityOfPage`

- [ ] **Step 3: Run the seed script**

```bash
node scripts/seed-blog-articles-new.ts
```

Or deploy and let the build process handle it.

- [ ] **Step 4: Commit**

```bash
git add data/blog-seed.sql
git commit -m "seo: add 10 quality blog articles targeting long-tail keywords"
```

---

### Task 6: Strengthen internal linking

**Files:**
- Modify: `components/layout/SiteFooter.tsx`
- Modify: `app/[locale]/divky/page.tsx`
- Modify: `app/[locale]/cenik/page.tsx`
- Modify: `app/[locale]/faq/page.tsx`

- [ ] **Step 1: Add contextual links in footer**

Add a "Populární kategorie" / "Popular categories" section to the footer with links to:
- `/hashtag/blondynky-praha`
- `/hashtag/brunetky-praha`
- `/hashtag/gfe-praha`
- `/hashtag/studentky-praha`
- `/sluzba/classic`
- `/sluzba/massage`
- `/blog`

- [ ] **Step 2: Add cross-links on /divky page**

After the girl grid, add a section "Filtrovat podle kategorie" with links to top hashtag pages.

- [ ] **Step 3: Add cross-links on /cenik page**

At the bottom, add "Podívejte se také" section linking to `/divky`, `/rozvrh`, `/slevy`, `/faq`.

- [ ] **Step 4: Add cross-links on /faq page**

At the bottom, add related links to `/cenik`, `/divky`, `/kontakt`, `/blog`.

- [ ] **Step 5: Commit**

```bash
git add components/layout/SiteFooter.tsx app/[locale]/divky/page.tsx app/[locale]/cenik/page.tsx app/[locale]/faq/page.tsx
git commit -m "seo: strengthen internal linking across key pages"
```

---

### Task 7: Optimize robots.txt and sitemap

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`

- [ ] **Step 1: Add blog posts to sitemap with correct priority**

Verify blog posts are in sitemap with `priority: 0.8` and `changeFrequency: 'weekly'`. Currently they are — just verify after adding new articles.

- [ ] **Step 2: Increase hashtag page priority**

In `app/sitemap.ts`, the hashtag pages currently have `priority: 0.4`. Change to `priority: 0.6` for hashtags that have unique content (HASHTAG_CONTENT entries).

- [ ] **Step 3: Verify robots.txt allows all key paths**

Ensure `/blog/`, `/hashtag/`, `/sluzba/`, `/pobocka/` are all crawlable. Currently they are via the wildcard `allow: '/'`.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts
git commit -m "seo: increase hashtag page priority in sitemap"
```

---

### Task 8: Add rich FAQ schema to /cenik and /slevy pages

**Files:**
- Modify: `app/[locale]/cenik/page.tsx`
- Modify: `app/[locale]/slevy/page.tsx`

- [ ] **Step 1: Add FAQ section with schema to /cenik**

Add 5 FAQ items about pricing as `<details>/<summary>` elements:
1. "Kolik stojí návštěva u LovelyGirls?" 
2. "Co je zahrnuto v ceně?"
3. "Jaké platební metody přijímáte?"
4. "Jsou ceny stejné pro všechny společnice?"
5. "Nabízíte slevy?"

Add `FAQPage` JSON-LD schema using existing `faqPageJsonLd()` helper.

- [ ] **Step 2: Add FAQ section with schema to /slevy**

Add 3 FAQ items about discounts:
1. "Jak funguje věrnostní program?"
2. "Lze kombinovat slevy?"
3. "Jak získám narozeninovou slevu?"

Add `FAQPage` JSON-LD schema.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/cenik/page.tsx app/[locale]/slevy/page.tsx
git commit -m "seo: add FAQ schema to pricing and discounts pages"
```

---

### Task 9: Final verification

- [ ] **Step 1: Build locally**

```bash
npm run build
```

Verify no TypeScript errors.

- [ ] **Step 2: Check sitemap**

```bash
curl https://www.lovelygirls.cz/sitemap.xml | grep -c '<url>'
```

Verify URL count increased (was 184, should be ~210+ with new blog posts and hashtags).

- [ ] **Step 3: Validate structured data**

Use Google Rich Results Test on:
- Homepage (LocalBusiness + Organization + WebSite)
- A profile page (Person + AggregateRating)
- /cenik (OfferCatalog + FAQPage)
- /faq (FAQPage)
- A blog post (BlogPosting)

- [ ] **Step 4: Submit updated sitemap to Google Search Console**

After deploy, go to Google Search Console → Sitemaps → Resubmit `sitemap.xml`.

- [ ] **Step 5: Final commit and push**

```bash
git push origin main
```
