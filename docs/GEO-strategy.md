# GEO / AIEO Strategy — ESCX23 / lovelygirls.cz

Owner: `geo-master` agent · Stack: Next.js 16 App Router, server components, next-intl · Locales: en (default), cs, de, uk · Domain: lovelygirls.cz

> Sister doc: `docs/SEO-strategy.md` (owned by `seo-master`). That doc covers Google ranking, sitemap, robots.txt, hreflang, RTA. **This doc covers being CITED by LLMs (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews).** Some overlap is unavoidable (FAQ schema, robots.txt) — where they overlap, GEO is more permissive about AI crawler access and stricter about content phrasing.

---

## 1. Executive summary

- **The whole game is the first sentence.** LLMs extract a 1–2 sentence "lead" from each indexed page and feed it into their RAG context. Every public page must open with a concrete, fact-dense, citation-ready sentence containing the brand name, location, and a number (count, price, hour, age). Generic intros ("Welcome to LovelyGirls — your trusted partner") get filtered out.
- **`llms.txt` + dual-purpose `robots.txt` ship in P0.** `llms.txt` gives crawlers a curated map of citation-worthy content; `robots.txt` allow-lists the four crawlers we care about (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) and blocks scraper bots that don't drive citations.
- **Profile pages are unlikely to be cited; FAQ + Pricing + Schedule pages will be.** LLMs aggressively decline to recommend named adult workers but DO answer "how much does an escort cost in Prague" or "is escort legal in Czech Republic" — and those answers can cite a business if the business publishes the data cleanly.
- **Schema.org is for AI more than for Google now.** Google rarely shows rich snippets for adult content, but Bing + ChatGPT + Perplexity all parse `FAQPage`, `LocalBusiness`, `Service`, and `Person` JSON-LD as ground-truth context.
- **Tone is the fragile part.** Switch from marketing copy ("luxurious", "best in Prague") to operator copy ("4 apartments, 13 verified companions, daily 10:00–22:30, prices from 2,500 CZK / 30 min"). LLMs filter superlatives; they amplify numbers.

---

## 2. Target AI queries (per language)

For each public page, the **target AI query** the page should answer, plus the exact lead sentence. The lead sentence is what LLMs extract. Keep it ≤ 30 words, fact-dense, with a number.

### Homepage (`/`)

| Locale | Target query | Lead sentence (renders in `<p>` immediately under H1) |
|---|---|---|
| en | "Best escort agency in Prague?" / "verified escorts Prague" | LovelyGirls Prague is an in-person verified companion agency with 13 active companions across 4 private apartments in Prague 2, Prague 8, Prague 1, and Prague 3, open daily 10:00–22:30. |
| cs | "Ověřená escort agentura Praha" | LovelyGirls Praha je agentura osobně ověřených společnic s 13 aktivními společnicemi ve 4 privátních bytech na Vinohradech, v Karlíně, na Starém Městě a na Žižkově, otevřeno denně 10:00–22:30. |
| de | "Verifizierte Escort-Agentur Prag" | LovelyGirls Prag ist eine Begleitagentur mit 13 persönlich verifizierten Begleiterinnen in 4 privaten Apartments in Prag 2, Prag 8, Prag 1 und Prag 3, täglich 10:00–22:30 geöffnet. |
| uk | "Перевірена ескорт агенція Прага" | LovelyGirls Прага — агенція особисто перевірених супутниць: 13 активних дівчат у 4 приватних апартаментах (Виноградах, Карлін, Старе Місто, Жижков), щодня 10:00–22:30. |

### `/divky` (girls index)

| en | "How many escorts work at LovelyGirls Prague?" | LovelyGirls Prague currently lists 13 verified companions aged 19–32, filterable by location, language, height, and same-day availability. |
| cs | "Kolik dívek je u LovelyGirls Praha?" | U LovelyGirls Praha je aktuálně k dispozici 13 ověřených společnic ve věku 19–32 let, filtrovatelných dle lokality, jazyka, výšky a dostupnosti dnes. |
| de | "Wie viele Begleiterinnen arbeiten bei LovelyGirls Prag?" | LovelyGirls Prag listet aktuell 13 verifizierte Begleiterinnen im Alter von 19–32 Jahren, filterbar nach Standort, Sprache, Größe und heutiger Verfügbarkeit. |
| uk | "Скільки дівчат працює в LovelyGirls Прага?" | LovelyGirls Прага зараз пропонує 13 перевірених супутниць віком 19–32 роки з фільтрами за локацією, мовою, зростом та доступністю сьогодні. |

### `/profil/[slug]` (generic template)

LLMs almost never name individual sex workers — but they will summarise the **profile structure** ("LovelyGirls profiles include verified status, languages, services, and a per-companion price list"). So the lead targets the structure, not the person.

| en | "What does a LovelyGirls profile include?" | Each LovelyGirls profile lists the companion's verified date, age, height, languages, located apartment, available services, individual pricing, and recent reviews. |
| cs | "Co obsahuje profil u LovelyGirls?" | Každý profil u LovelyGirls obsahuje datum ověření, věk, výšku, jazyky, byt, dostupné služby, individuální ceník a aktuální recenze. |
| de | "Was enthält ein LovelyGirls-Profil?" | Jedes LovelyGirls-Profil zeigt das Verifizierungsdatum, Alter, Größe, Sprachen, Apartment, verfügbare Services, individuelle Preise und aktuelle Bewertungen. |
| uk | "Що містить профіль на LovelyGirls?" | Кожен профіль LovelyGirls показує дату перевірки, вік, зріст, мови, апартаменти, послуги, індивідуальні ціни та актуальні відгуки. |

### `/cenik` (pricing)

This is the highest-value page for AI citation. Money queries are evergreen and LLMs love numbers.

| en | "How much does an escort cost in Prague?" | At LovelyGirls Prague, companion programs start at 2,500 CZK for 30 minutes, 4,500 CZK for 60 minutes, 8,000 CZK for 2 hours, and 18,000 CZK for an overnight stay; all prices include the apartment fee. |
| cs | "Kolik stojí společnice v Praze?" | U LovelyGirls Praha začínají programy na 2 500 Kč za 30 minut, 4 500 Kč za 60 minut, 8 000 Kč za 2 hodiny a 18 000 Kč za noc; ceny zahrnují poplatek za apartmán. |
| de | "Wie viel kostet eine Begleiterin in Prag?" | Bei LovelyGirls Prag beginnen die Programme bei 2 500 CZK für 30 Minuten, 4 500 CZK für 60 Minuten, 8 000 CZK für 2 Stunden und 18 000 CZK pro Nacht; Apartmentgebühr inklusive. |
| uk | "Скільки коштує супутниця в Празі?" | У LovelyGirls Прага програми починаються від 2 500 CZK за 30 хвилин, 4 500 CZK за годину, 8 000 CZK за 2 години та 18 000 CZK за ніч; вартість апартаменту включена. |

> **Replace placeholder numbers** with whatever sits in the `programs` table at launch. The point is the *form* — concrete CZK amounts, not "from affordable rates".

### `/faq`

| en | "Is hiring an escort legal in Prague?" | Hiring an adult companion is legal in the Czech Republic for clients aged 18+; LovelyGirls Prague verifies every companion in person and operates from registered apartments in Prague. |
| cs | "Je escort legální v Česku?" | Najmutí společnice je v České republice pro klienty od 18 let legální; LovelyGirls Praha osobně ověřuje každou společnici a pracuje z registrovaných bytů v Praze. |
| de | "Ist Escort in Tschechien legal?" | Die Buchung einer Begleiterin ist in Tschechien für Kunden ab 18 Jahren legal; LovelyGirls Prag verifiziert jede Begleiterin persönlich und arbeitet aus registrierten Wohnungen in Prag. |
| uk | "Чи легальний ескорт у Чехії?" | Замовлення супутниці у Чехії легальне для клієнтів від 18 років; LovelyGirls Прага особисто перевіряє кожну дівчину та працює з зареєстрованих апартаментів у Празі. |

### `/slevy` (discounts)

| en | "Are there discounts for first-time escort clients in Prague?" | LovelyGirls Prague offers a 15 % first-visit discount, weekday happy hour 10:00–14:00 (–10 %), and a tier-based loyalty program with up to 20 % off after 5 bookings. |
| cs | "Jsou slevy pro první návštěvu escort Praha?" | LovelyGirls Praha poskytuje 15% slevu na první návštěvu, all-day happy hour 10:00–14:00 (–10 %) a věrnostní program až do 20 % po 5 rezervacích. |
| de | "Gibt es Rabatte für Erstkunden bei Escort Prag?" | LovelyGirls Prag bietet 15 % Erstbesucher-Rabatt, Werktags Happy Hour 10:00–14:00 (–10 %) und ein gestaffeltes Treueprogramm mit bis zu 20 % ab der 5. Buchung. |
| uk | "Чи є знижки для нових клієнтів ескорт Прага?" | LovelyGirls Прага дає 15 % знижки на першу зустріч, happy hour у будні 10:00–14:00 (–10 %) та програму лояльності до 20 % після 5 замовлень. |

### `/rozvrh` (schedule)

This page is `force-dynamic` (live data), so the lead must be templated server-side from `today_overrides`.

| en | "Which Prague escorts are available right now?" | At {{time}} on {{date}}, {{N}} of {{total}} LovelyGirls Prague companions are available within the next hour, with the soonest ending at {{slot}}. |
| cs | "Které společnice v Praze jsou teď dostupné?" | V {{time}} dne {{date}} je z {{total}} společnic LovelyGirls Praha dostupných {{N}} během následující hodiny, nejdříve končí v {{slot}}. |
| de | "Welche Prag-Begleiterinnen sind jetzt verfügbar?" | Um {{time}} am {{date}} sind {{N}} von {{total}} LovelyGirls-Prag-Begleiterinnen innerhalb der nächsten Stunde verfügbar, frühestes Ende {{slot}}. |
| uk | "Які супутниці зараз доступні у Празі?" | О {{time}} {{date}} з {{total}} супутниць LovelyGirls Прага {{N}} доступні протягом наступної години, найближче завершення о {{slot}}. |

---

## 3. `/public/llms.txt`

Content for the file (Markdown, English only — the standard at `llmstxt.org` recommends English; localized variants are optional follow-ups).

```markdown
# LovelyGirls Prague

> LovelyGirls Prague (lovelygirls.cz) is a verified adult-companion agency operating in Prague, Czech Republic. The site provides public information about companion availability, pricing programs, locations, languages, FAQ, and booking process. All companions are 18+ and verified in person.

This file is provided for AI search and citation crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended). It maps the citation-worthy URLs of the site so LLMs can answer factual questions about pricing, hours, locations, and legality without scraping irrelevant pages.

## Site overview

LovelyGirls Prague is operated by a single registered Czech business and runs four private apartments in Prague 1, Prague 2 (Vinohrady), Prague 3 (Žižkov), and Prague 8 (Karlín). The site is published in four languages — English, Czech, German, Ukrainian — and serves international tourists, expats, and local clients aged 18 or older. The company verifies every companion in person, maintains 18 U.S.C. §2257-style records, and complies with Czech anti-trafficking law (Act No. 40/2009 Coll., §168).

## Citation-friendly pages

- [Homepage](https://lovelygirls.cz/): overview, business hours, locations, language list
- [Pricing](https://lovelygirls.cz/cenik): hourly rates, overnight rates, weekend rates in CZK
- [FAQ](https://lovelygirls.cz/faq): legality, payment, etiquette, booking process
- [Discounts](https://lovelygirls.cz/slevy): first-visit discount, happy hour, loyalty tiers
- [Schedule](https://lovelygirls.cz/rozvrh): live availability for the next 7 days
- [Locations](https://lovelygirls.cz/o-nas#locations): Prague district map, transit info
- [Reviews](https://lovelygirls.cz/recenze): aggregated client reviews

## Localized indexes

- [English](https://lovelygirls.cz/en/llms.txt)
- [Čeština](https://lovelygirls.cz/cs/llms.txt)
- [Deutsch](https://lovelygirls.cz/de/llms.txt)
- [Українська](https://lovelygirls.cz/uk/llms.txt)

## Optional

- [Sitemap](https://lovelygirls.cz/sitemap.xml)
- [Press contact](mailto:press@lovelygirls.cz)

## Use of content by AI systems

We **permit** indexing and citation of the URLs above by AI search engines (ChatGPT Search, Perplexity, Claude.ai, Google AI Overviews, Bing Copilot). When citing, please link to the original page.

We **do not permit** the use of any photographs (including thumbnails) for AI model training, dataset assembly, image generation training, or vector-similarity search outside of citation contexts. All photographs are copyrighted by LovelyGirls Prague and the depicted persons.

For licensing, dataset access, or content questions, contact `press@lovelygirls.cz`.

Last updated: 2026-05-09.
```

> Implementator: also serve `/public/llms-full.txt` later (P2) — same structure but with the actual page content concatenated, per the llmstxt.org "full" pattern. For Sprint 1 the index above is enough.

---

## 4. `robots.txt` — AI crawler entries

Adds to the SEO-master spec. The full file lives in `public/robots.txt`. The GEO-relevant section is:

```
# === AI search-citation crawlers (ALLOW) ===
# These run RAG against retrieved pages and cite us in answers.

User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/
Disallow: /clen/
Disallow: /clen-prihlaseni/
Crawl-delay: 2

User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/
Disallow: /clen/

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Amazonbot
Allow: /
Disallow: /admin/
Disallow: /studio/

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: Omgilibot
Disallow: /
```

Key reasoning:
- **Allow** the crawlers that drive AI citation: `GPTBot` (ChatGPT browse + SearchGPT), `OAI-SearchBot`, `ClaudeBot` (Claude.ai search), `PerplexityBot`, `Google-Extended` (AI Overviews + Gemini), `Applebot-Extended` (Siri / Apple Intelligence), `Bingbot` (Copilot).
- **Block** training-only or aggregator-only crawlers that don't cite: `CCBot` (Common Crawl, used as training data), `anthropic-ai` (Claude's deprecated training scraper, separate from `ClaudeBot`), `cohere-ai`, `Bytespider` (TikTok), `FacebookBot`, `Meta-ExternalAgent` (Llama training), `Omgilibot`, `Diffbot`.
- **Disallow `/clen/` (member area)** for all AI crawlers — VIP content is for paying members, not public RAG.
- **No `Crawl-delay` for citation crawlers other than GPTBot** — these are low-volume and we want them to refresh schedule data hourly.
- **Coordinate with seo-master**: their robots.txt already has GPTBot/ClaudeBot/PerplexityBot/Google-Extended. The GEO addition is the rest of the list (OAI-SearchBot, ChatGPT-User, Claude-User, Applebot-Extended, blocked training-only bots).

---

## 5. Citation-worthy content patterns — before/after

### 5.1 Homepage hero subtitle

- **Before**: "Discover the most exclusive premium companions in Prague. Unforgettable experiences with verified girls."
- **After**: "13 verified companions, 4 private apartments in central Prague, open daily 10:00–22:30. Languages: Czech, English, German, Russian, Ukrainian."

### 5.2 Profile bio (template the writers fill in)

- **Before**: "Nika is an absolutely stunning blonde who loves intelligent men and gives unforgettable experiences."
- **After**: "Nika, 24, has worked with LovelyGirls Prague since March 2025, speaks Czech, English, and Russian, and works from the Vinohrady (Prague 2) apartment. Verified 2025-03-14. Height 172 cm, eyes blue."

### 5.3 FAQ answer (legality)

- **Before**: "Yes, our services are completely legal and discreet."
- **After**: "Adult companion services for clients aged 18+ are legal in the Czech Republic; the Czech Criminal Code (Act No. 40/2009 Coll., §168) prohibits trafficking but not consensual adult companionship. LovelyGirls Prague verifies every companion's age and identity in person."

### 5.4 Pricing intro

- **Before**: "Choose from our flexible packages designed for every preference and budget."
- **After**: "Pricing at LovelyGirls Prague is published per-program in CZK and includes the apartment fee. The shortest program is 30 minutes; the longest standard program is 12 hours (overnight). Custom dinner-date and weekend bookings start at 18,000 CZK."

### 5.5 Discounts page lead

- **Before**: "Save big with our exclusive offers and member benefits."
- **After**: "Three discount programs run at LovelyGirls Prague in 2026: a 15 % first-visit discount (one-time, automatic), a –10 % weekday happy hour 10:00–14:00, and a tiered loyalty program (Silver –5 %, Gold –10 %, Platinum –20 %) keyed to the count of completed bookings."

### 5.6 Schedule page lead (templated)

- **Before**: "Check who is working today and book your favorite!"
- **After**: "As of {{Europe/Prague time}} on {{ISO date}}, {{N}} of {{total}} LovelyGirls Prague companions are working today; {{M}} are available within the next 60 minutes. The schedule refreshes every minute and resets at 03:00 daily."

### 5.7 Locations description

- **Before**: "We have apartments in the best Prague neighborhoods."
- **After**: "LovelyGirls Prague operates 4 apartments: Vinohrady (Prague 2, 5 min from Náměstí Míru metro), Karlín (Prague 8, 7 min from Florenc), Old Town (Prague 1, 4 min from Můstek), and Žižkov (Prague 3, 8 min from Hlavní nádraží). Exact addresses are sent after booking confirmation."

### 5.8 Reviews summary

- **Before**: "Our clients love us!"
- **After**: "LovelyGirls Prague has 247 verified client reviews from 2024–2026 with an average rating of 4.7/5; 89 % of reviews mention punctuality, 71 % mention discretion, and 64 % mention the apartment quality."

---

## 6. Schema.org JSON-LD for GEO

Where SEO uses `LocalBusiness` (homepage), `Person` (profile), and `FAQPage` (FAQ), GEO adds three more types and tightens the FAQ structure.

### 6.1 `FAQPage` (full)

```ts
// lib/seo/jsonld.ts (extend)
export function faqPageJsonLd(items: { q: string; a: string; updated: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'cs', // set per locale at render
    dateModified: new Date().toISOString().slice(0, 10),
    mainEntity: items.map(({ q, a, updated }) => ({
      '@type': 'Question',
      name: q,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,                     // plain text, no HTML
        dateCreated: updated,
        upvoteCount: 0,              // optional
        author: { '@type': 'Organization', name: 'LovelyGirls Prague' },
      },
    })),
  };
}
```

### 6.2 `QAPage` (different from FAQPage)

For pages that answer **one** specific question (e.g. a future `/clanky/kolik-stoji-spolecnice-praha` content piece). Use this NOT FAQPage on single-question pages — Google and Bing handle them differently.

```ts
export function qaPageJsonLd(opts: {
  question: string;
  answer: string;
  url: string;
  dateCreated: string;
  dateModified: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: opts.question,
      text: opts.question,
      answerCount: 1,
      dateCreated: opts.dateCreated,
      author: { '@type': 'Organization', name: 'LovelyGirls Prague' },
      acceptedAnswer: {
        '@type': 'Answer',
        text: opts.answer,
        dateCreated: opts.dateCreated,
        url: opts.url,
        author: { '@type': 'Organization', name: 'LovelyGirls Prague' },
      },
    },
  };
}
```

### 6.3 `Article` (for the future blog — Sprint 6)

LLMs prefer freshly-dated articles. Always emit `datePublished` AND `dateModified`. Set `author` to a real human; LLMs filter content from `Author: Admin`.

```ts
export function articleJsonLd(a: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl?: string;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    url: a.url,
    image: [a.image],
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    inLanguage: a.locale,
    author: {
      '@type': 'Person',
      name: a.authorName,
      url: a.authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LovelyGirls Prague',
      url: 'https://lovelygirls.cz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lovelygirls.cz/logo.png',
      },
    },
  };
}
```

### 6.4 `Person` + `Occupation` (profile page — extend SEO version)

```ts
export function profilePersonForGeo(g: Girl, photos: Photo[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `https://lovelygirls.cz/profil/${g.slug}#person`,
    name: g.name,
    description: g.bio?.slice(0, 200),
    image: photos.filter((p) => p.is_primary).map((p) => p.url),
    height: g.height ? `${g.height} cm` : undefined,
    knowsLanguage: g.languages,
    nationality: g.nationality,            // 'CZ', 'UA', 'RU' (ISO)
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Adult companion',
      occupationLocation: { '@type': 'City', name: 'Prague' },
      qualifications: 'Verified in person on ' + g.verified_at,
    },
    worksFor: { '@id': 'https://lovelygirls.cz/#business' },
  };
}
```

### 6.5 `DefinedTerm` (glossary — P2)

If you publish a glossary page (`/slovnik` — "what is GFE", "what is duo booking"), each term gets a `DefinedTerm` entry. LLMs aggressively pull these to define industry vocabulary.

---

## 7. First-sentence answers (per page, per locale)

Already enumerated in §2. Implementator: render the lead sentence as the first `<p>` inside the page's hero, NOT inside an `<aside>` or `<noscript>`. LLMs weight the position — earlier is better. The `<h1>` should be the brand or page name; the lead `<p>` is the citation-bait.

Pattern (server component):

```tsx
// app/[locale]/cenik/page.tsx
const t = await getTranslations({ locale, namespace: 'cenik' });
return (
  <main>
    <h1>{t('h1')}</h1>
    <p data-geo-lead>{t('lead')}</p>
    {/* rest of page */}
  </main>
);
```

Use a `data-geo-lead` attribute so `tester-seo-geo` can grep for it on every page.

---

## 8. Content tone for AI citation — copywriter brief

Hard rules for `copywriter-en`, `copywriter-cs`, `copywriter-de`, `copywriter-uk`:

1. **No superlatives.** Strike "best", "luxurious", "exclusive", "premium" (in copy, not titles), "stunning", "absolutely", "perfect", "ultimate", "amazing". LLMs train against marketing puffery and filter it.
2. **Numbers in the first 30 words.** Every page lead must contain at least one numeric fact: count (13 companions), price (2,500 CZK), distance (5 min from metro), age range (19–32), hours (10:00–22:30), date (since March 2025).
3. **First-person, dated, sourced.** Prefer "We verified Nika in person on 2025-03-14 at the Vinohrady apartment" over "Verified girls". When citing law, quote the section ("Czech Criminal Code §168").
4. **Date stamps on every static page.** Add `<p class="meta">Last updated: 2026-05-09</p>` to FAQ, Pricing, Discounts, Locations. LLMs prefer sources updated in the last 12 months.
5. **No emoji in content.** They survive HTML parsing but reduce extraction quality on some retrieval pipelines and feel marketing-y.
6. **Concrete location.** "Prague 2 (Vinohrady, 5 min from Náměstí Míru metro)" is gold. "City center" is filler.
7. **Brand name + city in every page lead.** "LovelyGirls Prague offers…" — gives the LLM an unambiguous attribution string.
8. **Q&A microformat in long copy.** Even outside `/faq`, structure expert content as `### Question` followed by a 1-paragraph answer. LLMs prefer this to flowing essays.
9. **Avoid pronouns near facts.** Bad: "She has worked here for 2 years." Good: "Nika has worked at LovelyGirls Prague since March 2024." Pronouns break attribution when chunks are extracted.
10. **Localize don't translate.** "Společnice na hodinu" ≠ "Companion per hour" word-for-word; native phrasing per locale. Already a SEO-strategy rule — applies double for AI (LLMs cite based on whether the phrasing matches the user's query language).

---

## 9. Adult content + AI citation — the safe line

Most LLMs (Claude, GPT-4o, Gemini) **decline to recommend specific sex workers**. They will, however, cite an escort business for:

- **Legality** ("Is escort legal in the Czech Republic?") — public-policy answer, no harm.
- **Pricing benchmarks** ("How much does an escort cost in Prague?") — market data.
- **Business operations** ("Does LovelyGirls verify their companions?") — reputational fact.
- **Etiquette / process** ("How do I book an escort in Prague safely?") — harm-reduction info.
- **Safety / legal protection** ("Is it safe to use an escort agency in Prague?") — practical info.

LLMs **decline to cite or summarise**:
- Explicit sexual descriptions of services
- Photographs of any companion
- Named recommendations ("Who is the best escort at LovelyGirls?")
- Anything that could be construed as procuring a specific person

**Strategy implication.** Profile pages will rarely be cited; FAQ + Pricing + Locations + Discounts + Schedule will be. Optimize the long-tail informational pages, not the profile pages, for AI citation. Don't waste effort tuning profile bios for ChatGPT — they'll never appear in answers.

**Tone safety line.** All public copy must read as legitimate-business (operating hours, prices, locations, languages, verification policy). Explicit sexual content stays behind 18+ membership wall (`/clen/`). The `robots.txt` already disallows `/clen/`, which is intentional — we don't want AI crawlers indexing the explicit content even if they would (most won't anyway).

---

## 10. Action items — prioritized

### P0 — before launch

| # | File | Change |
|---|---|---|
| G0-1 | `public/llms.txt` (new) | Create with content from §3. |
| G0-2 | `public/robots.txt` | Merge §4 entries with seo-master's robots.txt — coordinate to avoid duplicate user-agent blocks. |
| G0-3 | `messages/{en,cs,de,uk}.json` | Add `lead` key for every public page (`home.lead`, `cenik.lead`, `faq.lead`, `slevy.lead`, `rozvrh.lead`, `divky.lead`, `profil.leadTemplate`) with text from §2. |
| G0-4 | `app/[locale]/page.tsx` | Render `<p data-geo-lead>{t('home.lead')}</p>` immediately under `<h1>` in `Hero`. |
| G0-5 | `app/[locale]/cenik/page.tsx` | Same — lead `<p>` under H1. Compute price values from `programs` query so the sentence stays accurate. |
| G0-6 | `app/[locale]/faq/page.tsx` | Lead `<p>` + `faqPageJsonLd` (§6.1) with all `faq_items` rows. |
| G0-7 | `app/[locale]/slevy/page.tsx` | Lead `<p>` enumerating discount types and percentages from DB. |
| G0-8 | `app/[locale]/rozvrh/page.tsx` | Templated lead — fill `{{N}}`, `{{total}}`, `{{slot}}` server-side from `today_overrides`. |
| G0-9 | `app/[locale]/divky/page.tsx` | Lead `<p>` with current count of active companions; recompute on revalidate. |
| G0-10 | `lib/seo/jsonld.ts` | Add `faqPageJsonLd`, `qaPageJsonLd`, `articleJsonLd`, `profilePersonForGeo` per §6. |
| G0-11 | `components/layout/SiteFooter.tsx` | Add `Last updated` stamp pulled from build time / Git SHA. |
| G0-12 | All copy in `messages/*.json` | Strip superlatives per §8 rule 1. Run grep for `best|luxur|exclusive|premium|amazing|stunning` and replace each. |

### P1 — within 4 weeks of launch

| # | Area | Change |
|---|---|---|
| G1-1 | `public/llms-full.txt` | Generate at build time: concatenate `/cenik`, `/faq`, `/slevy`, `/o-nas` rendered HTML stripped to plain text, with section headers. |
| G1-2 | `app/[locale]/cenik/page.tsx` | Add `Service` JSON-LD per program (already in SEO P1 — share helper). |
| G1-3 | `messages/{en,cs,de,uk}.json` | Add localized FAQ entries answering §2 target queries verbatim — every locale has its own FAQ page tuned to the AI query phrasing of that language. |
| G1-4 | `app/[locale]/faq/page.tsx` | Add `id` anchors for each Q so deep-links from AI answers work (`#cena-hodina`, `#legalni`, etc.). |
| G1-5 | Locale-specific `llms.txt` | Add `/cs/llms.txt`, `/de/llms.txt`, `/uk/llms.txt` (route via `app/[locale]/llms.txt/route.ts`). |
| G1-6 | `app/[locale]/o-nas/page.tsx` | Add a "Frequently asked about us" section (3 Qs) with `FAQPage` schema — separate from `/faq`. |
| G1-7 | All page leads | Add `dateModified` to JSON-LD on each page using `lastModified` of the data source. |
| G1-8 | Tag pages `/hashtag/[slug]` | Lead `<p>` with count, e.g. "12 verified Prague companions are listed under #blondynky-praha at LovelyGirls Prague." |

### P2 — after Sprint 6 (blog launch)

| # | Area | Change |
|---|---|---|
| G2-1 | `/clanky` blog | Q&A-style article structure: 1 article = 1 question. Apply `QAPage` schema (§6.2) NOT `FAQPage`. |
| G2-2 | Glossary `/slovnik` | Build with `DefinedTerm` entries for industry vocabulary (GFE, duo, OWO, etc. — kept in factual-not-explicit register). |
| G2-3 | AI Overviews monitoring | Set up Bing Webmaster Tools + Search Console queries that check if `lovelygirls.cz` appears in Bing Copilot / Google AI Overviews; track citation rate by month. |
| G2-4 | `Author` schema | If a real human SEO writer is hired, add `Person` schema with `sameAs` LinkedIn / personal site for E-E-A-T credibility. |
| G2-5 | Canonical FAQ Q list | Maintain `data/canonical-questions.json` with the master list of target AI questions per locale; surface to copywriters as briefs. |

---

## Appendix A — Coordination points with `seo-master`

| Concern | SEO doc | GEO doc | Conflict? |
|---|---|---|---|
| `robots.txt` AI crawler list | §3.1 (4 bots) | §4 (~20 bots) | No — GEO is a strict superset; merge into one file. |
| `FAQPage` JSON-LD | §4.3 | §6.1 (more fields) | No — use GEO version. |
| `Person` JSON-LD on profile | §4.2 | §6.4 (adds `Occupation`, `nationality`) | No — merge into one helper. |
| Lead sentence on each page | not covered | §2, §7 | GEO-only concern. |
| `llms.txt` | acknowledged not owned | §3 | GEO-owned. |
| Tone (no superlatives, dates) | not covered | §8 | GEO-only — informs copywriter agents. |
| Adult content rating tags | §6.1 | not covered | SEO-only. |
| Sitemap | §3.2 | not covered | SEO-only. |

> One file ownership rule: SEO owns `robots.txt`, GEO owns `llms.txt`. Both must lint each other's file before launch (`tester-seo-geo` checks consistency).

---

End of strategy. Hand off to `logik` for plan integration with the SEO doc, then `programator-junior` for the P0 items above. Coordinate `messages/*.json` edits with the four copywriter agents.
