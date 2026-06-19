# SEO Recommendations — Per-Page Meta & Structured Data

**Datum:** 2026-06-14 | **Analyst:** planovac agent
**Basis:** Competitive analysis + current code audit + live production verification

---

## GENERAL PRINCIPLES

1. **Title formula:** `{Primary Keyword} — {Secondary Keyword} | {Brand}`
   - Max 60 chars (Google truncates at ~60)
   - Include city name in every title
   - Brand always last, after pipe

2. **Description formula:** `{Value proposition}. {Differentiator}. {CTA hint}.`
   - Max 155 chars (Google truncates at ~155-160)
   - Include primary keyword naturally
   - End with action-oriented phrase

3. **OG tags:** Always mirror title/description but can be slightly different (more casual for social)
   - `og:title` — can be shorter, more punchy
   - `og:description` — slightly longer (up to 200 chars), more descriptive
   - `og:url` — canonical URL
   - `og:locale` — cs_CZ, en_US, de_DE, uk_UA
   - `og:image` — always include (1200x630)

---

## PAGE-BY-PAGE RECOMMENDATIONS

### 1. HOMEPAGE (`/`)

**Current state:** Has title + description + openGraph in code, but OG missing in production (investigate applyDBOverride)

#### Titles (max 60 chars)

| Locale | Current | Recommended |
|--------|---------|-------------|
| cs | `LovelyGirls Praha — Ověřené společnice` | `Escort Praha — Ověřené společnice v privátním apartmánu \| LovelyGirls` |
| en | `LovelyGirls Prague — Verified Companions` | `Escort Prague — Verified Companions, Private Apartments \| LovelyGirls` |
| de | `LovelyGirls Prag — Verifizierte Begleiterinnen` | `Escort Prag — Verifizierte Begleiterinnen, Diskrete Apartments \| LovelyGirls` |
| uk | `LovelyGirls Прага — Перевірені супутниці` | `Ескорт Прага — Перевірені супутниці, Приватні апартаменти \| LovelyGirls` |

#### Descriptions (max 155 chars)

| Locale | Current | Recommended |
|--------|---------|-------------|
| cs | `LovelyGirls Praha: 13 ověřených společnic, 4 privátní byty...` | `13 ověřených společnic v Praze. 4 diskrétní apartmány, transparentní ceník, otevřeno denně 10–22:30. Kontakt přes WhatsApp.` |
| en | `LovelyGirls Prague: 13 verified companions, 4 private apartments...` | `13 verified companions in Prague. 4 discreet apartments, transparent pricing, open daily 10–22:30. Instant WhatsApp booking.` |
| de | `LovelyGirls Prag: 13 verifizierte Begleiterinnen...` | `13 verifizierte Begleiterinnen in Prag. 4 diskrete Apartments, transparente Preise, täglich 10–22:30. WhatsApp-Buchung.` |
| uk | `LovelyGirls Прага: 13 перевірених супутниць...` | `13 перевірених супутниць у Празі. 4 дискретних апартаменти, прозорі ціни, щодня 10–22:30. Бронювання через WhatsApp.` |

#### Structured data: KEEP (already excellent)
- LocalBusiness/ProfessionalService
- Organization
- WebSite with SearchAction
- AggregateRating

#### Fix needed:
- Investigate why OG tags don't render in production despite being in code

---

### 2. DIVKY / GIRLS LISTING (`/divky`)

**Current state:** Good — has OG, title, description from translation keys

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Společnice Praha — Ověřené dívky na escort a privát \| LovelyGirls` |
| en | `Prague Companions — Verified Escort Girls with Real Photos \| LovelyGirls` |
| de | `Begleiterinnen Prag — Verifizierte Escort-Mädchen \| LovelyGirls` |
| uk | `Супутниці Прага — Перевірені дівчата з реальними фото \| LovelyGirls` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Prohlédněte si ověřené společnice LovelyGirls Praha. Reálné fotky, transparentní ceny, filtr podle služeb a dostupnosti. Diskrétní apartmány v centru.` |
| en | `Browse verified companions at LovelyGirls Prague. Real photos, transparent pricing, filter by services & availability. Discreet central apartments.` |
| de | `Entdecken Sie verifizierte Begleiterinnen bei LovelyGirls Prag. Echte Fotos, transparente Preise, Filter nach Service und Verfügbarkeit.` |
| uk | `Перегляньте перевірених супутниць LovelyGirls Прага. Реальні фото, прозорі ціни, фільтр за послугами та доступністю.` |

#### Structured data: KEEP
- CollectionPage
- BreadcrumbList

---

### 3. PROFIL / PROFILE DETAIL (`/profil/[slug]`)

**Current state:** Has comprehensive generateMetadata with OG, twitter, alternates, JSON-LD. But OG missing in production.

#### Title template (already good, keep)

`{Name}, {Age} — Společnice Praha | LovelyGirls` (cs)
`{Name}, {Age} — Companion Prague | LovelyGirls` (en)
`{Name}, {Age} — Begleiterin Prag | LovelyGirls` (de)
`{Name}, {Age} — Супутниця Прага | LovelyGirls` (uk)

#### Description template (improve fallback)

| Locale | Recommended fallback |
|--------|---------------------|
| cs | `{Name}, {Age} let — ověřená společnice v Praze. {Bust}, {Hair}. Služby od {minPrice} Kč. Diskrétní apartmán, reálné fotky.` |
| en | `{Name}, {Age} — verified companion in Prague. {Bust}, {Hair}. Services from {minPrice} CZK. Discreet apartment, real photos.` |
| de | `{Name}, {Age} — verifizierte Begleiterin in Prag. {Bust}, {Hair}. Ab {minPrice} CZK. Diskretes Apartment, echte Fotos.` |
| uk | `{Name}, {Age} — перевірена супутниця у Празі. {Bust}, {Hair}. Послуги від {minPrice} CZK. Дискретні апартаменти.` |

#### Structured data: KEEP (already excellent)
- Person (with occupation, age, languages, aggregateRating)
- BreadcrumbList

#### Fix needed:
- Investigate why OG tags don't render in production
- Consider adding `og:type: profile` (already in code)

---

### 4. CENIK / PRICING (`/cenik`)

**Current state:** Good — has OG, title, description, OfferCatalog schema

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Ceník společnic Praha — Programy a ceny \| LovelyGirls` |
| en | `Escort Pricing Prague — Packages & Rates \| LovelyGirls` |
| de | `Escort Preise Prag — Programme und Preise \| LovelyGirls` |
| uk | `Ціни ескорт Прага — Програми та тарифи \| LovelyGirls` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Transparentní ceník LovelyGirls Praha. 5 programů od 30 do 120 minut, platba v hotovosti, žádné skryté poplatky. Extra služby na výběr.` |
| en | `Transparent pricing at LovelyGirls Prague. 5 packages from 30 to 120 minutes, cash payment, no hidden fees. Extra services available.` |
| de | `Transparente Preise bei LovelyGirls Prag. 5 Programme von 30 bis 120 Minuten, Barzahlung, keine versteckten Gebühren.` |
| uk | `Прозорі ціни LovelyGirls Прага. 5 програм від 30 до 120 хвилин, готівка, без прихованих платежів.` |

#### Structured data: KEEP
- OfferCatalog (5 packages)
- BreadcrumbList

---

### 5. ROZVRH / SCHEDULE (`/rozvrh`)

**Current state:** Good — has OG, title, description, alternates

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Rozvrh společnic dnes — Kdo je k dispozici \| LovelyGirls Praha` |
| en | `Companion Schedule Today — Who's Available \| LovelyGirls Prague` |
| de | `Zeitplan Begleiterinnen heute — Verfügbarkeit \| LovelyGirls Prag` |
| uk | `Розклад супутниць сьогодні — Хто доступний \| LovelyGirls Прага` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Kdo dnes pracuje u LovelyGirls Praha? Rozvrh společnic na celý týden. Filtrujte podle pobočky. Aktualizováno v reálném čase.` |
| en | `Who's working at LovelyGirls Prague today? Weekly companion schedule. Filter by apartment location. Updated in real time.` |
| de | `Wer arbeitet heute bei LovelyGirls Prag? Wöchentlicher Zeitplan. Nach Apartment filtern. Echtzeit-Aktualisierung.` |
| uk | `Хто працює у LovelyGirls Прага сьогодні? Тижневий розклад. Фільтруйте за локацією. Оновлення в реальному часі.` |

#### Structured data: KEEP
- BreadcrumbList

---

### 6. SLEVY / DISCOUNTS (`/slevy`)

**Current state:** Good — has OG, title, description, discountOffers schema

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Slevy a věrnostní program — Až 20 % sleva \| LovelyGirls Praha` |
| en | `Discounts & Loyalty Program — Up to 20 % Off \| LovelyGirls Prague` |
| de | `Rabatte & Treueprogramm — Bis zu 20 % Rabatt \| LovelyGirls Prag` |
| uk | `Знижки та програма лояльності — До 20 % знижки \| LovelyGirls Прага` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Ranní sleva, věrnostní bonus po 3/5/10 návštěvách, narozeninová sleva 20 %. LovelyGirls Praha odměňuje stálé klienty.` |
| en | `Morning discount, loyalty bonus after 3/5/10 visits, 20 % birthday discount. LovelyGirls Prague rewards returning clients.` |
| de | `Morgenrabatt, Treuebonus nach 3/5/10 Besuchen, 20 % Geburtstagsrabatt. LovelyGirls Prag belohnt Stammkunden.` |
| uk | `Ранкова знижка, бонус лояльності після 3/5/10 відвідувань, 20 % знижка до дня народження. LovelyGirls Прага.` |

#### Structured data: KEEP
- DiscountOffer / Offer schema

---

### 7. FAQ (`/faq`)

**Current state:** Has FAQPage JSON-LD (16 Q&A), but OG tags missing in production

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Časté dotazy — Escort Praha, rezervace, platba \| LovelyGirls` |
| en | `FAQ — Escort Prague Booking, Payment, Discretion \| LovelyGirls` |
| de | `FAQ — Escort Prag Buchung, Zahlung, Diskretion \| LovelyGirls` |
| uk | `Часті питання — Ескорт Прага, бронювання, оплата \| LovelyGirls` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Odpovědi na nejčastější otázky o escort službách v Praze. Jak rezervovat, platba hotově, diskrétnost, bezpečnost, legalita.` |
| en | `Answers to common questions about escort services in Prague. How to book, cash payment, discretion, safety, legality.` |
| de | `Antworten auf häufige Fragen über Escort-Services in Prag. Buchung, Barzahlung, Diskretion, Sicherheit, Legalität.` |
| uk | `Відповіді на часті питання про ескорт послуги в Празі. Як замовити, оплата готівкою, дискретність, безпека, легальність.` |

#### Structured data: KEEP (already excellent)
- FAQPage (16 Q&A)
- BreadcrumbList

#### Fix needed:
- Add `openGraph` to generateMetadata (currently missing in code)
- Investigate production OG rendering

---

### 8. RECENZE / REVIEWS (`/recenze`)

**Current state:** Has OG in code, but missing in production

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Recenze klientů — Zkušenosti se společnicemi \| LovelyGirls Praha` |
| en | `Client Reviews — Companion Experiences \| LovelyGirls Prague` |
| de | `Kundenbewertungen — Erfahrungen mit Begleiterinnen \| LovelyGirls Prag` |
| uk | `Відгуки клієнтів — Досвід з супутницями \| LovelyGirls Прага` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Skutečné anonymní recenze klientů LovelyGirls Praha. Hodnocení, zkušenosti a doporučení. Průměr 4.8 z 5 hvězd.` |
| en | `Real anonymous client reviews of LovelyGirls Prague. Ratings, experiences and recommendations. Average 4.8 out of 5 stars.` |
| de | `Echte anonyme Kundenbewertungen von LovelyGirls Prag. Bewertungen und Empfehlungen. Durchschnitt 4.8 von 5 Sternen.` |
| uk | `Справжні анонімні відгуки клієнтів LovelyGirls Прага. Оцінки та рекомендації. Середній бал 4.8 з 5 зірок.` |

#### Structured data: ADD
- Consider adding `AggregateRating` or `Review` schema on this page

---

### 9. BLOG (`/blog`)

**Current state:** Has OG, title, description, alternates. Good.

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Blog — Tipy, novinky a průvodci \| LovelyGirls Praha` |
| en | `Blog — Tips, News & Guides \| LovelyGirls Prague` |
| de | `Blog — Tipps, Neuigkeiten & Ratgeber \| LovelyGirls Prag` |
| uk | `Блог — Поради, новини та путівники \| LovelyGirls Прага` |

#### Descriptions: Keep current (already good)

#### Structured data: Consider adding
- Blog/BlogPosting schema on blog listing
- Article schema on individual posts

---

### 10. O NAS / ABOUT (`/o-nas`)

**Current state:** MINIMAL — only title + description, no OG, no alternates, no JSON-LD

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `O nás — Escort agentura v Praze od roku 2023 \| LovelyGirls` |
| en | `About Us — Escort Agency in Prague Since 2023 \| LovelyGirls` |
| de | `Über uns — Escort-Agentur in Prag seit 2023 \| LovelyGirls` |
| uk | `Про нас — Ескорт агентство у Празі з 2023 \| LovelyGirls` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `LovelyGirls Praha — prémiová escort agentura v centru Prahy. Ověřené společnice, diskrétní apartmány, transparentní přístup.` |
| en | `LovelyGirls Prague — premium escort agency in central Prague. Verified companions, discreet apartments, transparent approach.` |
| de | `LovelyGirls Prag — Premium-Escort-Agentur im Zentrum von Prag. Verifizierte Begleiterinnen, diskrete Apartments.` |
| uk | `LovelyGirls Прага — преміальне ескорт агентство в центрі Праги. Перевірені супутниці, дискретні апартаменти.` |

#### ADD to generateMetadata:
```ts
openGraph: {
  title: '...',
  description: '...',
  url: canonical,
  locale: ogLocale(locale),
},
```

#### Structured data: Consider adding
- AboutPage or Organization schema

---

### 11. KONTAKT / CONTACT (`/kontakt`)

**Current state:** MINIMAL — only title + description, no OG, no JSON-LD

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Kontakt — WhatsApp, telefon, Telegram \| LovelyGirls Praha` |
| en | `Contact — WhatsApp, Phone, Telegram \| LovelyGirls Prague` |
| de | `Kontakt — WhatsApp, Telefon, Telegram \| LovelyGirls Prag` |
| uk | `Контакт — WhatsApp, телефон, Telegram \| LovelyGirls Прага` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Kontaktujte LovelyGirls Praha přes WhatsApp, telefon nebo Telegram. Rychlá odpověď, diskrétní komunikace. Otevřeno denně 10–22:30.` |
| en | `Contact LovelyGirls Prague via WhatsApp, phone or Telegram. Fast response, discreet communication. Open daily 10–22:30.` |
| de | `Kontaktieren Sie LovelyGirls Prag per WhatsApp, Telefon oder Telegram. Schnelle Antwort, diskrete Kommunikation.` |
| uk | `Зв'яжіться з LovelyGirls Прага через WhatsApp, телефон або Telegram. Швидка відповідь, дискретне спілкування.` |

#### ADD to generateMetadata:
- `openGraph` with title, description, url, locale
- Consider adding `ContactPage` schema or `LocalBusiness` with contact info

---

### 12. POBOCKA / LOCATION (`/pobocka/[slug]`)

**Current state:** Has title, description, LocalBusiness JSON-LD, BreadcrumbList. Good.

#### Title template (improve)

| Locale | Recommended |
|--------|-------------|
| cs | `Apartmán {Name} — Diskrétní privát {District} \| LovelyGirls Praha` |
| en | `{Name} Apartment — Discreet Private {District} \| LovelyGirls Prague` |
| de | `Apartment {Name} — Diskretes Privat {District} \| LovelyGirls Prag` |
| uk | `Апартамент {Name} — Дискретний приват {District} \| LovelyGirls Прага` |

#### Descriptions: Keep current (already location-specific)

#### Structured data: KEEP (excellent)
- LocalBusiness with address, hours, geo
- BreadcrumbList
- FAQ (if location has FAQ content)
- ItemList of companions at location

---

### 13. SLUZBA / SERVICE (`/sluzba/[slug]`)

**Current state:** MINIMAL — only title + description, no OG, no alternates, no JSON-LD

#### Title template

| Locale | Recommended |
|--------|-------------|
| cs | `{ServiceName} Praha — Ověřené společnice \| LovelyGirls` |
| en | `{ServiceName} Prague — Verified Companions \| LovelyGirls` |
| de | `{ServiceName} Prag — Verifizierte Begleiterinnen \| LovelyGirls` |
| uk | `{ServiceName} Прага — Перевірені супутниці \| LovelyGirls` |

#### Description template

| Locale | Recommended |
|--------|-------------|
| cs | `{ServiceName} u ověřených společnic LovelyGirls Praha. Diskrétní apartmán, transparentní ceny. {Count} dívek nabízí tuto službu.` |
| en | `{ServiceName} with verified companions at LovelyGirls Prague. Discreet apartment, transparent pricing. {Count} girls offer this service.` |
| de | `{ServiceName} mit verifizierten Begleiterinnen bei LovelyGirls Prag. Diskretes Apartment, transparente Preise.` |
| uk | `{ServiceName} з перевіреними супутницями LovelyGirls Прага. Дискретні апартаменти, прозорі ціни.` |

#### ADD to generateMetadata:
```ts
openGraph: {
  title,
  description,
  url: canonical,
  locale: ogLocale(locale),
},
alternates: {
  canonical,
  languages: getAlternates(`/sluzba/${slug}`),
},
```

#### Structured data: Consider adding
- Service schema with provider (Organization)
- ItemList of companions offering this service

---

### 14. HASHTAG LANDING (`/hashtag/[slug]`)

**Current state:** Good — has OG, title, description, BreadcrumbList, FAQ, ItemList, CollectionPage

#### Title template: KEEP (already dynamic from TAG_NAMES)

#### Description template: IMPROVE fallback

| Locale | Recommended fallback |
|--------|---------------------|
| cs | `{TagName} — ověřené společnice v Praze zaměřené na {tagLower}. {Count} profilů s reálnými fotkami. LovelyGirls Praha.` |
| en | `{TagName} — verified companions in Prague specialising in {tagLower}. {Count} profiles with real photos. LovelyGirls Prague.` |
| de | `{TagName} — verifizierte Begleiterinnen in Prag mit Fokus auf {tagLower}. {Count} Profile mit echten Fotos.` |
| uk | `{TagName} — перевірені супутниці у Празі зі спеціалізацією {tagLower}. {Count} профілів з реальними фото.` |

#### Structured data: KEEP (already excellent)
- CollectionPage
- BreadcrumbList
- FAQPage (from landing-content)
- ItemList

---

### 15. PODMINKY / TERMS (`/podminky`)

**Current state:** title + description, robots: noindex. No OG.

**Recommendation:** Since it's noindex, minimal SEO effort. Keep as is.

Optional improvement: Add basic `openGraph` for when someone shares the link directly:
```ts
openGraph: {
  title: `${t('h1')} | LovelyGirls`,
  description: t('lead'),
}
```

---

### 16. SOUKROMI / PRIVACY (`/soukromi`)

**Current state:** title + description, robots: noindex. Partial OG in production.

**Recommendation:** Same as podminky — minimal SEO needed. Keep as is.

---

### 17. JOIN / PRIDAT-SE (`/pridat-se`)

**Current state:** title only, robots: noindex. No description, no OG.

**Recommendation:** Since it's noindex, minimal SEO. But for social sharing (when recruiting):

#### Titles

| Locale | Recommended |
|--------|-------------|
| cs | `Práce společnice Praha — Přidej se k LovelyGirls` |
| en | `Work as a Companion in Prague — Join LovelyGirls` |

#### Descriptions

| Locale | Recommended |
|--------|-------------|
| cs | `Hledáme nové společnice pro LovelyGirls Praha. Bezpečné zázemí, férové podmínky, diskrétní apartmány v centru.` |
| en | `We're looking for new companions at LovelyGirls Prague. Safe environment, fair conditions, discreet central apartments.` |

**Note:** Consider making this page indexable (`robots: index: true`) — it targets "práce escort Praha" / "escort job Prague" keywords which have search volume.

---

### 18. CLENSTVI / MEMBERSHIP (`/clenstvi`)

**Current state:** Not checked in detail. Internal application flow.

**Recommendation:** Keep noindex. Internal flow doesn't need SEO.

---

## STRUCTURED DATA SUMMARY

### Current JSON-LD (keep all):

| Schema | Pages | Status |
|--------|-------|--------|
| LocalBusiness | Homepage, Locations | EXCELLENT |
| Organization | Homepage | GOOD |
| WebSite + SearchAction | Homepage | GOOD |
| AggregateRating | Homepage | GOOD |
| Person | Profile detail | EXCELLENT |
| FAQPage | FAQ, Hashtag pages | EXCELLENT |
| OfferCatalog | Pricing | GOOD |
| CollectionPage | Girls listing, Hashtags | GOOD |
| BreadcrumbList | Most pages | EXCELLENT |
| DiscountOffer | Discounts | GOOD |
| ItemList | Hashtags, Locations | GOOD |

### Recommended additions:

| Schema | Pages | Priority |
|--------|-------|----------|
| Review/AggregateRating | Recenze page | MEDIUM |
| Service | Service pages (/sluzba) | MEDIUM |
| BlogPosting/Article | Blog posts | LOW |
| AboutPage | O nás | LOW |
| ContactPage | Kontakt | LOW |

---

## IMPLEMENTATION PRIORITY

### P0 — CRITICAL (blocking social sharing)

1. **Investigate and fix OG tag rendering in production**
   - File: `lib/seo/db-override.ts` — check if it strips openGraph
   - File: `app/[locale]/layout.tsx` — check metadataBase config
   - Affects: Homepage, profiles, FAQ, recenze (pages that HAVE OG in code but NOT in production HTML)

### P1 — HIGH (competitive SEO advantage)

2. **Add openGraph to pages missing it in code:**
   - `app/[locale]/o-nas/page.tsx`
   - `app/[locale]/kontakt/page.tsx`
   - `app/[locale]/sluzba/[slug]/page.tsx`
   - `app/[locale]/faq/page.tsx` (has JSON-LD but no OG in metadata)

3. **Update titles and descriptions** for all pages per recommendations above
   - Update inline TITLES/DESCRIPTIONS constants in page files
   - These are the lowest-hanging SEO fruit — competitors barely have meta descriptions

### P2 — MEDIUM

4. **Add alternates to pages missing them:**
   - `/o-nas`, `/kontakt`, `/slevy`

5. **Add Service schema** to `/sluzba/[slug]`

6. **Add Review schema** to `/recenze`

### P3 — LOW

7. Add `/:locale/studio/:path*` X-Robots-Tag to `next.config.ts`
8. Add `/join` to sitemap (if making indexable)
9. Add BlogPosting schema to blog posts
10. Consider making `/join` indexable for "escort job Prague" keywords

---

## FILES TO MODIFY

| File | Changes | Priority |
|------|---------|----------|
| `lib/seo/db-override.ts` | Investigate OG stripping | P0 |
| `app/[locale]/layout.tsx` | Check metadataBase | P0 |
| `app/[locale]/page.tsx` | Update TITLES/DESCRIPTIONS | P1 |
| `app/[locale]/divky/page.tsx` | Update title/desc translations | P1 |
| `app/[locale]/profil/[slug]/page.tsx` | Improve description fallbacks | P1 |
| `app/[locale]/cenik/page.tsx` | Update TITLES/DESCRIPTIONS | P1 |
| `app/[locale]/rozvrh/page.tsx` | Update TITLES/DESCRIPTIONS | P1 |
| `app/[locale]/slevy/page.tsx` | Update TITLES/DESCRIPTIONS, add alternates | P1 |
| `app/[locale]/faq/page.tsx` | Add openGraph, update titles | P1 |
| `app/[locale]/recenze/page.tsx` | Update TITLES/DESCRIPTIONS | P1 |
| `app/[locale]/blog/page.tsx` | Update titles | P1 |
| `app/[locale]/o-nas/page.tsx` | Add openGraph, alternates, update title/desc | P1 |
| `app/[locale]/kontakt/page.tsx` | Add openGraph, alternates, update title/desc | P1 |
| `app/[locale]/sluzba/[slug]/page.tsx` | Add openGraph, alternates, Service schema | P2 |
| `app/[locale]/hashtag/[slug]/page.tsx` | Improve fallback descriptions | P2 |
| `app/[locale]/pobocka/[slug]/page.tsx` | Improve title template | P2 |
| `app/[locale]/join/page.tsx` | Add description, consider index:true | P3 |
| `next.config.ts` | Add /:locale/studio X-Robots-Tag | P3 |
| `app/sitemap.ts` | Add /join if indexable | P3 |
| `lib/seo/jsonld.ts` | Add Service, Review schemas | P2 |
