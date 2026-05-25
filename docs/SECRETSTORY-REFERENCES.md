# Secretstory — read-only reference

Secretstory (`~/Secretstory/`, repo `JevgOne/Secretstory`) je **client-side React/Next.js** verze webu LovelyGirls.cz. **NEKOPÍRUJEME ji**, ale můžeme z ní **číst** logiku jako referenci.

## Pravidla

1. **Žádný kód ze Secretstory se nekopíruje 1:1.** Píšeme nový server-side ekvivalent.
2. **Žádný `'use client'` kód neportujeme.** V ESCX23 je default Server Component.
3. Z Secretstory si bereme: **datovou logiku, DB struktury, regex/validace, business pravidla, email šablony, upload pipeline, UX vzory** (jako designový vzor, ne jako kód).
4. Pokud máš pochybnost zda kód portovat, zeptej se uživatele.

---

## Užitečné soubory pro referenci

### Schedule / Rozvrh (klíčová feature, klient na to upozornil)

| Soubor | Co tam najdeš |
|---|---|
| `~/Secretstory/schema-schedules.sql` | Tabulky `girl_schedules` (týdenní default) + `schedule_exceptions` (výjimky). V ESCX23 = `availability` + `today_overrides`. |
| `~/Secretstory/app/[locale]/schedule/page.tsx` | **Server-side data fetch** — dobře udělané. Praha timezone, status `working`/`later`, photo map, ISR `revalidate=1`. **Tuto logiku portujeme.** |
| `~/Secretstory/app/[locale]/schedule/ScheduleClient.tsx` | Client UI (tohle **NE**portujeme — předěláme na server-side). |
| `~/Secretstory/app/(admin)/admin/schedules/page.tsx` | **Admin UX zadávání rozvrhu** — workflow ve 4 krocích (dívka → pobočka → dny multi-select → presety + manual time). **Klient si tento UX přeje zachovat.** Předěláme na form POST (server-side) ale UX zachováme. |
| `~/Secretstory/app/api/admin/schedules/route.ts` | API endpoint — užitečné pro pochopení jak se data ukládají. |
| `~/Secretstory/app/api/admin/girls/[id]/schedule/route.ts` | Per-girl schedule editor logika. |

### Auth + bcrypt
- `~/Secretstory/auth.ts`, `~/Secretstory/auth.config.ts` — NextAuth v5 setup
- `~/Secretstory/scripts/create-admin.ts` — bcrypt cost, password hashing pattern

### Photo upload pipeline
- `~/Secretstory/lib/` — hledat `image`, `photo`, `upload`, `watermark`
- `~/Secretstory/app/api/` — upload endpoints (magic bytes validation, EXIF strip)

### Email
- `~/Secretstory/lib/` — Resend client setup
- Email templates (welcome, password reset, booking confirmation)

### DB struktura (core tabulky)
- `~/Secretstory/schema-tables.sql` — users, girls, services, bookings, reviews, notifications
- `~/Secretstory/schema-indexes.sql` — performance indexes
- `~/Secretstory/migrations/*` — historické migrace (užitečné jako učebnice "jak se to vyvíjelo")

### CO NEpřejímat
- `~/Secretstory/app/(admin)/admin/blog/` — blog systém (zadání to nepožaduje)
- `~/Secretstory/app/(admin)/admin/copywriters/` — správa copywriterů (zbytečné)
- `~/Secretstory/app/(admin)/admin/cms/landing-pages/` — vlastní CMS (přeskakujeme)
- `~/Secretstory/lib/blog-scheduler.ts` — blog scheduling
- Vše s `vibe`, `analytics_events`, `google_calendar_integration`

---

## Co programátor v ESCX23 udělá při portování

Když narazíš na úkol z fáze 1-8 zadání:

1. **Otevři odpovídající soubor v Secretstory** — `Read /Users/lunagroup/Secretstory/...`
2. **Pochop logiku** — co dělá, jaký je business flow, jaké jsou edge cases
3. **Napiš nový kód** v ESCX23 server-side stylem (Server Components, form POST, žádný useState pro data)
4. **Drž design** podle mockupů v `~/Desktop/ESCX23/mockups/`
5. **Drž data model** podle `~/Desktop/ESCX23/docs/ZADANI.md`

Secretstory nikdy needitujeme. Změny děláme jen v `~/Desktop/ESCX23/`.
