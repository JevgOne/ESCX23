# FRONTA ÚKOLŮ (TASK QUEUE)

> Úkoly se zpracovávají shora dolů podle priority.
> Stav: čeká | zpracovává se | hotovo | chyba
> Nové úkoly přidávej na konec — lead je seřadí podle priority.

---

## TASK-018: Opravit design hashtag landing stránek
Priorita: 1
Stav: čeká
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Uživatel říká: "tohle je hrozny po tom co kliknu na filtr, dole ty Escort Praha 2 3 atd to je katastrofa dole pod tim je hned na linka bez odstupu, nad tim ty kategorie dobry, nad tim who works today tady dole je linka oddelovač ten je bez odstupu nahoře ten text vypada uplne napíču"

Problémy na hashtag stránkách (např. /en/hashtag/escort-prague, /en/hashtag/prirodni-poprsi):
1. Sekce "Where to find us" (Escort Praha 2/3/5) — nemá dostatečný odstup od sekce Related categories nad ní
2. Pod apartmány sekcí je hned FAQ bez dostatečného odstupu
3. CTA tlačítka (View all companions / Who works today) — nemají dostatečný spacing
4. Celkově chybí konzistentní border-top oddělovače + padding mezi sekcemi

Referenční design: podívat se jak vypadají sekce na homepage (consistent spacing, border-top oddělovače, padding). Hashtag stránky musí mít STEJNÝ vizuální styl mezer a oddělovačů.

### Kontext:
- CSS: app/globals.css, třídy .lp-section, .lp-related, .lp-faq-section, .lp-cta-row, .lp-intro
- Stránka: app/[locale]/hashtag/[slug]/page.tsx
- Už přidán .lp-section { padding: 36px 0; border-top: 1px solid var(--color-line); } ale uživatel říká že to stále nevypadá dobře
- NEMĚNIT obsah/text, pouze CSS spacing a vizuální konzistenci

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

## TASK-017: Blog — 12 článků, předepsat drafty
Priorita: 3
Stav: čeká
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Naplánovat 12 blogových článků (3 měsíce, 1/týden). Předepsat jako drafty do DB. Témata relevantní pro escort agenturu v Praze.

### Kontext:
- Blog: app/[locale]/blog/, DB: blog_posts tabulka
- Copywriter agenti: copywriter-cs, copywriter-en, copywriter-de, copywriter-uk

---
