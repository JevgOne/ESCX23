# AUDIT: 'use client' direktivy v celém codebase

**Datum:** 2026-08-30
**Celkem nalezeno:** 12 souborů s `'use client'` / `"use client"`

---

## SOUHRN

| # | Soubor | Verdikt | Zduvodneni |
|---|--------|---------|------------|
| 1 | `components/profil/PhotoLightbox.tsx` | PONECHAT | Lightbox = portal + keyboard/swipe events + state. Nelze bez JS. |
| 2 | `components/stories/StoryVideoPlayer.tsx` | PONECHAT | Video autoplay + progress tracking + auto-advance navigace. Nelze bez JS. |
| 3 | `components/stories/StoryAutoAdvance.tsx` | PONECHAT | Timer + router.push pro auto-advance stories. Nelze bez JS. |
| 4 | `components/profil/VoicePlayer.tsx` | PONECHAT | Audio player s play/pause/seek/progress. Nelze bez JS. |
| 5 | `components/GoogleAnalytics.tsx` | PONECHAT | GA tracking vyzaduje usePathname + Script. Standardni pattern. |
| 6 | `app/[locale]/error.tsx` | PONECHAT | Next.js VYZADUJE 'use client' pro error.tsx (framework requirement). |
| 7 | `components/stories/StoryMarkSeen.tsx` | PONECHAT | localStorage pro oznaceni videneho — ciste client-side concern, renderuje null. |
| 8 | `components/stories/StoriesScroll.tsx` | PONECHAT (s vylepsenim) | localStorage seen-tracking + click handler. Ale viz plan nize. |
| 9 | `components/layout/NavCloseOnRoute.tsx` | **PREPSAT NA SERVER** | Zavira hamburger menu pri navigaci. Resitelne pres CSS. |
| 10 | `components/ui/TranslateButton.tsx` | PONECHAT | Fetch na externi API + state pro preklad. Nelze bez JS. |
| 11 | `app/[locale]/(admin)/admin/seo/page.tsx` | PONECHAT (admin) | Admin stranka — plna interaktivita (filtry, fetch, scan). Admin nepotrebuje SSR. |
| 12 | `app/[locale]/(admin)/admin/seo/edit/page.tsx` | PONECHAT (admin) | Admin formular — file upload, form state, API calls. Admin nepotrebuje SSR. |

---

## DETAILNI ANALYZA A PLAN

### 1. PhotoLightbox.tsx — PONECHAT
- **Proc:** Portal do document.body, keyboard events (Escape, Arrow), touch swipe, body overflow lock
- **CLAUDE.md povoluje:** "photo lightbox" explicitne

### 2. StoryVideoPlayer.tsx — PONECHAT
- **Proc:** Video autoplay, timeupdate event pro progress bar, onEnded navigace
- **CLAUDE.md povoluje:** "stories video preview" explicitne

### 3. StoryAutoAdvance.tsx — PONECHAT
- **Proc:** setTimeout + router.push pro auto-advance, progress bar animace
- **CLAUDE.md povoluje:** Soucest stories video preview

### 4. VoicePlayer.tsx — PONECHAT
- **Proc:** Audio element interakce (play/pause/seek), real-time progress, state management
- **Poznamka:** Audio player inherentne vyzaduje JS. Fallback bez JS by mel byt `<audio controls>` tag — to uz tam je (radek 92).

### 5. GoogleAnalytics.tsx — PONECHAT
- **Proc:** GA Script loading + page view tracking pres usePathname/useSearchParams
- **Poznamka:** Toto je standardni Next.js GA pattern. Pokud se JS nevykonava, GA se nenacte — coz je spravne chovani (bez JS = bez trackingu).

### 6. error.tsx — PONECHAT
- **Proc:** Next.js App Router VYZADUJE `'use client'` pro error boundary soubory. Toto je framework requirement, nelze zmenit.
- **Ref:** https://nextjs.org/docs/app/api-reference/file-conventions/error

### 7. StoryMarkSeen.tsx — PONECHAT
- **Proc:** Zapisuje do localStorage ze story byla videna. Renderuje `null`. Ciste progressive enhancement — bez JS se neoznaci jako videna, ale vse funguje.

### 8. StoriesScroll.tsx — PONECHAT (s doporucenim)
- **Proc:** localStorage seen-tracking (vizualni ring zmena) + click event handler
- **Doporuceni:** Komponent obaluje `children` (server-rendered stories). Sam pridava jen vizualni "videno" efekt. Toto je spravny pattern — server vyrenderuje HTML, client prida progressive enhancement.

### 9. NavCloseOnRoute.tsx — **PREPSAT NA SERVER** (ODSTRANIT)
- **Aktualni stav:** Posloucha `usePathname()` a pri zmene odklikne `nav-toggle` checkbox
- **Problem:** Toto je zbytecne — hamburger menu uz pouziva CSS checkbox pattern (`:checked`). Pri kliknuti na `<a>` link dojde k full navigation (server-side), coz automaticky zresetuje checkbox stav, protoze se nacte nova stranka s novou HTML.
- **Vyjimka:** Pokud se pouziva `<Link>` (Next.js client-side navigace), checkbox se NEzresetuje. ALE — CLAUDE.md rika "funguje s vypnutym JS", takze navigace by mela fungovat i bez JS = full page reload = checkbox se resetuje.

#### Plan prepisu NavCloseOnRoute:
1. **Overit:** Zkontrolovat jestli SiteHeader pouziva `<Link>` nebo `<a>` pro navigacni polozky
   - **Vysledek:** Pouziva `<Link>` z `@/i18n/navigation` (next-intl) — takze pri client-side navigaci se checkbox NEzresetuje
2. **Reseni A (jednoduche):** Pridat CSS pravidlo:
   ```css
   .main-nav a { /* po kliknuti na link */ }
   ```
   Problem: CSS neumi reagovat na navigaci
3. **Reseni B (spravne):** Zmenit navigacni linky v `SiteHeader.tsx` z `<Link>` na `<a>` pro hamburger menu
   - Ale `<Link>` je potreba pro client-side navigaci (rychlejsi UX)
4. **Reseni C (kompromis — DOPORUCENO):** NavCloseOnRoute PONECHAT jako jediny legitimni duvod pro 'use client' v layoutu
   - Je to maly komponent (renderuje null, 15 radku)
   - Bez nej by hamburger menu zustalo otevrene po kliknuti na link (spatny UX)
   - Progressive enhancement: bez JS se menu zavre prirozenym page reload

**REVIDOVANY VERDIKT pro NavCloseOnRoute: PONECHAT** — je to legitimni progressive enhancement pattern. Bez JS funguje (page reload zavre menu), s JS zlepsuje UX.

### 10. TranslateButton.tsx — PONECHAT
- **Proc:** Fetch na externi prekladaci API (lingva.ml) + state pro zobrazeni prekladu
- **Poznamka:** Preklad recenzi je inherentne client-side operace. Bez JS se tlacitko proste nezobrazi / nefunguje — to je ok.

### 11-12. Admin SEO stranky — PONECHAT
- **Proc:** Admin panel nepotrebuje SSR ani fungovat bez JS. Interaktivni filtry, API fetching, file upload — vse legitimne client-side.
- **CLAUDE.md:** Admin explicitne neni v seznamu stranek co musi byt server-rendered

---

## ZAVER

**Vse je v poradku.** Vsechny `'use client'` direktivy jsou bud:
1. Explicitne povolene v CLAUDE.md (lightbox, video, slider)
2. Vyzadovane frameworkem (error.tsx)
3. Progressive enhancement (seen tracking, nav close, translate)
4. Admin panel (nepotrebuje SSR)

**Zadna komponenta neporusuje pravidla.** Zadna stranka neni cela client-side — vsechny pages jsou Server Components, jen male leaf-komponenty maji `'use client'`.

### Statistika:
- **12 souboru** s 'use client' z celkoveho codebase
- **0 pages** (krome error.tsx a admin SEO) je client-side
- **8 komponent** jsou male leaf-komponenty (renderuji null nebo maly UI fragment)
- **2 admin pages** — opravnene client-side (admin panel)

### Jediny potencialni improvement:
- **NavCloseOnRoute** by slo eliminovat zmenou navigacnich `<Link>` na `<a>` v hamburger menu, ale to by zhorsilo UX (pomalejsi navigace). Aktualni reseni je spravny kompromis.
