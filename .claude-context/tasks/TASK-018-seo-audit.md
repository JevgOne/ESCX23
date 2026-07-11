# TASK-018: SEO audit — proc nejsme videt na "escort prague" a "sex praha 2"

## Kontext

Klient: "nejsme vubec v google videt kdyz dam KW escort prague nebo sex praha 2, nic vubec tam nejsme videt"
Domena: www.lovelygirls.cz (nova, migrovana z escx23.vercel.app)

---

## 1. KRITICKE ZJISTENI: Google web VUBEC NEINDEXUJE

WebSearch `site:lovelygirls.cz` vraci **NULA vysledku** z nasi domeny. Zadna stranka neni v Google indexu. Misto toho se ukazuji:
- Quora otazka o lovelygirls.cz (nekdo se ptal jestli je to reliable)
- Nesouvisejici italska znacka pradla "Lovelygirl"

**Toto je hlavni duvod proc web neni videt.** Google nasi domenu vubec neindexuje.

---

## 2. TECHNICKE SEO

### 2a. Google Search Console — NENI NASTAVENO

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var chybi ve vsech `.env` souborech. V `app/[locale]/layout.tsx` (radek 78):
```ts
verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
```
Env var neexistuje → verification meta tag se NEVYKRESLUJE → Google nevi ze web patri klientovi → sitemap neni submittnuty.

**KRITICKE — bez toho se nic nezlepsi.**

### 2b. robots.txt — OK

- Hlavni `*`: `allow: /`, blokuje `/admin/`, `/studio/`, `/api/`
- Googlebot, Google-Extended, GoogleOther: povoleny
- Preview deploys: blokovane
- Sitemap URL: `https://www.lovelygirls.cz/sitemap.xml`

### 2c. Sitemap — OK (ale nesubmitnuty)

Dynamicky generovany z DB. Obsahuje:
- Homepage (4 locale × hreflang)
- /divky, /cenik, /rozvrh, /slevy, /faq, /recenze, /o-nas, /kontakt, /podminky, /soukromi, /blog (4 locale × hreflang)
- Profily divek × 4 locale (s image sitemap)
- Pobocky × 4 locale
- Sluzby × 4 locale
- 32 hashtag stranek × 4 locale

**Problem:** Sitemap existuje ale NENI submittnuty v GSC (protoze GSC neni nastaveno).

---

## 3. ON-PAGE SEO — hlavni stranky

### 3a. Homepage (/) — KW: "escort prague", "escort praha"

| Element | CS verze | EN verze | Stav |
|---------|----------|----------|------|
| Title | "Escort Praha — Overene spolecnice v privatnim apartmanu \| LovelyGirls" | "Escort Prague — Verified Companions, Private Apartments \| LovelyGirls" | OK |
| Meta desc | "13 overenych spolecnic v Praze. 4 diskretni apartmany..." | "13 verified companions in Prague. 4 discreet apartments..." | OK |
| H1 | "Spolecnice Praha" + "Luxusni escort" (2 casti) | "Prague Companions" + "Luxury escort" | PROBLEM — H1 neobsahuje "Escort Praha" / "Escort Prague" jako celek |
| Body text | Minimalni — hlavne komponenty (Hero, GirlCards, Reviews) | Stejne | PROBLEM — malo crawlovatelneho textu |
| Keywords meta | Z DB: "escort praha, spolecnice praha, privatni apartman, overene divky" | "escort prague, companions prague, private apartments, verified girls" | OK (pokud sync-seo-metadata.ts probehl) |
| Schema | LocalBusiness + Organization + WebSite (s SearchAction) | OK | OK |

**Problemy:**
1. H1 neobsahuje hlavni KW jako celek ("Escort Praha"/"Escort Prague")
2. Malo textoveho obsahu — homepage je vizualne bohata ale textove chuda
3. `sr-only` paragraph s `home_lead` — skryty text, Google ho ignoruje nebo penalizuje

### 3b. /divky — KW: "spolecnice praha", "escort divky"

| Element | Stav |
|---------|------|
| Title | "Spolecnice Praha" (cs), "Prague Companions" (en) — z i18n | 
| H1 | Stejne jako title |
| Body text | Pouze grid karet, zadny SEO intro text |

**Problem:** Zadny unikatni textovy obsah — pouze seznam karet.

### 3c. "sex praha 2" — NENI nikde na webu

Slovo "sex" se na webu vubec nepouziva. Ani v title, ani v H1, ani v textu, ani v meta description.

---

## 4. KONKURENCNI ANALYZA (WebSearch)

### 4a. "escort prague" — kdo je na 1. strane

| Pozice | Web | Typ | Co maji |
|--------|-----|-----|---------|
| 1-2 | **escortprague24h.com** | Agentura | Dedicka domena "escort prague" primo v nazvu. 24h. Stovky profilu. |
| 3-4 | **praguescort.cz** | Agentura/directory | Verifikovane profily, real photos, blog s SEO clanky ("How to find best escort agencies"), premium/VIP stranky. Cerstvy obsah (kveten 2026). |
| 5-6 | **Yelp** listingy | Directory | Hot Peppers, Darling Cabaret, Sweet Paradise — user reviews, established authority. |
| 7+ | **worldredlightdistricts.com** | Guide blog | "Best Brothels in Prague" — vysoky DA, informacni obsah. |

### 4b. "escort praha" — kdo je na 1. strane

Stejna sestava + navic:
- **annonce.cz** — cesky inzertni portal, kategorie "Spolecnice"
- Yelp listingy

### 4c. "sex praha 2" — kdo je na 1. strane

| Pozice | Web | Typ |
|--------|-----|-----|
| 1-2 | **annonce.cz** | Inzerce — "Spolecnice v okrese Praha 2" |
| 3+ | Nesouvisejici (divadelni hra "Sex pro pokrocile 2") |

### 4d. Co konkurence ma a my nemame

| Faktor | Konkurence | LovelyGirls |
|--------|-----------|-------------|
| **Domena v nazvu** | escortprague24h.com, praguescort.cz — KW primo v domene | lovelygirls.cz — brand name, zadne KW |
| **Stari domeny** | Roky az desetileti | Nova domena (migrce z vercel.app) |
| **Backlinky** | Stovky-tisice (directory, forum, review sites) | Pravdepodobne 0 nebo minimum |
| **Blog/guide obsah** | praguescort.cz ma SEO clanky ("How to find...") | Blog prazdny (TASK-017 teprve v planu) |
| **Pocet profilu** | Stovky | 13 |
| **Indexace** | Plne indexovane | **VUBEC NEINDEXOVANE** |
| **Yelp/Google Business** | Uvedeny na Yelp, Google Maps | Neuvedeni nikde |
| **Review platforms** | Recenze na Yelp, TripAdvisor, forum | Pouze interni recenze |
| **24/7 dostupnost** | Nekteri inzeruji 24h | 10:00-22:30 |
| **Textovy obsah** | Stovky slov na hlavnich strankach | Minimalni |

---

## 5. HLAVNI DUVODY PROC WEB NENI VIDET (serazeno)

### #1: Google web VUBEC NEINDEXUJE (KRITICKE)
`site:lovelygirls.cz` = 0 vysledku. Bez indexace nemuze byt zadna viditelnost.

### #2: GSC neni nastaveno (KRITICKE)
Bez GSC: sitemap nesubmitnuty, nemuzeme requestovat indexovani, nevidime data.

### #3: Nova domena bez autority
Nulovy Domain Authority, zadne backlinky. I po indexaci to potrva mesice.

### #4: Malo textoveho obsahu
Homepage a /divky jsou vizualne bohate ale textove chude. Google potrebuje text.

### #5: Silna konkurence s KW v domene
escortprague24h.com a praguescort.cz maji KW primo v domene — obrovska vyhoda.

### #6: Zadny blog obsah
Konkurence ma SEO clanky, my nemame nic.

### #7: "sex praha 2" neni v obsahu
Slovo "sex" se na webu nepouziva.

---

## 6. ACTION ITEMS

### P0 — Ihned (dnes/zitra)

| # | Akce | Kdo |
|---|------|-----|
| 1 | **Registrovat www.lovelygirls.cz v Google Search Console** | Klient |
| 2 | **Ziskat GSC verification token**, nastavit `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` na Vercel | Klient |
| 3 | **Submittovat sitemap** v GSC (`https://www.lovelygirls.cz/sitemap.xml`) | Klient |
| 4 | **Request indexing** homepage + /divky + /cenik + /rozvrh v GSC (URL Inspection → Request Indexing) | Klient |

### P1 — Tento sprint (1-2 tydny)

| # | Akce | Kdo |
|---|------|-----|
| 5 | **Pridat viditelny SEO intro text na homepage** pod Hero — ne sr-only, ale skutecny odstavec s KW "escort Praha", "overene spolecnice", "privatni apartmany v centru" | Implementator |
| 6 | **Pridat SEO intro text na /divky** — odstavec nad gridem | Implementator |
| 7 | **Zvazit zmenu H1 na homepage** — "Escort Praha" misto "Spolecnice Praha" | Klient (rozhodnuti) |
| 8 | **Registrace na Yelp** — vytvorit Yelp Business listing | Klient |
| 9 | **Registrace na Google Business Profile** (pokud mozne pro tento typ podnikani) | Klient |

### P2 — Strednedoba (1-3 mesice)

| # | Akce |
|---|------|
| 10 | **Blog clanky** — 1/tyden s cilovymi KW (TASK-017). Temata: "Escort Praha pruvodce", "Jak vybrat spolecnici", "Privat vs hotel" |
| 11 | **Backlinky** — registrace v escort adresarich, annonce.cz inzerat, forum profily |
| 12 | **Social signals** — Instagram/Telegram propojit se zpetnymi odkazy na web |
| 13 | **Monitorovat GSC** — po 2-4 tydnech kontrolovat impressions, indexovane stranky, crawl errors |

### P3 — Ohledne "sex praha 2"

**Doporuceni: NEOPTIMALIZOVAT primo na "sex" keyword.**
- Google SafeSearch muze web skryt
- Misto toho: FAQ polozka "Je escort v Praze legalni?" obsahujici KW prirozene
- Blog clanek ktery pouziva KW v kontextu (informacni obsah)
- Annonce.cz inzerat s KW "Praha 2" pro zachyceni tohoto trafficu

---

## 7. SHRNUTI

| Oblast | Stav | Priorita |
|--------|------|----------|
| Google indexace | **NULOVA** — 0 stranek v indexu | KRITICKE |
| GSC verifikace | CHYBI | KRITICKE |
| Sitemap | OK (ale nesubmitnuty) | — |
| robots.txt | OK | — |
| Title tags | OK — obsahuji KW | — |
| H1 homepage | CASTECNE — "Spolecnice Praha" ne "Escort Praha" | STREDNI |
| Textovy obsah HP | NEDOSTATECNY | VYSOKY |
| Textovy obsah /divky | CHYBI | STREDNI |
| Schema/JSON-LD | OK | — |
| Hreflang | OK | — |
| Konkurence | SILNA — etablovane domeny s KW v nazvu | — |
| Backlinky | NULOVE | VYSOKY |
| Blog | PRAZDNY | VYSOKY |
| "sex" keyword | CHYBI (doporucuji neoptimalizovat) | NIZKY |

**HLAVNI ZAVER:** Technicke SEO webu je solidni. Problem je fundamentalni: **Google web vubec neindexuje.** Dokud se nenastavi GSC a nesubmitne sitemap, zadna jina optimalizace nema efekt. Po indexaci bude trvat 3-6 mesicu nez se web zacne objevovat na konkurencnich KW kvuli nulove autorite domeny.
