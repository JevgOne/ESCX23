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
