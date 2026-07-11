# TASK-018: SEO audit — proc nejsme videt na "escort prague" a "sex praha 2"

## Kontext

Klient: "nejsme vubec v google videt kdyz dam KW escort prague nebo sex praha 2, nic vubec tam nejsme videt"

Domena: www.lovelygirls.cz (nova, migrovana z escx23.vercel.app)

---

## 1. TECHNICKE SEO — audit stavu

### 1a. Google Search Console (GSC) verifikace

**PROBLEM:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` neni nastaveny v zadnem `.env` souboru.

V `app/[locale]/layout.tsx` (radek 78) je:
```ts
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
},
```
Ale env var neni nikde definovany → Google verification meta tag se NEVYKRESLUJE.

**Action item:**
- [ ] Registrovat www.lovelygirls.cz v GSC (Google Search Console)
- [ ] Ziskat verification token a pridat do Vercel env vars jako `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- [ ] Po verifikaci: submittovat sitemap (`https://www.lovelygirls.cz/sitemap.xml`)
- **PRIORITA: KRITICKA** — bez GSC verifikace a sitemap submit Google nemusi web vubec indexovat spravne

### 1b. robots.txt

robots.txt je v poradku:
- Hlavni `*` user-agent: `allow: /`, disallow admin/studio/api
- Google crawlers (Googlebot, Google-Extended, GoogleOther): povoleny
- Sitemap URL: dynamicky z hostu → `https://www.lovelygirls.cz/sitemap.xml`
- Preview deploys: spravne blokovane

**BEZ PROBLEMU**

### 1c. Sitemap

Sitemap generuje se dynamicky z DB (`app/sitemap.ts`):
- Homepage (4 locale)
- /divky (4 locale)
- 10 statickych stranek × 4 locale
- Profily divek × 4 locale (s image sitemap)
- Pobocky × 4 locale
- Sluzby × 4 locale
- Blog posty × 4 locale
- 32 hashtagovych stranek × 4 locale

**BEZ PROBLEMU** (ale sitemap musi byt submittovany v GSC — viz 1a)

### 1d. Stari domeny

www.lovelygirls.cz je NOVA domena. Predtim escx23.vercel.app.

**KRITICKE:** Nova domena nema zadnou autoritu (Domain Authority = 0). Google da prednost starsim domenam s backlinky. Toto je HLAVNI duvod proc web neni videt.

---

## 2. ON-PAGE SEO — audit klicovych stranek

### 2a. Homepage (/) — cilove KW: "escort prague", "escort praha"

| Element | CS (/cs/) | EN (/) | Stav |
|---------|-----------|--------|------|
| Title | "Escort Praha — Overene spolecnice v privatnim apartmanu \| LovelyGirls" | "Escort Prague — Verified Companions, Private Apartments \| LovelyGirls" | OK — KW v titulku |
| Meta desc | "13 overenych spolecnic v Praze. 4 diskretni apartmany..." | "13 verified companions in Prague. 4 discreet apartments..." | OK |
| H1 | "Spolecnice Praha" + accent "Luxusni escort" | "Prague Companions" + "Luxury escort" | POZOR — H1 neni primo "Escort Praha" ani "Escort Prague" |
| Schema | LocalBusiness + Organization + WebSite | OK | OK |
| Keywords meta | Z DB override: "escort praha, spolecnice praha, privatni apartman..." | "escort prague, companions prague, private apartments..." | OK (pokud sync-seo-metadata.ts probehl) |

**Problemy:**
1. **H1 neobsahuje primo "Escort Praha" / "Escort Prague"** — misto toho je rozdeleny na "Spolecnice Praha" + accent span "Luxusni escort". Google cte H1 jako nejdulezitejsi on-page signal. Idealne by H1 mel obsahovat hlavni KW dohromady.
2. **Body text na homepage je MINIMALNI** — vetsi cast stranky je grid komponent (Hero, GirlCards, ReviewsStrip atd.). Homepage ma malo crawlovatelneho textoveho obsahu s relevantnimi keywords. Je tam `sr-only` paragraph s `home_lead` ale to je skryte.
3. **`sr-only` text** (radek 111 v page.tsx): `<p className="sr-only">{t('home_lead')}</p>` — Google penalizuje hidden text pokud je to keyword stuffing. `sr-only` je OK pro accessibility ale ne pro SEO text.

### 2b. /divky — cilove KW: "spolecnice praha", "escort divky praha"

| Element | Stav |
|---------|------|
| Title | Z i18n: `t('h1')` = "Spolecnice Praha" (cs), "Prague Companions" (en) | 
| H1 | Stejne jako title |
| Body text | Pouze grid karet, filtry. Zadny SEO intro text. |

**Problem:** Zadny unikatni textovy obsah na strance — pouze seznam karet. Google potrebuje textovy kontext.

### 2c. "sex praha 2" — toto KW NENI nikde na webu

**Hledani "sex" v messages a contentu:** NULOVY vyskyt.

Web pouziva "escort", "spolecnice", "companions" — nikdy "sex". Pro keyword "sex praha 2" neni na webu zadny obsah ktery by Google mohl indexovat.

**To je pravdepodobne zamerne** — slovo "sex" muze zpusobit problemy s Google SafeSearch a ad policy. ALE: pokud klient chce rankovit na "sex praha", musi existovat obsah ktery to keyword pouziva (napr. v FAQ, blogu).

---

## 3. HLAVNI DUVODY PROC WEB NENI VIDET

### Duvod #1: Nova domena bez autority (KRITICKE)

www.lovelygirls.cz je nova domena (migrovaná z escx23.vercel.app). Google dava nove domene minimalni autoritu. Prvni vysledky se objevi za 2-6 mesicu, plna viditelnost za 6-12 mesicu.

**Jak urychlit:**
- [ ] Submittovat sitemap v GSC (viz 1a)
- [ ] Ziskat backlinky z relevantnych adresaru a seznamu (sexybazar.cz, annonce.cz, escort directory sites)
- [ ] Google Business Profile (pokud je to mozne pro tento typ podnikani v CZ)
- [ ] Propojit socialni profily (Instagram, Telegram) se zpetnymi odkazy

### Duvod #2: GSC neni nastaveny (KRITICKE)

Bez GSC:
- Google nemusi videt sitemap
- Nevidime kolik stranek je indexovanych
- Nevidime jake dotazy Google zachytava
- Nemuzeme requestovat indexovani novych stranek

### Duvod #3: Malo textoveho obsahu na hlavnich strankach

Homepage a /divky jsou vizualne bohaté ale textove chudé. Google potrebuje crawlovatelny text s relevantnimi klicovymi slovy.

### Duvod #4: Keyword "sex praha 2" neni v obsahu

Slovo "sex" neni na webu pouzivane. Pro toto KW neexistuje zadny obsah.

### Duvod #5: Vysoka konkurence

"escort prague" a "escort praha" jsou extremne konkurencni KW. Na 1. strance Google budou:
- Velke escort directory (eurogirlsescort.com, escort-guide.tv, topescort.com)
- Agentury s letitou domenou a stovkami backlinku
- Vetsi agentury s desitkami divek

Nova domena proti nim nema sanci v kratkodobem horizontu.

---

## 4. ACTION ITEMS (serazeno podle priority)

### P0 — Ihned (tento tyden)

| # | Akce | Kdo | Soubor/Nastroj |
|---|------|-----|----------------|
| 1 | **Registrovat domena v GSC** a ziskat verification token | Klient/admin | Google Search Console |
| 2 | **Nastavit NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION** env var na Vercel | Klient/admin | Vercel dashboard → Settings → Environment Variables |
| 3 | **Submittovat sitemap** v GSC po verifikaci | Klient/admin | GSC → Sitemaps → pridat `https://www.lovelygirls.cz/sitemap.xml` |
| 4 | **Request indexing** hlavnich stranek v GSC (URL Inspection → Request Indexing) | Klient/admin | GSC |

### P1 — Tento sprint (1-2 tydny)

| # | Akce | Kdo | Soubor |
|---|------|-----|--------|
| 5 | **Pridat SEO intro text na homepage** — viditelny (ne sr-only) odstavec pod Hero s KW "escort Praha", "spolecnice v Praze", "privatni apartmany" | Implementator | `components/home/Hero.tsx` nebo novy `SeoIntro` komponent |
| 6 | **Pridat SEO intro text na /divky** — odstavec nad gridem s relevantnimi KW | Implementator | `app/[locale]/divky/page.tsx` |
| 7 | **Zvazit zmenu H1 na homepage** — napr. "Escort Praha — Overene spolecnice" misto "Spolecnice Praha / Luxusni escort" | Diskuse s klientem | messages/cs.json, en.json atd. |
| 8 | **Blog clanky s cilovymi KW** — "Escort Praha: Pruvodce pro klienty", "Jak vybrat spolecnici v Praze" atd. | Copywriter | blog_posts v DB |
| 9 | **Opravit slug praha-2 → vinohrady** (z TASK-015) | Implementator | DB + landing-content.ts |

### P2 — Strednedoba (1-3 mesice)

| # | Akce |
|---|------|
| 10 | **Budovat backlinky** — registrace v escort adresarich, partnerskyoh webech, lokalnich seznamech |
| 11 | **Google Business Profile** — overit jestli je mozne pro escort agenturu v CZ |
| 12 | **Pravidelny blog** — 1 clanek/tyden s cilovymi KW (viz TASK-017) |
| 13 | **Interni linkovani** — kazda stranka by mela linkovat na relevantni dalsi stranky |
| 14 | **Monitorovat GSC data** — po 2-4 tydnech od submit kontrolovat impressions, clicks, CTR |

### P3 — Ohledne "sex praha 2"

**Doporuceni: NEOPTIMALIZOVAT na "sex" keyword.**

Duvody:
1. Google SafeSearch muze web uplne skryt pri explicit obsahu
2. Google Ads policy zakazuje reklamu na "sex" KW — pokud bude web oznaceny jako explicit, muze to poskodit celkove ranking
3. Escort directory se na "sex" KW optimalizuji a maji mnohonasobne vetsi autoritu
4. Klienti hledajici "escort prague" jsou relevantnejsi nez "sex praha 2"

Pokud klient trva: pridat FAQ polozku "Je sex s escort v Praze legalní?" ktera obsahuje KW prirozene. Nebo blog clanek. Ale NE keyword stuffing do title/H1.

---

## 5. SHRNUTI

| Oblast | Stav | Dopad |
|--------|------|-------|
| GSC verifikace | CHYBI | Kriticke — bez toho Google nema sitemap |
| robots.txt | OK | — |
| Sitemap | OK (ale neni submitnuty) | — |
| Title tags | OK — obsahuji "Escort Praha/Prague" | — |
| H1 tags | CASTECNE — "Spolecnice Praha" misto "Escort Praha" | Stredni |
| Meta descriptions | OK | — |
| Textovy obsah na HP | NEDOSTATECNY — hlavne komponenty, malo textu | Vysoky |
| Textovy obsah na /divky | CHYBI — jen grid | Stredni |
| "sex" keyword | CHYBI — a doporucuji neoptimalizovat | Nizky |
| Domena autorita | NULOVA — nova domena | Kriticke |
| Backlinky | ZADNE (nebo minimum) | Kriticke |
| Structured data | OK — LocalBusiness, Organization, WebSite, FAQ, BreadcrumbList | — |
| Hreflang | OK — 4 jazyky | — |
| OG tags | OK | — |
| llms.txt | OK — pro AI crawlers | — |
| Blog content | MINIMALNI (teprve se planuje v TASK-017) | Vysoky |

**HLAVNI ZAVER:** Problem NENI technicky (web je technicky dobre udelany). Problem je:
1. Nova domena bez autority a backlinku
2. GSC neni nastaveny → Google nemusi videt sitemap
3. Malo textoveho obsahu pro crawling

Technicky SEO je solidni. Chybi off-page SEO (backlinky, GSC, doba existence domeny) a vice on-page textu.
