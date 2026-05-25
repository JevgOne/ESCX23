# ESCX23 — LovelyGirls Praha (server-side rebuild)

## Co je projekt
Server-side rendered web pro premium escort agenturu v Praze. Kompletní rebuild webu **lovelygirls.cz** — přechod z client-side React (Secretstory) na **Next.js 16 App Router se Server Components**. Hlavní cíl: aby Google a LLM crawlery (GPTBot, ClaudeBot, PerplexityBot) viděly kompletní HTML v prvním requestu.

## Klíčové dokumenty
- **`docs/ZADANI.md`** — kompletní specifikace (1736 řádků). Single source of truth pro logiku, datový model, URL routing, role.
- **`mockups/`** — 19 HTML mockupů. Single source of truth pro vizuál (přesně podle nich).
- **`docs/SECRETSTORY-REFERENCES.md`** — soupis souborů ze Secretstory které lze ČÍST jako referenci (nekopírovat).

---

## Stack — pevně dané

- **Next.js 16** (App Router)
- **TypeScript** strict
- **React 19** (Server Components default)
- **Prisma** + **libSQL/Turso** (DB)
- **Tailwind CSS v4** (nebo CSS modules — rozhodne logik v plánu)
- **Resend** (transactional email)
- **Vercel Blob** (photo storage; alternativa Cloudflare R2)
- **next-intl** (i18n: cs default, en, de, uk)
- Auth: **NextAuth v5** (cookies session) nebo vlastní (k diskuzi v konzultaci)
- Hosting: **Vercel** (alternativa Hetzner VPS — k diskuzi)

---

## ABSOLUTNÍ pravidla (nikdo nesmí porušit)

### 1. Server-Side Rendering by default

Každá stránka je **Server Component**. `'use client'` pouze pro:
- Photo lightbox / galerie animace
- Drag & drop upload (Studio)
- Stories video preview
- Filtry slidery (a i tam je fallback `<input type="number">`)
- Modal po kliku (kde je to nutné)

**Default napiš Server Component.** Senior agent v review fázi `'use client'` napadá.

### 2. Funguje s vypnutým JavaScriptem

- Filtry → URL params (`/divky?status=available&loc=vinohrady`), submit přes `<form method="GET">`
- Den tabs v rozvrhu → `<a href="/rozvrh?day=2026-05-09">`
- Forms → `<form action="..." method="POST">`
- Akordeon / FAQ → `<details>` + `<summary>` (HTML native)
- Tab přepínání → CSS `:checked + label` pattern

**`tester-seo-geo` v testovací fázi vypne JS a ověří že web funguje.**

### 3. Cache pravidla

```ts
// app/rozvrh/page.tsx
export const dynamic = 'force-dynamic'  // VŽDY čerstvá data, žádný cache
export const revalidate = 0
```

**Stránky které musí mít `force-dynamic`:**
- `/rozvrh` — rozvrh se mění během dne
- `/divky` (s parametry) — status `available` je live
- `/profil/{slug}` — status pill na fotce je live
- Vše pod `/admin/*` a `/studio/*`

**Stránky které SMÍ být statické (ISR ok):**
- `/cenik`, `/slevy`, `/faq`, `/o-nas`, `/podminky`, `/soukromi`
- `/blog/*`, `/hashtag/{slug}` (revalidate na hodiny)

### 4. Rozvrh — minulost neexistuje

- Veřejný `/rozvrh`: default tab = **dnes**, tabs = **dnes + 6 dní dopředu**
- URL `?day=YYYY-MM-DD` před dneškem → server **redirect na dnešek**
- Studio + Admin: kalendář override editor → minulé dny **disabled**
- Cron job 03:00 každý den: `DELETE FROM today_overrides WHERE date < CURRENT_DATE`

### 5. Praha timezone

Status karty (`pracuje teď` / `začíná v 18:00` / `skončila`) se počítá na serveru v **Europe/Prague** zóně, ne v UTC ani v zóně serveru.

### 6. Secretstory — read-only

- Lze číst (`Read /Users/lunagroup/Secretstory/...`) jako reference pro logiku
- **Nikdy neportujeme React kód 1:1** — píšeme server-side ekvivalent
- **Nikdy nekopírujeme `'use client'` komponenty**
- Secretstory NIKDY needitujeme

---

## Workflow

Spusť **`/team`** pro řízenou implementaci:

```
1. KONZULTACE   → logik + skeptic + seo-master + geo-master (paralelně, kladou otázky)
                  ↓ [uživatel schválí brief]
2. PLÁN         → logik navrhne → skeptic/seo/geo doplní paralelně
                  ↓ [uživatel schválí plán]
3. IMPLEMENTACE → programator-junior píše draft → programator (senior) reviewuje
                  ↓
4. TESTY        → tester-funkcni ‖ tester-regrese ‖ tester-seo-geo (paralelně)
                  ↓
5. FIX LOOP     → senior opraví nálezy → testeři znovu paralelně (max 3 kola)
                  ↓
6. PŘEDÁNÍ      → souhrn + dotaz na commit
```

---

## Implementační pořadí (high level)

Klient si přeje **vizuální hotovost první** (aby viděl jak to vypadá), pak teprve admin/funkce.

### Sprint 1 — Vizuál + reálná data ze Secretstory
- Setup Next.js 16 projektu
- Design tokens podle mockupů (CSS variables ze `_combined.html`)
- Layout shell (header, footer, nav, topbar)
- **Data import:** jednorázový dump ze Secretstory Turso DB → vlastní Turso DB pro ESCX23
- Statické stránky: homepage, /divky, /profil/{slug}, /cenik, /faq, /slevy, /rozvrh, /recenze
- Stránky čtou ze **své** DB (po importu)
- Cíl: web vypadá 1:1 jako mockupy, server-side, funguje bez JS, **s reálnými profily, fotkami, službami, cenami, recenzemi**

#### Data mapping ze Secretstory → ESCX23

**Importujeme (mapping podle ZADANI.md sekce 4):**

| Secretstory tabulka | ESCX23 tabulka | Co tam je |
|---|---|---|
| `girls` | `companions` | profily dívek |
| `girl_photos` | `photos` | fotky |
| `girl_videos` | `videos` | videa |
| `girl_services` | `companion_services` | co každá dívka dělá |
| `girl_schedules` | `availability` | týdenní default rozvrh |
| `schedule_exceptions` | `today_overrides` | denní override |
| `girl_applications` | `companion_applications` | žádosti dívek |
| `locations` | `locations` + `companion_locations` (M:N) | pobočky |
| `services` | `services` | katalog služeb |
| `pricing_plans` | `programs` | časové programy 30/45/60/90/120 |
| `pricing_extras` | `extras` | příplatky |
| `pricing_plan_features` | (zahrnout do `programs`) | featury programů |
| `bookings` | `bookings` | rezervace |
| `reviews` | `reviews` | recenze |
| `review_helpful_votes` | (denormalizovat do `reviews.helpful_count`) | hlasy |
| `discount_codes` + `discounts` | `discounts` | slevy |
| `faq_items` | `faq_items` | FAQ |
| `loyalty_tiers` | (zabudovat do `members.tier`) | věrnostní tieru |
| `notifications` | `notifications` | notifikace |
| `users` | `users` | login účty |

**NEimportujeme (cruft co klient nechtěl):**
- `analytics_events` (použít Plausible/GA)
- `blog_posts`, `blog_tags`, `blog_post_tags` (zatím přeskočit, blog v pozdějším sprintu)
- `copywriters` (správa copywriterů — nepotřebné)
- `google_calendar_tokens` (komplikace navíc)
- `landing_pages` (vlastní CMS — Next.js metadata API stačí)
- `oauth_states` (řeší NextAuth)
- `seo_metadata` (Next.js `generateMetadata()` to dělá bez DB)

**Po importu si zachováme původní Secretstory data jako zálohu** (`docs/secretstory-dump-{timestamp}.sql`).

### Sprint 2 — DB + Prisma + dynamic data
- Prisma schema podle ZADANI.md sekce 4
- Seed s 13 dívkami z mockupů
- Stránky čtou z DB
- Filtry přes URL params

### Sprint 3 — Studio (samoobsluha pro dívky)
- Auth
- /studio/* stránky podle ZADANI.md sekce 10
- Photo upload pipeline
- **Schedule editor** — UX podle Secretstory adminu, server-side

### Sprint 4 — Admin panel
- /admin/* podle ZADANI.md sekce 11
- Verifikace fotek
- CMS pro homepage

### Sprint 5 — Members + Booking
- Member application flow
- VIP area
- WhatsApp deep links

### Sprint 6 — Polish
- Cron jobs
- SEO (sitemap, llms.txt, structured data)
- 18+ age gate
- GDPR

---

## Tým (`.claude/agents/`)

| Agent | Role |
|---|---|
| `logik` | Konzultace, plánování, brief |
| `skeptic` | Devil's advocate — napadá plány |
| `seo-master` | Klasické SEO (title, meta, schema, sitemap, CWV) |
| `geo-master` | GEO — optimalizace pro AI vyhledávače (llms.txt, FAQ, citace) |
| `programator-junior` | První draft kódu |
| `programator` | Senior — review juniora + fix po testerech |
| `tester-funkcni` | Akceptační kritéria + happy path |
| `tester-regrese` | Co se rozbilo, build, lint, types |
| `tester-seo-geo` | Audit že SEO/GEO spec je v kódu + že web funguje bez JS |

## Pravidla orchestrace
- **Implementor je předposlední** v řetězci — po něm jdou testeři, pak fix loop, pak teprve commit
- **Junior píše vždy první draft**, senior reviewuje
- **Tři testeři vždy paralelně**
- **Bez explicitního OK od uživatele se necommituje**

---

## Spuštění

```bash
cd ~/Desktop/ESCX23
claude
# pak:
/team Začni Sprint 1 — postav vizuální verzi webu podle mockupů. Server-side, hardcoded data zatím.
```

Nebo dvojklik na `~/Desktop/ESCX23/start.command`.
