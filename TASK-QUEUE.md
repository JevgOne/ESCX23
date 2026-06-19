# FRONTA ÚKOLŮ (TASK QUEUE)

> Úkoly se zpracovávají shora dolů podle priority.
> Stav: čeká | zpracovává se | hotovo | chyba
> Nové úkoly přidávej na konec — lead je seřadí podle priority.

---

## TASK-010: Admin panel nefunguje na nové doméně
Priorita: 1
Stav: čeká
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Admin panel nefunguje na www.lovelygirls.cz. Uživatel říká "nefunguje ted admin atd atd" a "admin panel nefunguje třeba". Web byl migrován z escx23.vercel.app na www.lovelygirls.cz. Ověřit že admin login, přihlášení, a všechny admin stránky fungují na nové doméně. Zkontrolovat session cookies, Server Actions, redirecty.

### Kontext:
- Doména: www.lovelygirls.cz (nová), escx23.vercel.app (stará → redirect 301)
- Auth: lib/auth.ts, lib/auth-actions.ts (Server Actions pro login)
- Session cookie: 'escx23_session', httpOnly, secure, sameSite: lax, path: /
- Admin login: admin@lovelygirls.cz / Admin2026!
- Studio login: anetta@lovelygirls.cz / Anetta2026!
- Redirecty v lib/auth.ts už opraveny na /cs/admin/login, /cs/studio/login

---

## TASK-011: Profil detail — Věk/Váha/Výška box
Priorita: 1
Stav: čeká
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Uživatel říká: "máš špatně ten profile detail Věk, Váha a výška má být v takovém boxu jako je na mobilu". Na desktop verzi profilu (např. /cs/profil/anetta) jsou Věk, Výška, Váha zobrazeny jako pill badges v řadě (třída .profile-stat-details.profile-desktop-only). Na mobilu je jiný layout. Uživatel chce aby na desktopu byly tyto údaje v boxu/kartě — podobně jako mobilní layout.

### Kontext:
- Komponenta: components/profil/ProfilDetails.tsx (řádky 289-351, .profile-stat-details)
- Styly: app/globals.css (hledat .profile-stat-details, .psd-pill)
- Mobilní verze je v ProfilHero.tsx
- URL: https://www.lovelygirls.cz/cs/profil/anetta

---

## TASK-012: Kompletní audit webu na nové doméně
Priorita: 2
Stav: čeká
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Kompletní kontrola celého webu na www.lovelygirls.cz. Uživatel říká "udelej to kompletně" a "všechny odkazy musí být předělány na nový url" a "zkontroluj". Projít:
1. Všechny veřejné stránky (homepage, divky, profily, cenik, rozvrh, slevy, faq, blog, o-nas, kontakt, podminky, soukromi, hashtag, pobocka, sluzba, pridat-se, clenstvi, recenze)
2. Všechny locale verze (cs, en, de, uk)
3. Admin panel — login + všechny admin stránky za přihlášením
4. Studio — login + všechny studio stránky za přihlášením
5. SEO: canonical URLs, hreflang, og:url, sitemap, robots.txt, llms.txt, structured data (JSON-LD)
6. Redirecty: lovelygirls.cz → www, escx23.vercel.app → www
7. Žádné staré URL (escx23.vercel.app, https://lovelygirls.cz bez www) v HTML výstupu

### Kontext:
- Doména: www.lovelygirls.cz
- NEXT_PUBLIC_SITE_URL=https://www.lovelygirls.cz (nastaveno na Vercel)
- Migrace proběhla: 13 souborů upraveno, 224 DB canonical URLs opraveno
- robots.txt Host/Sitemap už ukazuje www.lovelygirls.cz ✓
- Sitemap URL potvrzeno www.lovelygirls.cz ✓
- Hreflang potvrzeno www.lovelygirls.cz ✓

---
