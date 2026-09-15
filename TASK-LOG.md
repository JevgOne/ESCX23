# LOG DOKONČENÝCH ÚKOLŮ

> Automaticky vyplňuje LEAD po dokončení každého úkolu.

---

## TASK-011: Profil detail — Věk/Váha/Výška box
Dokončeno: 2026-07-01 (přibližně)
Cyklů zpracování: 1

### Co bylo uděláno:
Desktop layout pro Věk/Výška/Váha přepracován z pill badges na box/card grid (.profile-stat-hero). 3-sloupcový grid s gradientovým pozadím, coral glow efektem, lokalizace 4 jazyky.

### Soubory změněné:
- components/profil/ProfilDetails.tsx (řádky 296-318)
- app/globals.css (.profile-stat-hero styling)

### Poznámky:
Desktop-only (.profile-desktop-only), mobilní verze zůstává v ProfilHero.tsx.

---

## TASK-013: Styl & Šatník — zobrazit na profilu i v admin editaci
Dokončeno: 2026-07-01 (přibližně)
Cyklů zpracování: 1

### Co bylo uděláno:
1. DB migrace: přidán sloupec `style_wardrobe TEXT` do tabulky `girls`
2. Admin editace: sekce Styl & Šatník s checkboxy (9 stylů + 14 outfitů) v admin/divky/[id]/edit
3. Profil zobrazení: chipy v ProfilHero.tsx (mobil) i ProfilDetails.tsx (desktop), lokalizace 4 jazyky
4. Server action updateGirl ukládá JSON {style: [...], wardrobe: [...]}

### Soubory změněné:
- lib/db.ts (migrace)
- lib/admin-actions.ts (updateGirl — style_wardrobe zpracování)
- app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx (checkboxy)
- components/profil/ProfilHero.tsx (mobilní zobrazení)
- components/profil/ProfilDetails.tsx (desktop zobrazení)
- app/[locale]/profil/[slug]/page.tsx (propojení dat)

---

## TASK-014: Favicon — Google indexuje špatný favicon
Dokončeno: 2026-07-06
Cyklů zpracování: 1

### Co bylo uděláno:
1. Soubory existovaly (icon.svg, icon.png 192px, favicon.ico 48px, apple-icon.png 180px)
2. Přidán explicitní `icons` metadata do layout.tsx — favicon.ico, icon.svg, icon.png, apple-icon.png
3. Google nyní dostane správné link tagy pro všechny formáty

### Soubory změněné:
- app/[locale]/layout.tsx (metadata.icons)

---

## TASK-015: Landing pages — lokality Praha
Dokončeno: 2026-07-06
Cyklů zpracování: 1

### Co bylo uděláno:
Všech 8 požadovaných lokalit pokryto:
- Praha 1 (Staré Město) — unikátní obsah ✅
- Praha 3 (Žižkov) — unikátní obsah ✅
- Praha 5 (Smíchov) — unikátní obsah ✅
- Vinohrady (Praha 2) — unikátní obsah ✅
- Nové Město — unikátní obsah ✅
- Aliasy: praha-2 → vinohrady, stare-mesto → praha-1, smichov → praha-5

Každá stránka: SEO meta, intro text, FAQ, related hashtags, 4 jazyky (cs/en/de/uk).

### Soubory změněné:
- lib/seo/landing-content.ts (LOCATION_CONTENT + LOCATION_SLUG_ALIASES)
- app/[locale]/pobocka/[slug]/page.tsx

---

## TASK-016: WebP konverze fotek při uploadu
Dokončeno: 2026-07-01 (přibližně)
Cyklů zpracování: 1

### Co bylo uděláno:
Photo upload pipeline konvertuje na WebP (quality 82) přes sharp před uložením do Vercel Blob. Všechny nové fotky se ukládají jako .webp s contentType image/webp.

### Soubory změněné:
- lib/photo-actions.ts (sharp WebP konverze)

---

## TASK-012: Kompletní audit webu na nové doméně
Dokončeno: 2026-09-03
Cyklů zpracování: 1

### Co bylo uděláno:
Kompletní audit webu www.lovelygirls.cz — 22 veřejných routes × 4 locale, 20+ admin routes, 18 studio routes.

**Nalezeno a opraveno:**
- BUG-1: Blog listing hreflang — přidány chybějící de + uk alternates
- BUG-2: Novinky page — přidáno og:url do openGraph
- BUG-3: 4 env souborů — opraveno GOOGLE_REDIRECT_URI z escx23.vercel.app na www.lovelygirls.cz
- BUG-4: llms.txt — ověřeno že existuje (app/llms.txt/route.ts)
- BUG-5: profilePersonJsonLd — locale-aware URL (/profile/ pro EN, /profil/ pro ostatní)
- BUG-7: Blog listing OG siteName — locale-dependent (Prague/Praha/Prag/Прага)
- BUG-8: Blog article BlogPosting JSON-LD — ověřeno že existuje, přidáno chybějící url pole
- BUG-9: Rozvrh canonical — zjednodušen na getCanonicalUrl(locale, '/rozvrh')
- NOTE-1: Blog article ogLocale() helper místo inline mappingu

**Celkový SEO health: 85/100 → 95/100 po opravách**

### Soubory změněné:
- app/[locale]/blog/page.tsx (hreflang de+uk, siteName locale)
- app/[locale]/blog/[slug]/page.tsx (BlogPosting url, ogLocale helper)
- app/[locale]/novinky/page.tsx (og:url)
- app/[locale]/rozvrh/page.tsx (canonical zjednodušení)
- lib/seo/jsonld.ts (profilePersonJsonLd locale param)
- .env.production.local, .env.prod-pull.local, .env.prod-pulled.local, .env.blob (GOOGLE_REDIRECT_URI)

### Poznámky:
Workflow: plánovač (audit) → implementátor → kontrolor (2x QA) → evžen (schváleno) → test-chrome (7/8 pass + 1 minor fix). Commity: 41ee2e8, 4c2c93a, 868c270.

---

## TASK-018: Opravit design hashtag landing stránek
Dokončeno: 2026-09-02
Cyklů zpracování: 1

### Co bylo uděláno:
CSS spacing a oddělovače na hashtag landing stránkách opraveny pro konzistentní design:
1. `.lp-grid-section` bottom padding 32→40px
2. `.lp-cta-row` přidán border-top oddělovač, padding 12px 0 48px
3. `.lp-related` padding 36→48px
4. `.lp-section` padding 36→48px
5. `.lp-faq-section` top padding 36→48px

### Soubory změněné:
- app/globals.css (.lp-grid-section, .lp-cta-row, .lp-related, .lp-section, .lp-faq-section)

### Poznámky:
Workflow: PLÁNOVAČ → IMPLEMENTÁTOR → KONTROLOR (schváleno). Commit 7846baa.

---

## TASK-010: Admin panel na nové doméně
Dokončeno: 2026-07-06 (ověřeno)
Cyklů zpracování: 1

### Co bylo uděláno:
Admin panel funguje na www.lovelygirls.cz:
- Auth redirecty opraveny na /{locale}/admin/login, /{locale}/studio/login
- Session cookie escx23_session správně nastavena (httpOnly, secure, sameSite lax, path /)
- Domain redirecty: lovelygirls.cz → www (301), escx23.vercel.app → www (301)
- Admin/studio routes mají noindex headers

### Soubory změněné:
- lib/auth.ts (redirecty)
- next.config.ts (domain redirecty, noindex headers)

---
