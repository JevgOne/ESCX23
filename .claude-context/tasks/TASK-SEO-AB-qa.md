# QA Report: TASK SEO-A+B — Fix redirect chains v SiteFooter + MobileBottomBar

**Datum:** 2026-09-13
**Kontrolor:** kontrolor agent
**Task:** #5 (QA kontrola implementace Task #4)

---

## 1. Simplify kontrola

### SiteFooter.tsx
✅ Změny jsou čisté — raw `<a>` tagy nahrazeny next-intl `<Link>` konzistentně
✅ Odstraněna nepotřebná `localePrefix` proměnná (nebyla po fixu dále využita)
✅ Žádný duplicitní kód, žádný mrtvý kód
✅ Link importy jsou jediné místo importu z `@/i18n/navigation` (řádek 2)
⚠️ Řádek 152 — label výpočet je longline (datum formátování inline), ale to není součástí této změny — preexistující stav

### MobileBottomBar.tsx
✅ Čistá výměna importu: `localePrefix` ze `@/lib/seo/meta` → `Link` z `@/i18n/navigation`
✅ `<a>` → `<Link>` pro pobočky ve dropdown (řádky 52-63)
✅ Ostatní `<a>` tagy (tel:, WhatsApp, Telegram) správně zůstaly jako raw `<a>` — jsou to externí/protocol linky, ne routy

### i18n/routing.ts
✅ Přidán `/hashtag/[slug]': '/hashtag/[slug]'` na řádku 96 — správně jako single-locale pathname (hashtag stránky nemají přeložené URL)
✅ Konzistentní styl s ostatními pathname záznamy

**Simplify závěr: PASS — změny jsou minimální, čisté, bez zbytečného kódu**

---

## 2. Debug kontrola

### TypeScript (`npm run typecheck`)
**Výsledek: PASS**
- Jediné TS chyby jsou v `e2e/tests/full-test.spec.ts` (3× TS18047 — 'sidebarText' possibly null)
- Tyto chyby jsou **pre-existující** a **nesouvisí** s implementovanými změnami
- Nulové nové TS chyby v produkčním kódu

### Build (`npm run build`)
**Výsledek: PASS pro naše změny**
- Kompilace proběhla úspěšně: `✓ Compiled successfully in 8.3s`
- Build selhal při page data collection: `Error [LibsqlError]: URL_INVALID: The URL '' is not in a valid format`
- Tato chyba je **pre-existující** — chybí TURSO_DATABASE_URL v lokálním build prostředí
- Nesouvisí s redirect fix změnami (ověřeno: stejná chyba existovala před Task #4)

**Debug závěr: PASS — žádné nové chyby způsobené implementací**

---

## 3. Reverzní kontrola

Porovnání s plánem v `TASK-SEO-AUDIT-FIX-plan.md` (sekce SEO-A a SEO-B):

### SEO-A: SiteFooter.tsx

| Požadavek z plánu | Status | Detail |
|-------------------|--------|--------|
| Pobočky `<a>` → `<Link href={{ pathname: '/pobocka/[slug]', params: { slug: loc.name } }}>` | ✅ HOTOVO | Řádek 151-153, přesná shoda se vzorem z plánu |
| Hashtag `blondynky-praha` → next-intl `<Link>` | ✅ HOTOVO | Řádek 165 |
| Hashtag `brunetky-praha` → next-intl `<Link>` | ✅ HOTOVO | Řádek 166 |
| Hashtag `gfe-praha` → next-intl `<Link>` | ✅ HOTOVO | Řádek 167 |
| Hashtag `studentky-praha` → next-intl `<Link>` | ✅ HOTOVO | Řádek 168 |
| Import Link z `@/i18n/navigation` | ✅ HOTOVO | Řádek 2 (byl already přítomen) |

### SEO-B: MobileBottomBar.tsx

| Požadavek z plánu | Status | Detail |
|-------------------|--------|--------|
| Import `Link` z `@/i18n/navigation` přidán | ✅ HOTOVO | Řádek 1 |
| Pobočky `<a>` → `<Link href={{ pathname: '/pobocka/[slug]', params: { slug: loc.name } }}>` | ✅ HOTOVO | Řádky 52-63 |

### Routing config

| Požadavek | Status | Detail |
|-----------|--------|--------|
| `/hashtag/[slug]` zaregistrováno v `i18n/routing.ts` | ✅ HOTOVO | Řádek 96 — TypeScript by jinak odmítal Link s tímto pathname |

### Bonus ověření importů

✅ Všechny `Link` komponenty v layout souborech importují **výhradně** z `@/i18n/navigation` (ne z `next/link`)
✅ Pattern `pathname: '/pobocka/[slug]', params: { slug: ... }` odpovídá routing.ts konfiguraci (řádky 90-95)
✅ Pattern `pathname: '/hashtag/[slug]', params: { slug: ... }` odpovídá routing.ts konfiguraci (řádek 96)

**Reverzní kontrola závěr: PASS — implementace plně odpovídá zadání**

---

## Celkové hodnocení

| Kontrola | Výsledek |
|----------|---------|
| Simplify | ✅ PASS |
| Debug (typecheck) | ✅ PASS |
| Debug (build) | ✅ PASS (pre-existující DB chyba nesouvisí) |
| Reverzní kontrola | ✅ PASS |

**VÝSLEDEK: SCHVÁLENO — implementace je správná, čistá a plně odpovídá zadání.**

Odhadovaný dopad: eliminace ~254 redirect chain warnings v SEMrush auditu (7 linků × ~36 EN stránek s footerem + MobileBottomBar).
