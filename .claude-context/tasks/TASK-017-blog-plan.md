# TASK-017: Blog plan — 12 new articles (3 months, 1/week)

**Date:** 2026-07-06
**Target:** 12 new blog posts, published 1 per week from July 14 to October 6, 2026

---

## CURRENT STATE

### Existing articles (12 total)

**From `data/blog-seed.sql` (5, published May 2026):**
1. `escort-praha-kompletni-pruvodce` — Complete guide to escort Prague
2. `jak-vybrat-spolecnici-praha` — How to choose a companion (7 tips)
3. `girlfriend-experience-gfe-praha` — GFE explained
4. `soukrome-apartmany-escort-praha` — Private apartments
5. `prvni-navsteva-escort-agentury` — First visit guide

**From `scripts/seed-blog-articles.ts` (7, queued for seeding):**
6. `ceny-escort-praha` — Pricing explained
7. `etiketa-escort-setkani` — Etiquette guide
8. `bdsm-praha-pruvodce` — BDSM guide
9. `escort-do-hotelu-praha` — Hotel escort (outcall)
10. `nocni-zivot-escort-praha` — Night life + escort
11. `bezpecnost-escort-setkani` — Safety guide
12. `typy-spolecnic-praha` — Types of companions

### Topics already covered (DO NOT DUPLICATE):
- General "how it works" guide
- Choosing a companion
- GFE
- Private apartments
- First visit
- Pricing
- Etiquette
- BDSM
- Hotel/outcall
- Night life
- Safety
- Companion types

### DB schema (blog_posts table):
| Column | Type | Notes |
|--------|------|-------|
| id | INT | auto |
| slug | TEXT | unique, URL slug |
| title_cs | TEXT | required |
| title_en | TEXT | |
| excerpt_cs | TEXT | short preview |
| excerpt_en | TEXT | |
| content_cs | TEXT | full HTML |
| content_en | TEXT | full HTML |
| meta_description_cs | TEXT | SEO meta |
| meta_description_en | TEXT | SEO meta |
| cover_url | TEXT | cover image URL |
| author | TEXT | default "Redakce" |
| status | TEXT | draft / published |
| reading_time_min | INT | |
| published_at | DATETIME | |
| created_at | DATETIME | auto |
| updated_at | DATETIME | auto |

Tags: `blog_tags` (id, slug, name_cs, name_en) + `blog_post_tags` (post_id, tag_id)

### Localization:
- Blog content is CS + EN only (DE/UK redirect to CS, see `app/[locale]/blog/page.tsx:63-66`)
- Copywriter agents: copywriter-cs, copywriter-en handle content
- DE/UK copywriters not needed for blog (redirects in place)

---

## CONTENT STRATEGY

### Goals:
1. **SEO traffic** — target long-tail keywords tourists/expats search for
2. **GEO optimization** — content AI crawlers can cite when answering questions about Prague escort
3. **Internal linking** — each post links to relevant profiles, services, locations, hashtags
4. **Trust building** — show expertise, professionalism, Prague knowledge
5. **Seasonal relevance** — summer → autumn transition, tourist season

### Content pillars (3-4 per pillar):
- **Prague Guide** — city knowledge for visitors (localization, travel tips)
- **Service Deep-Dives** — detailed explanations of specific services/features
- **Client Education** — practical tips, common questions, myths
- **Seasonal/Topical** — tied to time of year, events, trends

---

## 12 NEW ARTICLES — PUBLICATION SCHEDULE

### Week 1 — July 14, 2026

**Article 13:** `co-je-escort-agentura`
- **CS:** Co je escort agentura a jak se liší od privátních inzerátů
- **EN:** What Is an Escort Agency and How It Differs From Private Ads
- **Pillar:** Client Education
- **Target keywords:** escort agentura Praha, rozdíl agentura vs privat, verified escort Prague
- **Content outline:**
  - Definition of agency vs independent vs street-level
  - Verification process (ID check, photo verification, health)
  - Insurance: refund policy, guaranteed quality
  - Red flags in private ads (stock photos, prepayment, no reviews)
  - Why agencies cost more but deliver safer experience
  - FAQ: "Is an agency more expensive?" "Can I trust the photos?"
- **Internal links:** /divky, /faq, /recenze
- **Reading time:** 5 min
- **Tags:** pruvodce, bezpecnost

### Week 2 — July 21, 2026

**Article 14:** `nejlepsi-ctvrti-praha-navsteva`
- **CS:** Nejlepší čtvrti Prahy pro diskrétní návštěvu: Vinohrady, Žižkov, Karlín, Nové Město
- **EN:** Best Prague Neighbourhoods for a Discreet Visit: Vinohrady, Zizkov, Karlin, New Town
- **Pillar:** Prague Guide
- **Target keywords:** escort Vinohrady, escort Žižkov, escort Karlín, Prague districts
- **Content outline:**
  - Overview of each district where LovelyGirls has apartments
  - Vinohrady (Praha 2): quiet residential, cafes, wine bars, easy metro access
  - Žižkov (Praha 3): local vibe, TV tower, craft beer, open since June 18
  - Karlín (Praha 8): modern riverside, restaurants, business traveler friendly
  - Nové Město (Praha 1): city center, walking distance to Old Town
  - How to get there (metro/tram from main stations)
  - Which district fits which client type
  - FAQ: "Can I choose which apartment?" "Is there parking?"
- **Internal links:** /pobocka/praha-2, /pobocka/praha-3, /pobocka/praha-8, /pobocka/praha-1
- **Reading time:** 6 min
- **Tags:** praha, lokace

### Week 3 — July 28, 2026

**Article 15:** `recenze-proc-jsou-dulezite`
- **CS:** Proč jsou recenze klíčové při výběru společnice (a jak napsat dobrou recenzi)
- **EN:** Why Reviews Matter When Choosing a Companion (and How to Write a Good One)
- **Pillar:** Client Education
- **Target keywords:** escort recenze Praha, jak napsat recenzi, companion reviews Prague
- **Content outline:**
  - How reviews help other clients make better choices
  - What makes a helpful review (specific, respectful, honest)
  - What NOT to write (explicit details, identifying info)
  - How LovelyGirls moderates reviews (no fake reviews, verification)
  - Impact on companions: motivation, reputation, earnings
  - Step-by-step: how to leave a review on LovelyGirls
  - FAQ: "Are reviews anonymous?" "Can I edit my review?"
- **Internal links:** /recenze, /recenze/nova/{slug}, /profil/{slug}
- **Reading time:** 4 min
- **Tags:** tipy, recenze

### Week 4 — August 4, 2026

**Article 16:** `escort-pro-cizince-praha`
- **CS:** Escort v Praze pro turisty a cizince: Kompletní průvodce
- **EN:** Escort in Prague for Tourists and Foreigners: Complete Guide
- **Pillar:** Prague Guide
- **Target keywords:** escort Prague tourist, escort for foreigners, English speaking escort Prague
- **Content outline:**
  - Why Prague is a top destination for gentlemen travelers
  - Language barrier: companions speak EN, CZ, some DE/RU/UK
  - Currency: CZK and EUR accepted, no cards
  - Airport → apartment: how to get there from PRG
  - Hotel outcall option for those staying in city center
  - Cultural differences: what to expect vs other European cities
  - Legal situation explained (completely legal in CZ for 18+)
  - Time zone, opening hours in local time
  - FAQ: "Do I need to speak Czech?" "Can I pay in EUR?"
- **Internal links:** /faq, /cenik, /rozvrh, /kontakt
- **Reading time:** 6 min
- **Tags:** praha, turistika, pruvodce

### Week 5 — August 11, 2026

**Article 17:** `duo-escort-praha`
- **CS:** Duo setkání v Praze: Vše co potřebujete vědět o setkání se dvěma společnicemi
- **EN:** Duo Meeting in Prague: Everything You Need to Know About Meeting Two Companions
- **Pillar:** Service Deep-Dive
- **Target keywords:** duo escort Praha, two girls escort Prague, threesome escort
- **Content outline:**
  - What is a duo meeting and who is it for
  - How it works: booking, choosing compatible pairs
  - Pricing for duo (how it differs from standard)
  - Which companions offer duo service (check profiles)
  - Tips for first-timers: communication, expectations, pace
  - Duration recommendation: 90min or 120min for full experience
  - FAQ: "Can I choose any two girls?" "Is the price double?"
- **Internal links:** /divky, /cenik, /sluzba/{duo-slug}
- **Reading time:** 5 min
- **Tags:** sluzby, duo

### Week 6 — August 18, 2026

**Article 18:** `jak-funguje-rezervace`
- **CS:** Jak funguje rezervace u LovelyGirls: Od prvního kontaktu po setkání
- **EN:** How Booking Works at LovelyGirls: From First Contact to Meeting
- **Pillar:** Client Education
- **Target keywords:** jak rezervovat escort Praha, booking escort Prague, WhatsApp escort
- **Content outline:**
  - Step 1: Browse profiles, check schedule
  - Step 2: Contact via WhatsApp/Telegram (+420 734 332 131)
  - Step 3: Choose companion + program + time
  - Step 4: Receive apartment address 30-60min before
  - Step 5: Arrive, pay cash, enjoy
  - Cancellation policy
  - What if my preferred companion is unavailable
  - Last-minute vs advance booking
  - FAQ: "How far in advance should I book?" "What if I'm late?"
- **Internal links:** /rozvrh, /kontakt, /divky, /cenik
- **Reading time:** 4 min
- **Tags:** pruvodce, rezervace

### Week 7 — August 25, 2026

**Article 19:** `letni-praha-tipy-pro-gentlemany`
- **CS:** Letní Praha: Tipy pro gentlemany na nezapomenutelný víkend
- **EN:** Summer Prague: Tips for Gentlemen for an Unforgettable Weekend
- **Pillar:** Seasonal/Prague Guide
- **Target keywords:** Prague summer weekend, gentleman Prague tips, luxury weekend Prague
- **Content outline:**
  - Best summer restaurants and bars near LovelyGirls apartments
  - Rooftop bars and sunset spots
  - Prague by night: what to do after 10 PM
  - Day plan: sightseeing → dinner → LovelyGirls evening
  - Weekend plan: Friday evening → Saturday exploration → Sunday farewell
  - Companion as dinner date (outcall option)
  - Weather and dress code tips for summer
  - FAQ: "Is it busy in summer?" "Should I book in advance?"
- **Internal links:** /rozvrh, /o-nas, /divky
- **Reading time:** 5 min
- **Tags:** praha, sezonna, lifestyle

### Week 8 — September 1, 2026

**Article 20:** `eroticka-masaz-vs-escort`
- **CS:** Erotická masáž vs. escort setkání: Jaký je rozdíl a co vám víc vyhovuje
- **EN:** Erotic Massage vs. Escort Meeting: What's the Difference and Which Suits You
- **Pillar:** Service Deep-Dive
- **Target keywords:** erotická masáž Praha, erotic massage vs escort Prague, rozdíl masáž escort
- **Content outline:**
  - Definition: massage parlor vs escort agency
  - Service scope comparison (massage = limited, escort = full)
  - Privacy comparison (shared salon vs private apartment)
  - Price comparison (similar range, different value)
  - Time flexibility (massage fixed 30-60min, escort 30min-overnight)
  - Personalization: escort allows choosing specific companion
  - Quality assurance: reviews, verified profiles
  - When to choose which (first-timers, specific preferences)
  - FAQ: "Can I get a massage at LovelyGirls?" "Is it the same price?"
- **Internal links:** /sluzba/{massage-slug}, /divky, /cenik
- **Reading time:** 5 min
- **Tags:** sluzby, porovnani

### Week 9 — September 8, 2026

**Article 21:** `vernostni-program-lovelygirls`
- **CS:** Věrnostní program LovelyGirls: Jak získat slevy a VIP výhody
- **EN:** LovelyGirls Loyalty Program: How to Earn Discounts and VIP Benefits
- **Pillar:** Service Deep-Dive
- **Target keywords:** escort slevy Praha, loyalty program escort, VIP escort Prague
- **Content outline:**
  - How the loyalty tiers work (Bronze, Silver, Gold)
  - How to accumulate visits
  - Discount percentages per tier
  - Exclusive VIP benefits (priority booking, special events)
  - Member-only services or companions
  - How to apply for membership
  - Current active discounts and promotions
  - FAQ: "How many visits for Gold?" "Can I combine discounts?"
- **Internal links:** /slevy, /clenstvi/zadost, /cenik
- **Reading time:** 4 min
- **Tags:** vernost, slevy, clenstvi

### Week 10 — September 15, 2026

**Article 22:** `pravni-ramec-escort-cesko`
- **CS:** Právní rámec escort služeb v České republice: Co říká zákon
- **EN:** Legal Framework of Escort Services in Czech Republic: What the Law Says
- **Pillar:** Client Education
- **Target keywords:** je escort legální, escort zákon ČR, legal escort Czech Republic
- **Content outline:**
  - Czech law on adult services (Act No. 40/2009 Coll., §168)
  - What is legal: consensual adult services, agency operation
  - What is illegal: trafficking, minors, coercion
  - Client perspective: no legal risk for clients 18+
  - How agencies ensure compliance (ID verification, 18+ records)
  - Comparison with other EU countries (DE regulated, AT regulated, etc.)
  - Tax and business registration of legitimate agencies
  - Privacy protection: no client databases, no records
  - FAQ: "Can I get in trouble?" "Are the girls legally employed?"
- **Internal links:** /faq, /podminky, /soukromi
- **Reading time:** 6 min
- **Tags:** pravo, bezpecnost, faq

### Week 11 — September 22, 2026

**Article 23:** `podzimni-praha-intimni-pruvodce`
- **CS:** Podzimní Praha: Intimní průvodce pro chladnější večery
- **EN:** Autumn Prague: An Intimate Guide for Cooler Evenings
- **Pillar:** Seasonal/Prague Guide
- **Target keywords:** Prague autumn, escort Prague October, autumn weekend Prague
- **Content outline:**
  - Why autumn is Prague's most romantic season
  - Cozy restaurants and wine bars near our apartments
  - Weekend trip plan: October in Prague
  - Longer programs for cold evenings (90min, 120min, overnight)
  - GFE as the perfect autumn experience
  - Fewer tourists = more availability, less rush
  - Halloween special (if applicable)
  - FAQ: "Is it less busy in autumn?" "Do you have special offers?"
- **Internal links:** /rozvrh, /divky, /hashtag/gfe-praha, /cenik
- **Reading time:** 5 min
- **Tags:** praha, sezonna, lifestyle

### Week 12 — October 6, 2026 (bridge to next quarter if needed)

**Article 24:** `10-duvodu-lovelygirls`
- **CS:** 10 důvodů proč si klienti vybírají LovelyGirls Praha
- **EN:** 10 Reasons Why Clients Choose LovelyGirls Prague
- **Pillar:** Client Education / Trust
- **Target keywords:** nejlepší escort Praha, best escort agency Prague, proč LovelyGirls
- **Content outline:**
  1. Verified companions (in-person ID + photo check)
  2. Real photos (no filters, no stock)
  3. Transparent pricing (no hidden fees)
  4. 4 private apartments in central Prague
  5. Client reviews (hundreds of verified reviews)
  6. Professional reception (EN/CZ/DE/UK/RU)
  7. Daily schedule updated live
  8. Loyalty program and regular discounts
  9. Strict privacy (no client records)
  10. Legal and compliant operation
  - Each reason with 2-3 sentence explanation
  - FAQ: "How do I know reviews are real?" "Can I visit anonymously?"
- **Internal links:** /divky, /recenze, /cenik, /slevy, /faq, /o-nas
- **Reading time:** 5 min
- **Tags:** pruvodce, o-nas

---

## IMPLEMENTATION NOTES

### Blog tags to create (new):
| Slug | name_cs | name_en |
|------|---------|---------|
| `pruvodce` | Průvodce | Guide |
| `bezpecnost` | Bezpečnost | Safety |
| `praha` | Praha | Prague |
| `tipy` | Tipy | Tips |
| `recenze` | Recenze | Reviews |
| `turistika` | Pro turisty | For Tourists |
| `sluzby` | Služby | Services |
| `duo` | Duo | Duo |
| `rezervace` | Rezervace | Booking |
| `sezonna` | Sezónní | Seasonal |
| `lifestyle` | Lifestyle | Lifestyle |
| `porovnani` | Porovnání | Comparison |
| `vernost` | Věrnost | Loyalty |
| `slevy` | Slevy | Discounts |
| `clenstvi` | Členství | Membership |
| `pravo` | Právo | Legal |
| `faq` | FAQ | FAQ |
| `o-nas` | O nás | About Us |

### Per-article implementation workflow:
1. **Copywriter-cs** writes full content_cs (HTML with `<h2>`, `<h3>`, `<p>`, `<ul>`)
2. **Copywriter-en** writes full content_en (matching structure, not translation — native-sounding)
3. Both provide: title, excerpt, meta_description, reading_time_min
4. **Implementor** inserts into DB via seed script or admin panel
5. Set `status = 'draft'` initially, publish on scheduled date
6. Assign relevant tags from the list above

### Content guidelines:
- Each article: 800-1200 words per language
- 3-5 `<h2>` sections, at least 1 FAQ section with `<h3>` questions
- Internal links as `<a href="/cs/...">` for CS, `<a href="/...">` for EN
- No external links except to legal references
- Author: "Redakce" (editorial team)
- Tone: professional but approachable, never sleazy
- SEO: target keyword in title, first paragraph, at least 2 headings

### Scheduling pattern:
- Publish every Monday at 10:00 CET
- Set `published_at` in advance, `status = 'published'`
- First 6 published during July-August (7 → seed+script already queued)
- Last 6 published during September-October

### Cover images:
- Each article needs a cover image (`cover_url`)
- Options: Unsplash (stock Prague photos) or custom OG images via admin
- Avoid photos of companions (privacy) — use Prague cityscape, apartments, lifestyle

---

## PRIORITY NOTES

Before creating new articles, ensure the 7 articles from `scripts/seed-blog-articles.ts` are actually seeded into DB. These should be published first (July 7-13 window) to fill the gap between May batch and new content.

Recommended publication timeline:
- **Week of July 7:** Seed the 7 queued articles (IDs 6-12) as published
- **July 14 onwards:** Start publishing new articles per this plan
