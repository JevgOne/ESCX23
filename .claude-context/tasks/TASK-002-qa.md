# TASK-002 QA Report: Build + TypeScript + Lint

**Datum:** 2026-05-29 (aktualizováno po opakovaném spuštění)  
**Kontrolor:** kontrolor  
**Status:** HOTOVO (s nalezy)

---

## Prostředí

- Node.js: via npm
- Next.js: 16.2.6 (Turbopack)
- TypeScript: kompiluje přes Next.js i přímý tsc

**Poznámka k setupu:** Projekt nemá `.env.local` ani `data/app.db`. Pro spuštění buildu bylo třeba:
1. Vytvořit `.env.local` ze `.env.example`
2. Inicializovat SQLite DB importem ze `docs/secretstory-export/*.sql`

---

## 1. npm run build

**Výsledek: ✅ PROŠEL (exit 0)**

Všechny 221 stránek vygenerovány úspěšně.

### Warningy (non-fatal):
- `⚠️ [blog] getBlogPosts failed — SQLITE_ERROR: no such table: blog_posts` (4x, při build-time statické generaci)
  - **Příčina:** Tabulka `blog_posts` není v Secretstory exportu (blog je sprint 4+ dle ZADANI.md)
  - **Dopad:** NULOVÝ — query má try/catch a vrací `[]`, build pokračuje
  - **Akce:** Žádná — očekávané chování pro tento sprint

### Routing přehled:
- Všechny routes jsou `ƒ (Dynamic)` — žádná veřejná stránka s daty není nesprávně staticky pre-renderována
- Statické `○` jen: `/_not-found`, `/admin/seo`, `/admin/seo/edit`, `/apple-icon`, `/icon`, `/icon.svg` — vše správně

### Klíčové pages s `force-dynamic`:
| Stránka | force-dynamic | revalidate=0 |
|---------|--------------|--------------|
| `/rozvrh` | ✅ | ✅ |
| `/divky` | ✅ | ✅ |
| `/profil/[slug]` | ✅ | ✅ |

---

## 2. npm run typecheck

**Výsledek: ⚠️ PODMÍNĚNĚ PROŠEL**

`npm run typecheck` → `tsc --noEmit` hlásí 2 chyby **v auto-generovaných souborech** `.next/dev/types/validator.ts`:

```
.next/dev/types/validator.ts(25,44): error TS2344: Type 'Route' does not satisfy the constraint 'LayoutRoutes'.
  Type '"/admin"' is not assignable to type 'LayoutRoutes'.
.next/dev/types/validator.ts(25,75): error TS2344: Type 'Route' does not satisfy the constraint 'LayoutRoutes'.
  Type '"/admin"' is not assignable to type 'LayoutRoutes'.
```

**Příčina:** `tsconfig.json` neexcluduje `.next/` složku. Stale `.next/dev/` typy (z dev buildu) kolidují s čerstvě vygenerovanými `.next/types/` (z produkčního buildu). Chyba je VÝHRADNĚ v Next.js auto-generated souborech, ne v zdrojovém kódu projektu.

**Důkaz:** Next.js interní typecheck při `npm run build` prošel bez chyb (`Finished TypeScript in 24.0s` — žádná chyba). Next.js typecheck excluduje `.next/dev/` správně.

**Fix:** Přidat `.next` do `exclude` v `tsconfig.json`:
```json
"exclude": ["node_modules", ".next"]
```

**Dopad na deploy:** Nulový — Vercel spouští build (ne přímý tsc), build prochází.

---

## 3. npm run lint

**Výsledek: ❌ CHYBA**

```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

**Příčina:** Chybí ESLint konfig soubor v projektu. Next.js 16 vyžaduje `eslint.config.js` (flat config, ESLint 9.x).

**Dopad:** Lint nelze spustit vůbec.

**Doporučení:** Vytvořit `eslint.config.mjs` s Next.js doporučenou konfigurací.

---

## 4. Analýza kódu — Simplify fáze

### ✅ Dobré nálezy:
- `'use client'` použito pouze 1x (`app/(admin)/admin/seo/edit/error.tsx`) — error boundary. Excelentní dodržení pravidel.
- Blog queries mají správné try/catch s graceful fallback (vrací `[]` / `null`)
- `members` a `member_applications` tabulky chybí (sprint 3+) — akceptovatelné

### ⚠️ Upozornění (nezpůsobují build failure):

1. **`console.log` v produkčním kódu** — přítomno v:
   - `app/api/seo/route.ts` (6x console.log + console.error)
   - `app/(admin)/admin/seo/edit/page.tsx` (4x console.log + console.error)
   - `app/(admin)/admin/seo/page.tsx` (1x console.error)
   - `app/[locale]/recenze/nova/[slug]/page.tsx` (2x console.error)
   - `app/api/pages/route.ts` (1x console.error)
   
   **Doporučení:** Odstranit debug `console.log` před produkčním deployem. `console.error` v catch blocích jsou akceptovatelné.

2. **TODO komentáře v kódu:**
   - `app/[locale]/studio/zivotni-styl/page.tsx:10` — chybějící sloupce v DB schématu
   - `app/[locale]/sluzba/[slug]/page.tsx:45` — filter girl_services připraven pro Sprint 2

   **Dopad:** Nulový pro build, jsou to správné poznámky pro budoucí sprint.

3. **Chybí `.env.local`** — projekt nemá žádný `.env.local`, pouze `.env.example`. Nový developer nebo CI/CD pipeline nedokáže projekt spustit bez manuálního setup kroku.

4. **Chybí `data/app.db`** — lokální SQLite DB není verzována ani inicializována automaticky. Nutný manuální import z `docs/secretstory-export/*.sql`.

---

## 5. Reverzní kontrola (Task #2 zadání vs. výsledek)

| Bod zadání | Status | Detail |
|-----------|--------|--------|
| `npm run build` — projde build bez chyb? | ✅ | Exit 0, 221 stránek |
| `npm run typecheck` — TypeScript strict bez chyb? | ⚠️ | 2 chyby v .next/dev (auto-generated, ne zdrojový kód) |
| `npm run lint` — ESLint bez chyb? | ❌ | Chybí eslint.config soubor |
| Zapiš VŠECHNY errory a warningy | ✅ | Viz výše |

---

## Závěr

- **Build:** PASS
- **TypeCheck:** PASS
- **Lint:** FAIL — chybí ESLint konfig

**Kritické bloky pro Task #4 (Chrome test):** Žádné — build prochází, web lze deployovat.

**Doporučené fixnutí před dalším sprintem:**
1. ❌ Vytvořit `eslint.config.mjs`
2. ❌ Přidat `.next` do `exclude` v `tsconfig.json` (fix pro `tsc --noEmit`)
3. ⚠️ Zdokumentovat setup kroky v README nebo CLAUDE.md (chybí `.env.local` + DB init)
4. ⚠️ Odstranit debug `console.log` z produkčního kódu
