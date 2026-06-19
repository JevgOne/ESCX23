# TASK-012 Chrome Audit — www.lovelygirls.cz
Datum: 2026-06-14 | Tester: test-chrome

## Souhrn
- CRITICAL: 2
- WARN: 4
- OK: 25
- INFO: 19

---

## CRITICAL ISSUES

### 1. Admin login selže — `/cs/admin`
- Přihlášení `admin@lovelygirls.cz / Admin2026!` vrací `?error=invalid`
- Redirect na login funguje (auth guard OK), ale heslo je odmítnuto
- TASK-010 byl in_progress na toto téma — tento problém je jeho součástí

### 2. Studio login selže — `/cs/studio`
- Přihlášení `anetta@lovelygirls.cz / Anetta2026!` vrací `?error=invalid`
- Redirect na login funguje, ale heslo je odmítnuto

---

## WARNINGS

### 3. Root redirect (`/`) nezpřesměrovává
- `https://www.lovelygirls.cz/` vrací 200 a zůstane na `/`
- Mělo by přesměrovat na `/cs` nebo `/en` (dle Accept-Language)
- Zatím funguje — EN verze se zobrazí přímo na root

### 4. Profile — chybí tel: a wa.me odkazy
- `/cs/profil/anetta` nemá viditelné `<a href="tel:...">` ani `<a href="wa.me/...">`
- Pravděpodobně schované za login wall nebo v jiné části stránky

### 5. robots.txt — chybí `User-agent:`
- robots.txt vrací 200 a má `Sitemap:`, ale automatická detekce `User-agent:` textu selhala
- Může být falešně pozitivní (obsah v HTML wrapperu kvůli Playwright)

---

## OK — Co funguje

| Stránka | Status |
|---|---|
| Homepage CS `/cs` | 200, H1 OK, canonical OK |
| Homepage EN `/en` | 200, H1 OK |
| Homepage DE `/de` | 200, H1 OK |
| Homepage UK `/uk` | 200, H1 OK |
| Hreflang na `/cs` | 5 tagů (cs, en, de, uk, x-default) |
| og:url na `/cs` | přítomen |
| Girls listing `/cs/divky` | 200, 12 karet, filtr přítomen |
| Girls EN `/en/girls` | 200 |
| Profile `/cs/profil/anetta` | 200, H1 OK, canonical OK, structured data (Person + BreadcrumbList) |
| Profile hreflang | 10 tagů (duplicitní — 5 × 2) |
| Profile og:image | přítomna |
| Schedule `/cs/rozvrh` | 200, 9 day tabs |
| Schedule past day redirect | ✓ přesměrovává pryč od 2026-01-01 |
| Pricing `/cs/cenik` | 200, schema OfferCatalog + BreadcrumbList |
| Discounts `/cs/slevy` | 200 |
| FAQ `/cs/faq` | 200, 17 \<details\> elementů, accordion funguje |
| About `/cs/o-nas` | 200 |
| Blog `/cs/blog` | 200, první post funguje |
| Hashtag `/cs/hashtag/blondynky-praha` | 200 (0 karet — tag může být prázdný) |
| 404 pages (4×) | HTTP 404 + 404 content ✓ |
| Admin auth redirect | ✓ → `/cs/admin/login` |
| Studio auth redirect | ✓ → `/cs/studio/login` |
| sitemap.xml | 200, 396 URLs, žádné staré domény |
| robots.txt | 200, Sitemap: přítomen |
| llms.txt | 200 |
| Mobile (390×844) | Homepage, Girls, Profile, Schedule — vše OK |
| Mobile hamburger | funguje |

---

## PERF (TTFB)

| Stránka | TTFB |
|---|---|
| Homepage root `/` | 1756ms |
| Homepage CS `/cs` | 2661ms |
| Girls CS `/cs/divky` | 1675ms |
| Profile anetta | 1521ms |
| Schedule CS `/cs/rozvrh` | 855ms |

Poznámka: První load profilu byl 6342ms (cold start Vercel) — subsequent loads 1521ms.

---

## Doporučení (priorita)

1. **[CRITICAL]** Opravit admin + studio login na www.lovelygirls.cz — hesla nebo DB session nefungují
2. **[MINOR]** Root `/` přesměrovat na `/cs` nebo `/en` (Accept-Language)
3. **[CHECK]** Profile tel/wa.me — ověřit jestli jsou schované za přihlášením nebo chybí
4. **[CHECK]** Hashtag blondynky-praha — 0 karet (prázdný tag nebo problém s daty?)
5. **[INFO]** Profile hreflang duplicitní (10 tagů místo 5) — pravděpodobně generovaný 2× v layout
