# LovelyGirls Praha — Kompletní zadání pro programátorskou AI

> **Tohle je definitivní specifikace.** Server-rendered web pro premium escort agenturu v Praze. Kompletní popis funkcí, datový model, UI komponenty, admin/studio flows.

> **Mockupy jsou v `lovely-prague-mockup.zip`** — 19 HTML souborů. Použij je jako vizuální referenci a respektuj design přesně.

---

# OBSAH

1. [Stack pravidla](#1-stack-pravidla)
2. [Architektura webu (URL routing)](#2-architektura-webu-url-routing)
3. [Uživatelské role](#3-uživatelské-role)
4. [Datový model](#4-datový-model)
5. [Karta dívky — single source of truth](#5-karta-dívky--single-source-of-truth)
6. [Profil dívky (detail)](#6-profil-dívky-detail)
7. [Homepage struktura](#7-homepage-struktura)
8. [Listing /divky s filtry](#8-listing-divky-s-filtry)
9. [Rozvrh — kompletní logika](#9-rozvrh--kompletní-logika)
10. [Studio — samoobsluha pro dívky](#10-studio--samoobsluha-pro-dívky)
11. [Admin panel](#11-admin-panel)
12. [Member systém (VIP)](#12-member-systém-vip)
13. [Booking flow (WhatsApp/Telegram)](#13-booking-flow-whatsapptelegram)
14. [Foto upload pipeline](#14-foto-upload-pipeline)
15. [Stories systém](#15-stories-systém)
16. [Hashtag SEO stránky](#16-hashtag-seo-stránky)
17. [Multi-language](#17-multi-language)
18. [Cron jobs](#18-cron-jobs)
19. [Bezpečnost](#19-bezpečnost)
20. [Design tokens](#20-design-tokens)
21. [Implementační pořadí (krok za krokem)](#21-implementační-pořadí-krok-za-krokem)

---

# 1. STACK PRAVIDLA

## Pevná pravidla
- **Server-side rendered** — každá stránka je HTML pošle server, browser ho jen zobrazí
- **Žádný klient framework** (žádný React, Vue, Next.js, Astro, Svelte)
- **Funguje s vypnutým JS** — Google bot vidí celé HTML
- **JavaScript je opt-in** pro UX bonusy (lightbox animace), ale stránka **musí fungovat bez něj**
- **Filtry přes URL parametry** — submit = full page reload
- **Multi-language** od začátku (CS / EN / DE / UK)

## Doporučené stacky (volba na tobě)
- **PHP + Twig** + Symfony / Laravel
- **Node.js + Express + EJS** (nebo Pug, Handlebars)
- **Python + Flask/Django + Jinja2**
- **Go + html/template**
- **Ruby on Rails**

## Databáze
- **PostgreSQL** (preferred), **MySQL**, nebo **SQLite/libSQL** (Turso)

## Storage fotek
- Lokální disk pro dev
- **S3-compatible** pro produkci (Cloudflare R2, AWS S3, Backblaze B2)

## Email
- Transactional service (Resend, Postmark, AWS SES)

## Hosting
- VPS (Hetzner ~5€/měsíc) nebo PaaS (Railway, Fly.io, Render)

---

# 2. ARCHITEKTURA WEBU (URL ROUTING)

## Veřejné stránky

| URL | Co dělá |
|-----|---------|
| `/` | Homepage |
| `/divky` | Listing všech LIVE dívek s filtry |
| `/divky?status=available&loc=vinohrady&hair=blond` | Filtered listing (URL params) |
| `/profil/{slug}` | Detail dívky (slug = "nika", "katy", ...) |
| `/cenik` | Společný ceník (programy + extras) |
| `/rozvrh` | Rozvrh — pobočky pills + den tabs + grid karet |
| `/rozvrh?location=vinohrady&day=2026-05-08` | Filtered rozvrh |
| `/slevy` | Slevy a balíčky |
| `/faq` | FAQ s rozbalovacími otázkami |
| `/recenze` | Všechny recenze |
| `/recenze?girl=nika` | Recenze konkrétní dívky |
| `/hashtag/{tag-slug}` | SEO listing podle tagu |
| `/blog` | Blog |
| `/blog/{slug}` | Article detail |
| `/kontakt` | Kontakt (WhatsApp/Telegram/Phone) |
| `/o-nas` | O nás |
| `/podminky` | Obchodní podmínky |
| `/soukromi` | GDPR / Privacy policy |

## Member area (VIP klienti)

| URL | Co dělá |
|-----|---------|
| `/clenstvi/zadost` | Žádost o členství (anonymní formulář) |
| `/clenstvi/login` | Přihlášení |
| `/clenstvi/logout` | Odhlášení |
| `/clenstvi/zapomenute-heslo` | Reset hesla |
| `/vip` | Dashboard po loginu |
| `/vip/divky` | Listing včetně skrytých profilů |
| `/vip/profil/{slug}` | Profil s odemčenými privátními galeriemi |
| `/vip/slevy` | Member-only slevy |
| `/vip/historie` | Historie rezervací |

## Studio (samoobsluha pro dívky)

| URL | Co dělá |
|-----|---------|
| `/studio/login` | Přihlášení dívky |
| `/studio/logout` | Odhlášení |
| `/studio` | Dashboard s % completion + quick actions |
| `/studio/zakladni` | Základní info (jméno, věk, lokace) |
| `/studio/telo` | Tělesné parametry |
| `/studio/zivotni-styl` | Životní styl (národnost, vzdělání, ...) |
| `/studio/jazyky` | Jazyky a úrovně |
| `/studio/sluzby` | Služby co dělá / nedělá |
| `/studio/cenik` | Vlastní ceník (override společného) |
| `/studio/dostupnost` | 3 sekce: Dnes panel + týdenní default + kalendář override |
| `/studio/lokace` | Hlavní apartmán + alternativy |
| `/studio/fotky` | Upload fotek + organizace do setů |
| `/studio/sety` | CRUD photo sets |
| `/studio/stories` | CRUD stories (24h auto-expire) |
| `/studio/recenze` | Vidět svoje recenze |
| `/studio/rezervace` | Vidět booking requesty |
| `/studio/profil-status` | Live / Pause / VIP only toggle |

## Admin panel

| URL | Co dělá |
|-----|---------|
| `/admin/login` | Admin přihlášení |
| `/admin` | Dashboard s KPI |
| `/admin/divky` | Seznam všech dívek |
| `/admin/divky/nova` | Onboarding nové dívky |
| `/admin/divky/{id}/edit` | Edit dívky (override) |
| `/admin/divky/{id}/dostupnost` | Editovat rozvrh dané dívky |
| `/admin/divky/{id}/fotky` | Schvalování fotek |
| `/admin/divky/{id}/cenik` | Edit ceník per dívka |
| `/admin/verifikace` | Fronta čekajících fotek (všechny dívky) |
| `/admin/stories` | Všechny stories + create category |
| `/admin/recenze` | Schvalování recenzí |
| `/admin/rezervace` | Všechny rezervace |
| `/admin/clenove` | Members + pending applications |
| `/admin/clenove/{id}` | Detail člena |
| `/admin/pobocky` | Správa apartmánů |
| `/admin/pobocky/nova` | Nová pobočka |
| `/admin/cenik` | Společný ceník (programy + extras) |
| `/admin/slevy` | Správa slev |
| `/admin/faq` | CRUD FAQ otázek |
| `/admin/blog` | Blog CRUD |
| `/admin/cms/homepage` | Editor homepage textů |
| `/admin/cms/stranky` | Static pages (CS/EN/DE/UK) |
| `/admin/audit` | Searchable log změn |
| `/admin/nastaveni` | Tabbed: Brand / i18n / Email / Bezpečnost |
| `/admin/uzivatele` | User CRUD (jen owner) |

---

# 3. UŽIVATELSKÉ ROLE

| Role | Přihlášení | Co může |
|------|-----------|---------|
| **VEŘEJNÝ NÁVŠTĚVNÍK** | nepotřeba | Browse, filtry, kontakt přes WhatsApp |
| **DÍVKA (companion)** | `/studio/login` | Spravovat svůj profil, fotky, dostupnost |
| **VIP ČLEN** | `/clenstvi/login` | Skryté profily, privátní galerie, slevy |
| **ADMIN / OWNER** | `/admin/login` | Override všeho, schvalování, CMS |

## Auth implementace
- **Cookies session-based** (HTTP-only, Secure, SameSite=Lax)
- **Heslo bcrypt cost 12+** nebo Argon2
- **Reset hesla** přes email link (token expiruje za 1h)
- **Rate limit** auth endpointů (5 pokusů / 15 min per IP)
- **CSRF tokeny** na všech POST formech

---

# 4. DATOVÝ MODEL

## Hlavní tabulky

### `users` (login pro všechny role)
```
id              PK
email           UNIQUE
password_hash   (bcrypt/argon2)
role            ENUM(OWNER, ADMIN, COMPANION, MEMBER)
companion_id    FK → companions.id (nullable)
member_id       FK → members.id (nullable)
last_login_at   TIMESTAMP
created_at, updated_at
```

### `companions` (dívky — hlavní entita)

**Identita:**
```
id, slug (UNIQUE pro URL), name, age, age_display
tagline (max 80 chars), bio (long text), bio_intro (highlighted first sentence)
gender (FEMALE only for LovelyGirls)
```

**Tělo & vzhled:**
```
height_cm, weight_kg
bust_size_number (1-5, displays as just "1", "2", ... in card)
bust_natural BOOL
eyes (Hnědé, Modré, Zelené, Hazelové, Šedé)
hair_color (Brunetka, Blond, Zrzka, Černá, Mahagonová)
hair_length (Krátké, Polodlouhé, Dlouhé)
skin_tone (Světlá, Pleťová, Olivová, Opálená)
body_type (Štíhlá, Drobná, Křivky, Atletická, ...)
tattoos (Ne, Diskrétní, "Tetování celé tělo")
piercings (Ne, Uši, Pupík, "Pupík, uši", ...)
```

**Životní styl:**
```
nationality, origin_city, education, profession
smoker (Nekouří, Společensky, Kuřačka)
drinks (Nepije, Příležitostně, Společensky)
orientation (Heterosexuální, Bisexuální)
```

**Status & visibility:**
```
status ENUM(DRAFT, LIVE, PAUSED, ARCHIVED)
verified BOOL, verified_at
vip BOOL                         (TOP holky — gold pill)
is_new BOOL                      (NEW pill — auto if created < 30 days)
vip_only_profile BOOL            (skrytý profil jen pro členy)
vip_only_galleries BOOL          (privátní galerie pro členy)
```

**Stats (denormalized, recalc nightly):**
```
profile_views, total_bookings
rating_avg DECIMAL, reviews_count
```

**Timestamps:**
```
created_at, updated_at
```

### `locations` (pobočky / apartmány)
```
id, slug ("vinohrady", "karlin")
name_cs, name_en, name_de, name_uk
district ("Praha 2 · Vinohrady")
description (popis pobočky)
address (interní, NE veřejné)
lat, lng (pro mapu — volitelně)
photos JSON (array URL)
features JSON (Soukromý vchod, Sprcha, Parking, ...)
hours_from, hours_to
status ENUM(ACTIVE, INACTIVE)
display_order INT
```

### `companion_locations` (M:N)
```
companion_id FK
location_id FK
is_primary BOOL                 (hlavní apartmán)
```

### `companion_languages` (M:N s úrovní)
```
companion_id FK
language_code (cs, en, de, uk, fr, it, es, ru, ...)
level ENUM(NATIVE, FLUENT, CONVERSATIONAL, BASIC)
```

### `photos`
```
id, companion_id FK, photo_set_id FK (nullable)
url_thumb, url_medium, url_full
watermarked BOOL, exif_stripped BOOL
approval_status ENUM(PENDING, APPROVED, REJECTED)
approved_by_user_id FK, rejection_reason
caption, display_order
created_at
```

### `photo_sets`
```
id, companion_id FK
name ("Spring 2026", "Editorial", "Casual", "Lingerie", "Private")
visibility ENUM(PUBLIC, VIP, PRIVATE)
cover_photo_id FK
display_order
```

### `videos`
```
id, companion_id FK
url, thumbnail_url
duration_seconds
approval_status
created_at
```

### `tags` (hashtagy pro SEO)
```
id, slug ("blondynky-praha", "milf", "gfe")
name ("Blondýnky Praha", "MILF", "GFE")
description (SEO popis pro hashtag stránku)
meta_title, meta_description
```

### `companion_tags` (M:N)

### `services`
```
id, slug, name_cs, name_en, name_de, name_uk
category ENUM(INCLUDED, EXTRA, ON_REQUEST, NOT_OFFERED)
default_extra_price DECIMAL (pro EXTRA)
display_order
```

### `companion_services` (M:N s override)
```
companion_id FK, service_id FK
category (override default)
extra_price (override default)
```

### `programs` (časové programy)
```
id, slug ("plny-vibe", ...)
duration_minutes
name_cs, name_en, name_de, name_uk
default_price_czk DECIMAL
is_featured BOOL ("Nejoblíbenější")
display_order
```

### `companion_programs` (override per dívka)
```
companion_id FK, program_id FK
price_czk (override)
is_offered BOOL
```

### `extras` (příplatky)
```
id, slug, name_*, description_cs
default_price_czk
is_negotiable BOOL ("domluva")
display_order
```

### `companion_extras` (M:N)

### `availability` (týdenní default)
```
id, companion_id FK
day_of_week (0-6, neděle=0)
time_from ("10:00"), time_to ("22:00")
is_off BOOL
default_location_id FK
```

### `today_overrides` (denní override)
```
id, companion_id FK
date DATE
status ENUM(AVAILABLE, BY_APPOINTMENT, OFF)
time_from, time_to
location_id FK
notes
```

### `bookings`
```
id, companion_id FK
channel ENUM(WHATSAPP, TELEGRAM, PHONE, EMAIL)
client_contact (anonymized)
program_id FK
extras JSON
proposed_date DATETIME
duration_minutes
location_id FK
status ENUM(REQUESTED, CONFIRMED, DECLINED, COMPLETED, CANCELLED)
notes
created_at, updated_at
```

### `reviews`
```
id, companion_id FK
client_nickname ("Petr", "M z HK")
rating 1-5
title, text
mood_emoji
tags JSON (["🧘 Uvolněná", "🤗 Přátelská"])
helpful_count
status ENUM(PENDING, APPROVED, REJECTED)
featured BOOL
created_at
```

### `members` (VIP klienti)
```
id, user_id FK
member_number ("LG-2026-0042")
tier ENUM(STANDARD, VIP, RETURNING)
status ENUM(PENDING_APPLICATION, ACTIVE, SUSPENDED, EXPIRED)
application_data JSON (jméno, kontakt — encrypted)
notes (admin)
loyalty_visit_count
loyalty_discount_pct (auto-calculated)
joined_at, last_visit_at
```

### `member_applications`
```
id, email, name, contact_phone, reason
status ENUM(PENDING, APPROVED, REJECTED)
created_at
```

### `stories`
```
id, type ENUM(COMPANION, CATEGORY)
companion_id FK (if COMPANION)
category ENUM(NEW_THIS_WEEK, MEMBERS_CIRCLE, AVAILABLE_TONIGHT, PROMO, TRAVEL)
background_type ENUM(PHOTO, COLOR, VIDEO)
background_url / background_color
caption
cta_type ENUM(VIEW_PROFILE, CONTACT, BROWSE, NONE)
cta_url
views
expires_at DATETIME (24h)
status ENUM(LIVE, EXPIRED, REJECTED, PENDING)
```

### `discounts`
```
id, slug, name_*, description
amount_type ENUM(PERCENT, FIXED)
amount_value DECIMAL
conditions JSON
is_featured BOOL, is_active BOOL
display_order
```

### `faq_items`
```
id, question_*, answer_* (HTML)
category, display_order, is_active
```

### `homepage_content` (singleton)
```
hero_copy_*, featured_girl_ids JSON, featured_new_girl_id
trust_strip_items JSON, hashtag_cloud_count INT
```

### `static_pages` (CMS)
```
slug, title_*, content_* (HTML)
meta_title, meta_description, updated_at
```

### `audit_log`
```
id, user_id FK, action, entity_type, entity_id
changes JSON (diff), ip_hash, user_agent, created_at
```

### `site_settings` (singleton)
```
brand_name, tagline, phone_number
whatsapp_number, telegram_handle, email
business_hours, default_language, available_languages JSON
```

---

# 5. KARTA DÍVKY — SINGLE SOURCE OF TRUTH

> **KRITICKÉ: Karta dívky musí být úplně stejná všude — homepage, listing, rozvrh, hashtag stránky.** Nikdy ji nepředělávej per stránku. Implementuj jako jeden partial / komponentu.

## Anatomie karty

```
┌──────────────────────────────┐
│ ★ VIP             ▶3  📷18  │  ← top row pills
│                              │
│                              │
│         FOTKA 4:5            │
│                              │
│                              │
│ 10:00 — 22:00          ♡    │  ← bottom: time pill + heart
└──────────────────────────────┘
● Nika                    28    ← jméno (s zelenou pulzující tečkou) + věk coral
📍 Praha · Vinohrady             ← adresa šedá
─────────────────────────────
 162  |  50  |  2               ← čísla coral
  cm     kg    bust              ← jednotky bílé
─────────────────────────────
```

## HTML šablona

```html
<a href="/profil/{slug}" class="girl-card" data-status="available">
  <div class="girl-photo-wrap">
    <img src="{photo_url}?w=600&h=750&fit=crop&q=80" alt="{name}">
    
    <!-- Top-left: hero tag pill (VIP / NEW / DINNER / BUSINESS) -->
    {if vip}<span class="girl-tag-pill vip">★ VIP</span>{/if}
    {if is_new}<span class="girl-tag-pill new">NEW</span>{/if}
    
    <!-- Top-right: media pills -->
    <div class="girl-media-pills">
      {if videos > 0}
        <span class="girl-media-pill">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>{videos}
        </span>
      {/if}
      <span class="girl-media-pill">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>{photos}
      </span>
    </div>
    
    <!-- Bottom-left: time pill (only when AVAILABLE) -->
    {if status == AVAILABLE}
      <span class="girl-photo-time">{time_from} — {time_to}</span>
    {else}
      <span class="girl-photo-time away">Domluva</span>
    {/if}
    
    <!-- Bottom-right: heart -->
    <span class="girl-heart">♡</span>
  </div>
  
  <div class="girl-info">
    <!-- Name row: pulsing dot + name + age -->
    <div class="girl-name-row">
      <div class="girl-name-left">
        <span class="girl-online-dot"></span>
        <span class="girl-name">{name}</span>
      </div>
      <span class="girl-age">{age}</span>
    </div>
    
    <!-- Address -->
    <div class="girl-loc-row">
      <span>📍</span>
      <span>Praha · {primary_location_name}</span>
    </div>
    
    <!-- Statline: cm | kg | bust -->
    <div class="girl-statline">
      <div class="girl-stat-cell">
        <span class="num coral">{height}</span><span class="label">cm</span>
      </div>
      <div class="girl-stat-cell">
        <span class="num coral">{weight}</span><span class="label">kg</span>
      </div>
      <div class="girl-stat-cell">
        <span class="num coral">{bust_number}</span><span class="label">bust</span>
      </div>
    </div>
  </div>
</a>
```

## CSS pravidla

- **Aspect 4:5** pro fotku
- **Border-radius 14px** pro celou kartu
- **Hover:** border coral + lift translateY(-2px)
- **Časový pill na fotce:** černý semi-transparent (`rgba(0,0,0,0.7)`), backdrop-filter blur, border zelený `rgba(34,197,94,0.4)`, text `#4ade80`, padding 5px 11px, border-radius 999px
- **Online dot před jménem:** 10×10px, zelený `#22c55e`, ring-pulse animace 2s
- **Statline:** 3 cells s vertikálními dividery, čísla coral velké, písmena dim malé, background `rgba(255,255,255,0.03)`, border subtle
- **Mobile (≤768px):** 2 sloupce, kompaktnější padding/font-size, ale **stejný design**

## Stavové varianty

| Stav | Pill na fotce | Tečka před jménem |
|------|---------------|-------------------|
| AVAILABLE | "10:00 — 22:00" zelený border | Zelená pulzující |
| AWAY (domluva) | "Domluva" šedý border | Šedá statická |
| OFF (nezobrazí se) | — | — |

## Reference v mockupu

Podívej se na `index.html`, `divky.html`, `rozvrh.html` v balíčku — všechny mají bit-by-bit identické karty.

---

# 6. PROFIL DÍVKY (DETAIL)

## URL: `/profil/{slug}`

## Layout (2-column grid na desktopu, 1-col na mobilu)

### Levý sloupec (sticky, 40% width)
1. **Velká fotka 4:5** (hero photo)
   - VIP badge (vlevo nahoře, jen pro VIP)
   - Share + Heart action buttons (vpravo nahoře)
   - Photo pager dots (5 čar dole)
2. **Verified strip** "Fotky ověřené LovelyGirls · datum"
3. **Thumbnail řada 5 fotek** pod hlavní fotkou

### Pravý sloupec (60% width)
**Pořadí sekcí:**

1. **Header status row** — ✓ Verified zelený + ★★★★★ + 4.9 · 87 recenzí
2. **H1 jméno + věk pill** — `Nika` velký + `28` v coral pillu
3. **📍 Lokace badge** — coral pill s map ikonou + "Praha · Vinohrady"
4. **Compact info card** (8 řádků):
   - Výška / Váha (coral) / Prsa / Oči / Vlasy / Pleť / Tetování / Piercing
5. **Status badge** — "Dnes 10:00 — 22:00" zelený / "Domluva předem" šedý
6. **Bio** — zvýrazněná první věta v coral, pak normální text
7. **3 CTA tlačítka:**
   - **WhatsApp** (zelený `#25D366`, bílý text + WA logo)
   - **Telegram** (modrý `#229ED9`, bílý text + TG logo)
   - **Zavolat** (ghost outline)
8. **Životní styl karta** — Národnost / Původ / Vzdělání / Profese / Kuřačka / Alkohol / Orientace (coral)
9. **Kde ji najdeš** — coral pill (hlavní apartmán) + outline pills (alternativy) + meta "Adresu obdržíš po potvrzení termínu"
10. **Jazyky** — vlajka + jméno + level badge (Rodný / Plynně / Základy)
11. **Služby & zkušenosti** — *bude doplněno seznamem od majitele*
12. **Osobnost** — 3 sloupce chips (Komunikace / Společenská / Povaha)
13. **Galerie 6-col** — 12 thumbs + locked cells (VIP only) s lock ikonou
14. **Ceník programů** — 5 programů (30/45/60/90/120), 60min "Plný vibe" s coral border
15. **Recenze** — 2-3 nahoře + link "Zobrazit všechny recenze (87) →"
16. **Members teaser** — pokud `vip_only_galleries` true, banner "Stálí klienti mají přístup k rozšířené galerii"
17. **Sticky bottom bar** — Jméno · věk · lokace · status + 3 CTA (WhatsApp/Telegram/Zavolat)

## Reference v mockupu

`profil-{slug}.html` × 13 souborů. Otevři `profil-nika.html` jako příklad.

---

# 7. HOMEPAGE STRUKTURA

## URL: `/`

### Sekce v pořadí:
1. **Topbar** (nad headerem):
   - "✓ Ověřené profily · 🔒 Diskrétní apartmány" vlevo
   - Language switch (CS / EN / DE / UK) vpravo
   - Telefon vpravo
2. **Header**: Logo + Nav + 2 CTA (Telegram, WhatsApp)
3. **Hero** — velký nadpis + tagline + 3 CTA tlačítka
4. **"Nově na webu" featured** — velká karta jedné nové dívky (admin výběr)
5. **"Naše dívky" grid** — 4 karet (admin výběr `featured_girl_ids`)
6. **Activity feed** — "Co se právě děje u našich dívek"
   - "Jessica přidala 4 nové fotky do galerie · před 6 dny"
   - "Eliška přidala novou fotku do galerie · před 14 dny"
   - "Luna obdržela novou 5★ recenzi · před 1 týdny"
7. **Recenze trust strip** — 3 placeholder reviews
8. **Hashtag cloud** — auto-generated z popular tags
9. **Pobočky** — 3-4 karty s fotkami apartmánů
10. **3 kroky kontaktu** — "1. Vyber holku · 2. Napiš na WhatsApp · 3. Užijte si"
11. **Footer**

## Reference

`index.html` v mockupu.

---

# 8. LISTING /DIVKY S FILTRY

## URL pattern

```
/divky
/divky?status=available
/divky?location=vinohrady
/divky?hair=blond
/divky?bust=2,3
/divky?body=slim,curvy
/divky?lang=cs,en,de
/divky?age_min=20&age_max=30
/divky?height_min=160&height_max=175
/divky?tag=GFE
/divky?sort=recommended (default) | newest | available_first
/divky?q=nika (search)
/divky?page=2
```

## Server logika

```
GET /divky?<params>:
  query = SELECT * FROM companions WHERE status='LIVE'
  
  IF status='available':
    join with today_overrides + availability, filter by today's status
  IF location:
    join with companion_locations
  IF hair, body, bust, etc.:
    where companions.* matches
  IF lang:
    join with companion_languages
  IF tag:
    join with companion_tags
  
  ORDER BY <sort field>
  LIMIT 12 OFFSET (page-1)*12
  
  render listing.html with filters preserved in form state
```

## UI filtry

**Quick filter pills** (klikací, multi-select):
- ● Online | ● Domluva | ★ VIP | ✨ Nové | Top hodnocené | S videem

**Detail filtry** (rozbalovací sidebar nebo modal):
- Věk (slider 18-50)
- Výška (slider 150-185)
- Váha (slider 45-80)
- Pobočka (multi-select)
- Vlasy (Brunetka / Blond / Zrzka / Černá)
- Postava (Štíhlá / Drobná / Křivky / Atletická)
- Prsa (1, 2, 3, 4, 5)
- Jazyky (multi-select)
- Tagy (multi-select)

**Sort dropdown:**
- Doporučené (default — admin curation)
- Nejnovější
- Online první

**Search input** — fulltext po jméně, lokaci, tagu, tagline.

**Vše přes URL params** = sdílení odkazu na konkrétní filtr funguje. Submit přes form GET (žádný JS).

## Reference

`divky.html` v mockupu.

---

# 9. ROZVRH — KOMPLETNÍ LOGIKA

## Tohle je klíčová funkce

Veřejný `/rozvrh` ukáže klientům **kdo kdy pracuje**. Zdroje dat jsou **DVA**: týdenní default + denní override.

## Datové zdroje (hierarchie)

### 1. `availability` table — týdenní default
- Per dívka má 7 řádků (Po—Ne)
- Pole: `day_of_week`, `time_from`, `time_to`, `is_off`, `default_location_id`
- Tohle je "co normálně dělám každý týden"

### 2. `today_overrides` table — denní override
- Per dívka per konkrétní DATE
- Pole: `date`, `status`, `time_from`, `time_to`, `location_id`, `notes`
- Tohle je "tenhle konkrétní den dělám něco jiného"

## Pravidlo zobrazení

```
Pro každý (datum, dívka):
  IF existuje today_override:
      použij override
  ELSE:
      použij availability default pro day_of_week
```

## Studio `/studio/dostupnost` — 3 sekce na jedné stránce

### A. "Dnes" panel (nahoře, velký)

```
┌──────────────────────────────────────────┐
│ DNES — Pátek 8. května 2026              │
│                                          │
│ ● Online · 10:00 — 22:00 · Vinohrady    │
│                                          │
│ [Změnit dnes] [Volno do konce dne]      │
└──────────────────────────────────────────┘
```

Klik na "Změnit dnes" → modal:

```
┌─────────────────────────────────────┐
│ Pátek 8. května                     │
│                                     │
│ Status:                             │
│ ( ) Online                          │
│ (●) Online (jiný čas)               │
│ ( ) Domluva předem                  │
│ ( ) Volno                           │
│                                     │
│ Od: [10:00]  Do: [22:00]            │
│ Pobočka: [Vinohrady ▼]              │
│ Poznámka: [_____________]           │
│                                     │
│ [Zrušit]  [Uložit pro dnes]         │
└─────────────────────────────────────┘
```

Uložit → INSERT/UPDATE `today_overrides` pro dnešní datum.

### B. Týdenní default (uprostřed)

```
Po  [✓ Pracuju] [10:00] — [22:00]  Pobočka: [Vinohrady ▼]
Út  [✓ Pracuju] [10:00] — [22:00]  Pobočka: [Vinohrady ▼]
St  [✗ Volno  ]
Čt  [✓ Pracuju] [10:00] — [22:00]
Pá  [✓ Pracuju] [10:00] — [22:00]
So  [✓ Pracuju] [14:00] — [22:00]
Ne  [✗ Volno  ]

Bulk: [Stejný čas pro všechny pracovní dny] [Víkend volno] [Reset]

[Uložit týden]
```

Uložit → INSERT/UPDATE 7 řádků v `availability`.

### C. Kalendář override (dole)

```
              Květen 2026
   Po  Út  St  Čt  Pá  So  Ne
                   1   2   3
   4   5   6   7   8★  9  10
  11  12  13  14  15  16  17
  18  19  20  21  22  23  24
  25  26  27  28  29  30  31
```

**Vizuální stavy:**
- 🟢 zelený fill = override AVAILABLE
- 🟡 žlutý = override BY_APPOINTMENT
- 🔴 červený = override OFF
- ⚪ neutrální = default z availability (žádný override)
- prázdné = mimo měsíc

**Klik na den** → modal (jako "Dnes" panel ale pro vybraný den).

**Bulk akce na měsíci:**
- "Kopírovat tento týden do dalšího" — INSERT next 7 dní z today_overrides
- "Kopírovat měsíc" — INSERT next 30 dní
- "Příští týden volno" — INSERT next 7 dní s status=OFF
- "Smazat všechny override v tomto měsíci"

## Admin `/admin/divky/{id}/dostupnost`

Stejné UI jako Studio, ale admin edituje konkrétní dívku. V hlavičce přepínač "← Zpět na profil [Jméno]".

**Bulk admin akce:**
- "Nastavit pro všechny dívky pobočky X" — když pobočka zavřená kvůli rekonstrukci

## Veřejný `/rozvrh`

### URL params
- `?location=vinohrady` (filter per pobočka, default = all)
- `?day=2026-05-08` (specifický den, default = dnes)

### Layout

1. **Pobočky pills nahoře:** [Všechny] [Vinohrady] [Karlín] [Nové Město] [Žižkov]
2. **Den tabs:** [Dnes 8.5. ★] [Zítra 9.5.] [Ne 10.5.] [Po 11.5.] [Út 12.5.] [St 13.5.] [Čt 14.5.]
3. **Grid 4-col karet** dívek (stejné karty jako homepage!) co pracují vybraný den + pobočku
4. Každá karta má pill na fotce s časy "10:00 — 22:00" pro **vybraný den** (ne nutně dnes)

### Server logika

```
GET /rozvrh?location=vinohrady&day=2026-05-08:
  date = 2026-05-08
  day_of_week = friday
  
  girls = SELECT companions WHERE status='LIVE'
  
  pro každou girl:
    override = SELECT today_overrides WHERE companion_id=g.id AND date=date
    IF override:
      day_status = override.status
      hours = override.time_from + ' — ' + override.time_to
      day_location_id = override.location_id
    ELSE:
      avail = SELECT availability WHERE companion_id=g.id AND day_of_week=friday
      day_status = 'OFF' if avail.is_off else 'AVAILABLE'
      hours = avail.time_from + ' — ' + avail.time_to
      day_location_id = avail.default_location_id
    
    IF location_filter AND day_location_id != location_filter:
      skip (nepatří do vybrané pobočky)
    IF day_status == 'OFF':
      skip
    
    add to results with day_status + hours
  
  render rozvrh.html with filtered results, each rendered as girl-card with hours
```

## Reference

`rozvrh.html` v mockupu.

---

# 10. STUDIO — SAMOOBSLUHA PRO DÍVKY

## `/studio` Dashboard

```
┌─────────────────────────────────────────────────────┐
│ Ahoj Niko 👋                                         │
│                                                     │
│ Profile completion: 85% ████████████░░             │
│ Chybí: Bio (5%), 2 fotky pro Spring 2026 set (10%) │
│                                                     │
│ DNES Pá 8.5.                                       │
│ ● Online · 10:00 — 22:00 · Vinohrady [Změnit]      │
│                                                     │
│ Statistiky tento měsíc:                            │
│ ┌──────────┬──────────┬──────────┐                 │
│ │ 1,243   │ 12       │ 4.8 ★    │                 │
│ │ Zobrazení│ Bookingy │ Hodnocení│                 │
│ └──────────┴──────────┴──────────┘                 │
│                                                     │
│ Pending tasks:                                      │
│ ⚠ 2 fotky čekají na schválení                      │
│ ⚠ 1 nová recenze ke schválení                      │
│ ⚠ 1 booking request                                │
│                                                     │
│ Quick actions:                                      │
│ [📷 Upload fotku] [📝 Postuj story] [📅 Dostupnost]│
└─────────────────────────────────────────────────────┘
```

## `/studio/zakladni`

Form fields:
- Jméno (display)
- Věk (přesný)
- Discreet věk (např. "28-32")
- Tagline (max 80 chars)
- Bio (textarea, max 500 chars)
- Bio intro (zvýrazněná první věta)
- Národnost (select)

## `/studio/telo`

Form fields:
- Výška (slider 150-185 cm)
- Váha (slider 45-80 kg)
- Prsa: velikost (1-5) + Přírodní/Implantát toggle
- Oči (select: Hnědé / Modré / Zelené / Hazelové / Šedé)
- Vlasy: barva + délka
- Pleť (Světlá / Pleťová / Olivová / Opálená)
- Postava (Štíhlá / Drobná / Křivky / Atletická / Vysoká)
- Tetování (Ne / Diskrétní / Custom text)
- Piercing (Ne / multi-select pozic)

## `/studio/zivotni-styl`

- Národnost
- Původ (město)
- Vzdělání (SŠ / VŠ studentka / VŠ)
- Profese (text)
- Kouření (Nekouří / Společensky / Kuřačka)
- Alkohol (Nepije / Příležitostně / Společensky)
- Orientace (Heterosexuální / Bisexuální)

## `/studio/jazyky`

- Add language: select language + level (Rodný / Plynně / Konverzační / Základy)
- Reorder via drag

## `/studio/sluzby`

- Pro každou službu z `services` table: toggle (Dělá / Nedělá / Domluva / Příplatek)
- Pokud Příplatek: cena (override default)

## `/studio/cenik`

- 5 programů (30/45/60/90/120 min): toggle "Nabízím" + cena (override default)
- Doporučení: "60 min se nejvíc objednává — featured"

## `/studio/dostupnost`

3 sekce (A/B/C) jak popsané v sekci 9.

## `/studio/lokace`

- Hlavní apartmán (radio z `locations`)
- Alternativní apartmány (multi-select s "na domluvě")

## `/studio/fotky`

- Drag & drop upload area
- Per fotka: caption + photo set selector
- Upload = PENDING status
- Status badge per fotka (⏳ Pending / ✓ Approved / ✗ Rejected with reason)
- Drag pro reorder

## `/studio/sety`

- Grid kolekcí
- Per set: edit name, visibility (Public / VIP / Private), cover photo
- Drag fotek mezi sety

## `/studio/stories`

- Vytvořit story:
  - Background: Photo / Color / Video
  - Caption (max 100 chars)
  - CTA button (link na profil / kontakt)
- Vidí svoje aktivní stories s 24h timer countdown
- Vidí views per story

## `/studio/rezervace`

- List requests (REQUESTED / CONFIRMED / COMPLETED)
- Per request:
  - Klient (anonymized — "M.K. 28 let")
  - Datum / čas
  - Program
  - Lokace
  - Akce: [Confirm] [Decline] [Mark completed]

## `/studio/recenze`

- List všech recenzí (APPROVED + PENDING)
- Per recenze: text, rating, datum, akce: [Helpful count]

---

# 11. ADMIN PANEL

## `/admin` Dashboard

KPIs:
- Aktivní dívky: 13 (2 NEW)
- Bookingy tento týden: 47
- Recenze čekající: 3
- Member applications: 1
- Stories k schválení: 5
- Pending fotky: 12

Quick links:
- → Schvalování fotek
- → Pending recenze
- → Member applications

## `/admin/divky`

Tabulka:
- Foto (mini), Jméno, Slug, Status, Featured, VIP, Verified, Profile views, Last update
- Akce per řádek: [Edit] [Dostupnost] [Fotky] [Recenze] [Smazat]
- Filter: status, location, has_photos, verified
- Search by name

## `/admin/divky/nova` — Onboarding flow

**Krok 1: Základní info**
- Jméno + email + telefon (pro setup)
- Generuje slug automaticky
- Vytvoří `users` (companion role) + `companions` (DRAFT)
- Pošle dívce SMS/email s temp password

**Krok 2: Photo session info**
- Datum + lokace photo session
- Notes pro fotografa

**Krok 3: Owner story** ("How we met Nika")
- Text osobního představení
- Podpis (Peter / Tom / ...)

**Krok 4: Confirm**
- Review všeho
- [Vytvořit]

Pak admin počká až dívka:
1. Doplní zbytek profilu v Studiu
2. Uploaduje fotky (PENDING)
3. Admin schválí fotky v `/admin/verifikace`
4. Admin změní `status = LIVE`

## `/admin/divky/{id}/edit`

Override jakéhokoliv pole z `companions` table:
- Všechna pole co má dívka v Studiu
- + admin-only: status, vip, is_new, vip_only_*, verified
- + Owner story (admin píše)

## `/admin/divky/{id}/dostupnost`

Stejné jako `/studio/dostupnost` ale pro vybranou dívku.

## `/admin/verifikace`

Fronta čekajících fotek napříč dívkami:

```
┌────────────────────────────────────────────────┐
│ [thumbnail] Nika  uploaded 2 hours ago         │
│             Set: "Spring 2026"                 │
│             [✓ Approve] [✗ Reject ▼]           │
│                                                │
│ Reason (if reject):                            │
│ ( ) Špatná kvalita                             │
│ ( ) Špatné světlo                              │
│ ( ) Není to ta dívka                           │
│ ( ) Jiné: [_____________]                      │
└────────────────────────────────────────────────┘
```

Bulk approve/reject (volitelně).

## `/admin/stories`

- Tabulka všech stories (companion + category)
- Schvaluje pending companion stories
- Vytváří category stories:
  - Background type: Photo / Color (gradient picker) / Video
  - Caption
  - CTA
  - Expirace (date / manual)

## `/admin/recenze`

- Tabulka pending recenzí
- Per recenze: text, rating, klient (anonymized), dívka
- Akce: [Approve] [Approve as Featured] [Reject]
- Edit recenze (typo fix)

## `/admin/clenove`

- Pending applications (top)
  - Per app: jméno, email, kontakt, důvod, datum
  - Akce: [Approve] [Reject] [Request more info]
- Active members (table)
  - Member number, jméno, tier, joined_at, last_visit, loyalty count, status
  - Akce: [Edit] [Suspend] [View history]

## `/admin/pobocky`

- Tabulka pobocek
- Per pobočka: name, district, status, photos count
- Akce: [Edit] [Photos] [Smazat]
- + [Nová pobočka]

## `/admin/cenik`

Společný ceník:
- Programy (5 řádků: 30/45/60/90/120 min) — name + price + featured toggle
- Extras — list of services s default ceny

Override per dívka v `/admin/divky/{id}/cenik`.

## `/admin/slevy`

CRUD slev. Per sleva:
- Slug, name (4 jazyky)
- Popis
- Amount (% nebo Kč)
- Conditions (kdy platí)
- Featured toggle
- Active toggle
- Display order

## `/admin/cms/homepage`

WYSIWYG editor pro:
- Hero copy (4 jazyky)
- Featured girl IDs (multi-select)
- Featured "New on web" girl ID (single select)
- Trust strip items
- Activity feed (auto-generated nebo manual)

## `/admin/cms/stranky`

Static pages CRUD:
- Slug, title, content (HTML editor)
- 4 jazyky zvlášť
- Meta title, meta description
- Updated_at

## `/admin/audit`

Searchable log:
- "ADMIN admin@lg.cz updated companion 'Nika' (status: DRAFT → LIVE) at 2026-05-08 12:34"
- Filters: user, action, entity, date range
- Read-only

## `/admin/nastaveni`

Tabbed:
- **Brand**: site name, tagline, phone, WhatsApp number, Telegram handle, email
- **i18n**: default language, available languages, translation keys CRUD
- **Email**: SMTP settings, email templates (welcome, booking, password reset)
- **Bezpečnost**: rate limits, age gate text, GDPR cookie text

---

# 12. MEMBER SYSTÉM (VIP)

## Tier system

- **STANDARD** — registrovaný uživatel, žádné výhody
- **VIP** — schválený premium člen
- **RETURNING** — opakovaný klient s historickou slevou

## Application flow

1. Návštěvník vyplní `/clenstvi/zadost`:
   - Email
   - Jméno (nebo nickname)
   - Kontakt (telefon)
   - Důvod zájmu (volitelné)
2. Insert do `member_applications` jako PENDING
3. Admin vidí v `/admin/clenove` — pending list
4. Admin: [Approve] / [Reject] / [Request more info]
5. Approve → vytvoří `users` (member role) + `members` record + temp password
6. Klient obdrží email s loginem
7. Klient se přihlásí v `/clenstvi/login` → redirect na `/vip`

## VIP-only obsah

- **Hidden profiles** — `vip_only_profile=true` dívky se neukáží v public listing
- **Privátní galerie** — `photo_sets.visibility=VIP` se ukáží blurnuté + lock pro non-members
- **VIP-only stories** — `stories` s flag jen pro members
- **Slevy** — věrnostní program

## Loyalty program

Po každé `bookings.status=COMPLETED`:
```
member.loyalty_visit_count++
member.last_visit_at = NOW

IF count >= 10: discount_pct = 15
ELSE IF count >= 5: discount_pct = 12
ELSE IF count >= 3: discount_pct = 10
ELSE: discount_pct = 0
```

Sleva trvá 12 měsíců od poslední návštěvy. Cron job resetuje neaktivní.

## VIP design accent

VIP area (`/vip/*`) má **zlatou barvu** (`#d4af37`) místo coral — jiná visual identita.

---

# 13. BOOKING FLOW (WHATSAPP/TELEGRAM)

## Princip

**Žádný booking formulář na webu.** Vše přes WhatsApp/Telegram deep links.

## CTA na profilu

```html
<a href="https://wa.me/420734332131?text=Ahoj, m%C3%A1m z%C3%A1jem o Niku, dnes ve%C4%8Der 19:00, 60 minut.%0A%E2%80%94 z LovelyGirls.cz" 
   class="btn-whatsapp">
  WhatsApp
</a>

<a href="https://t.me/+420734332131?text=..." class="btn-telegram">Telegram</a>

<a href="tel:+420734332131" class="btn-call">Zavolat</a>
```

## Pre-fill message templates

```
WhatsApp text (CS):
"Ahoj, mám zájem o {name}, {datum} {čas}, {duration} minut.
— z LovelyGirls.cz"

Telegram (EN):
"Hi, I'd like to book {name} for {date} {time}, {duration} minutes.
— sent via LovelyGirls.cz"
```

## Backend tracking

WhatsApp Business API webhook (volitelně) → automaticky vytvoří `bookings` record:
```
channel = WHATSAPP
companion_id = parsed from message
status = REQUESTED
```

Admin / companion vidí v `/admin/rezervace` nebo `/studio/rezervace`. Schválí termín → potvrdí klientovi přes WhatsApp s adresou apartmánu.

## Status flow

```
REQUESTED → CONFIRMED / DECLINED → COMPLETED / CANCELLED
```

## Diskrétnost

- **Adresa apartmánu se neukáže na webu**
- Adresa se posílá **po potvrzení termínu** přes WhatsApp/Telegram

---

# 14. FOTO UPLOAD PIPELINE

## Co dělá server po POST `/studio/fotky`

```
1. Validate magic bytes (ne jen MIME type)
   - JPEG: FF D8 FF
   - PNG: 89 50 4E 47
   - WebP: 52 49 46 46 ... 57 45 42 50

2. Auto-rotate dle EXIF Orientation tag

3. Strip ALL EXIF metadata
   (preventing GPS leak)

4. Generate watermark
   - Subtle "LG" logo nebo coral kruh v rohu
   - 30% opacity

5. Resize do 3 sizes (WebP):
   - thumb: 400x500 (q=70)
   - medium: 800x1000 (q=80)
   - full: 1200x1500 (q=85)

6. Upload do S3-compatible storage
   - Path: /companions/{slug}/{photo_id}_{size}.webp

7. INSERT do photos table:
   - approval_status = PENDING
   - watermarked = TRUE
   - exif_stripped = TRUE

8. Email/notification adminovi (volitelně)

9. Admin v /admin/verifikace schvaluje:
   - Approve → APPROVED
   - Reject (with reason) → REJECTED + email dívce
```

## Upload limits

- Max 10 MB per file
- Max 50 fotek per request
- Allowed extensions: jpg, jpeg, png, webp, heic
- HEIC se konvertuje na JPEG před processing

---

# 15. STORIES SYSTÉM

## Companion stories

1. Dívka v `/studio/stories` postuje:
   - Foto / Color / Video background
   - Caption (max 100 chars)
   - CTA button (link)
2. Status = PENDING (admin schvaluje) NEBO auto-approve podle nastavení
3. `expires_at = NOW + 24h`
4. Po expirovánu už se neukazují (CRON job)

## Category stories (admin only)

V `/admin/stories`:
- Category select: NEW_THIS_WEEK, MEMBERS_CIRCLE, AVAILABLE_TONIGHT, PROMO, TRAVEL
- Background gradient (admin vybere)
- Caption + CTA
- Manual expirace (datum)

## Frontend zobrazení

Na homepage v "Activity feed" sekci jako horizontální carousel.

Klik na story → `/stories/{id}` (vlastní URL, ne modal — funguje s vypnutým JS, sdílí se přes link).

---

# 16. HASHTAG SEO STRÁNKY

## URL: `/hashtag/{tag-slug}`

Příklad: `/hashtag/blondynky-praha` zobrazí:
- H1: "Blondýnky Praha"
- SEO popis (z `tags.description`)
- Grid všech dívek s tag `blondynky-praha`
- Sortable / filterable
- Meta tags pro Google:
  - `<title>Blondýnky Praha — LovelyGirls Praha</title>`
  - `<meta name="description" content="...">`
  - `<meta property="og:image" content="...">`

## Sample tags (admin spravuje)

- `blondynky-praha`
- `brunetky-praha`
- `zrzky-praha`
- `velka-prsa-praha`
- `male-prsa-praha`
- `studentky-praha`
- `milf-praha`
- `gfe-praha`
- `bisexualni-praha`
- `mlade-do-22-praha`
- atd.

## Hashtag cloud

Na homepage automaticky generated cloud z `tags` table sorted by popularity (počet companions s tagem).

---

# 17. MULTI-LANGUAGE

## Podporované jazyky
- **CS** — Čeština (default)
- **EN** — English
- **DE** — Deutsch
- **UK** — Українська

## URL pattern

```
/cs/divky/nika
/en/girls/nika
/de/madchen/nika    (volitelně, nebo /de/girls/nika)
/uk/dvchata/nika    (volitelně)
```

Default = CS bez prefix (`/divky/nika`). Ostatní s prefixem.

## Translation strategy

### UI texty (tlačítka, nadpisy, statusy)
- Soubory `locales/cs.json`, `locales/en.json`, `locales/de.json`, `locales/uk.json`
- Klíče: `today_hours`, `by_appointment`, `book_now`, `view_profile`, ...
- Použití v template: `{{ t('today_hours', { hours: '10:00 — 22:00' }) }}`

### Companion content (bio, tagline, owner story)
- Companion píše v jednom jazyce (CS default)
- **NE auto-translate** — kvalita > kvantita
- Volitelně: admin manuálně přidá EN/DE/UK varianty

### Static pages
- `static_pages` table má `title_cs`, `title_en`, `title_de`, `title_uk` etc.
- Admin v `/admin/cms/stranky` edituje 4 jazyky zvlášť

### SEO
- `<html lang="{current_lang}">`
- `<link rel="alternate" hreflang="cs" href="/divky/nika">`
- `<link rel="alternate" hreflang="en" href="/en/girls/nika">`
- atd.

## Translation key examples

```json
// cs.json
{
  "today_hours": "Dnes {{hours}}",
  "by_appointment": "Domluva předem",
  "book_now": "Rezervovat",
  "view_profile": "Zobrazit profil",
  "available_now": "K dispozici",
  "verified": "Ověřená",
  "vip": "VIP",
  "new_badge": "Nová"
}

// en.json
{
  "today_hours": "Today {{hours}}",
  "by_appointment": "By appointment",
  "book_now": "Book now",
  "view_profile": "View profile",
  ...
}

// de.json
{
  "today_hours": "Heute {{hours}}",
  "by_appointment": "Nach Vereinbarung",
  ...
}

// uk.json
{
  "today_hours": "Сьогодні {{hours}}",
  "by_appointment": "За домовленістю",
  ...
}
```

---

# 18. CRON JOBS

| Job | Frekvence | Co dělá |
|-----|-----------|---------|
| `expire-stories` | každou hodinu | UPDATE stories SET status='EXPIRED' WHERE expires_at < NOW |
| `cleanup-old-overrides` | denně 02:00 | DELETE today_overrides WHERE date < NOW - 30 days |
| `expire-loyalty-discounts` | denně 03:00 | UPDATE members SET loyalty_discount_pct=0 WHERE last_visit_at < NOW - 12 months |
| `send-pending-emails` | každých 5 min | Process email queue |
| `generate-sitemap` | denně 04:00 | Regenerate sitemap.xml |
| `cleanup-orphan-photos` | týdně | Delete photos bez companion_id |
| `db-backup` | denně 03:30 | Backup DB to S3 |
| `recalc-stats` | denně 01:00 | UPDATE companions SET profile_views, rating_avg, reviews_count |

---

# 19. BEZPEČNOST

## Auth & sessions
- HTTPS všude (Let's Encrypt přes Caddy / Cloudflare)
- bcrypt cost 12+ pro hesla (Argon2 bonus)
- Session cookies: HTTPOnly + Secure + SameSite=Lax
- CSRF tokens na všech POST formech
- Rate limit auth endpoints (5 / 15 min per IP)

## File upload
- Magic bytes validation (ne jen MIME)
- Size limit (10 MB per file)
- Extension whitelist
- Strip EXIF před save
- Auto-rotate před strip

## Data sanitization
- SQL parametrized queries (no string concat)
- HTML escape všeho user-generated obsahu
- Bio sanitization (strip URLs a telefony — žádný link spam)
- Markdown allow-list (jen safe tags)

## Privacy
- 18+ age gate (cookie-based, modal na první návštěvě)
- Admin/Studio NEINDEXOVAT (robots.txt + meta noindex)
- Encrypt sensitive PII (member application data)
- Žádné GPS metadata v fotech (auto-strip)

## Compliance
- GDPR cookie consent banner
- Privacy policy + Terms of service
- 2257 disclaimer ve footeru
- 18+ verification

---

# 20. DESIGN TOKENS

## Barvy

```css
:root {
  /* Backgrounds */
  --bg: #0c0a0e;
  --bg-soft: #14101a;
  --bg-card: #1a1420;
  --bg-elev: #221a2a;
  
  /* Text */
  --text: #f8f5fa;
  --text-muted: #a89bb0;
  --text-dim: #6e6275;
  
  /* Accents (z loga) */
  --coral: #F27D8D;       /* light pink — primární akcent */
  --magenta: #9A1D51;     /* dark wine — sekundární */
  
  /* Status */
  --green: #22c55e;       /* available */
  --gold: #d4af37;        /* VIP zóna */
  --red: #ef4444;         /* errors */
  
  /* Lines */
  --line: rgba(255,255,255,0.06);
  --line-mid: rgba(255,255,255,0.12);
}
```

## Typography

```css
--font-display: 'Playfair Display', Georgia, serif;  /* nadpisy, jména */
--font-body: 'Inter', -apple-system, sans-serif;     /* běžný text */
```

## Spacing & sizing

```css
--container-max: 1280px;
--card-radius: 14px;
--pill-radius: 999px;
```

## Logo

- "LovelyGirls" v `--text` (bílá)
- Subtitle "Praha · Privát" v `--text-dim`

## Brand colors v UI

- **Coral** pro: věk pill, statline čísla, nav active state, lokace badge
- **Magenta** pro: hero gradients, members section accent
- **Green** pro: status "Online" tečka + "Dnes" pill
- **Gold** pro: VIP badge, members area accent

---

# 21. IMPLEMENTAČNÍ POŘADÍ (KROK ZA KROKEM)

## Fáze 1 — Foundations (týden 1-2)

1. **Setup projekt** — vyber stack, init repo
2. **Database schema** — migrace všech tabulek
3. **Auth systém** — login/logout/session pro 4 role
4. **Layout shell** — header / footer / nav (i18n připravený)
5. **Design system** — CSS tokens + komponenty

## Fáze 2 — Veřejné stránky (týden 3-4)

6. **Karta dívky komponenta** (jeden partial, použitý všude)
7. **Homepage** s featured grid, activity feed
8. **`/divky` listing** s filtry (URL params)
9. **`/profil/{slug}` detail** s 17+ sekcemi
10. **`/cenik`, `/slevy`, `/faq`** static stránky
11. **`/rozvrh`** s pobočky pills + den tabs (vyžaduje availability table)

## Fáze 3 — Admin panel (týden 5)

12. **`/admin/divky` CRUD**
13. **`/admin/divky/nova`** onboarding flow
14. **`/admin/verifikace`** photo approval
15. **`/admin/pobocky`** CRUD
16. **`/admin/cenik`** + slevy + FAQ

## Fáze 4 — Studio (týden 6)

17. **`/studio` dashboard**
18. **`/studio/zakladni`, `/studio/telo`, atd.** form pages
19. **`/studio/fotky` upload** s pipeline
20. **`/studio/dostupnost`** 3-section page (klíčové)

## Fáze 5 — Hashtag + Stories + i18n (týden 7)

21. **Hashtag stránky** (`/hashtag/{slug}`)
22. **Stories systém** (companion + category)
23. **Multi-language** (UI strings + URL routing)

## Fáze 6 — Members + Booking (týden 8)

24. **Member application flow**
25. **VIP area** (`/vip/*`)
26. **WhatsApp deep links** + booking webhook

## Fáze 7 — Polish + cron (týden 9)

27. **Cron jobs** (8 jobů)
28. **Audit log**
29. **CMS** pro homepage
30. **SEO** (sitemap, OG, structured data)
31. **18+ age gate**
32. **GDPR cookie consent**

## Fáze 8 — Production (týden 10)

33. **VPS / hosting setup**
34. **CDN pro fotky** (Cloudflare R2)
35. **Email service** (Resend/Postmark)
36. **Domain + SSL**
37. **Performance audit**
38. **Security audit**
39. **Backup strategy**
40. **LAUNCH 🚀**

---

# 22. PŘILOŽENÉ MOCKUPY

V `lovely-prague-mockup.zip`:

- `index.html` — homepage
- `divky.html` — listing s filtry
- `profil-{slug}.html` × 13 — profily Nika, Katy, Luna, Jessica, Emily, Rebeca, Sara, Anetta, Eliška, Lyra, Dana, Natalie, Elizabeth
- `cenik.html` — společný ceník
- `rozvrh.html` — pobočky pills + den tabs + grid karet
- `slevy.html` — slevy
- `faq.html` — FAQ

**Vlastnosti všech mockupů:**
- 0 JavaScriptu
- Server-side rendering ready
- Multi-page (relativní `href` linky)
- Karty dívek **bit-by-bit identické** napříč index/divky/rozvrh
- Mobile responsive (2 col ≤768px, kompaktnější styling)

**Použij jako vizuální referenci. Zachovej design přesně. Implementuj logiku popsanou výše.**

---

# 23. CHYBĚJÍCÍ DATA — DOPLNIT OD MAJITELE

Tyhle věci se musí doplnit než půjde web LIVE:

1. **Seznam služeb** pro `services` table (co je v ceně / příplatek / domluva / nedělá)
2. **Konkrétní ceny** pro `programs` table (30/45/60/90/120 min)
3. **Telefonní číslo, WhatsApp, Telegram handle** (zatím placeholder `+420 734 332 131`)
4. **Pobočky** — kolik a kde (zatím 4 placeholder: Vinohrady, Karlín, Nové Město, Žižkov)
5. **Slevy** — věrnostní %, ranní hodiny, balíček, doporuč kamaráda, narozeniny
6. **FAQ otázky** (máme 12 placeholder, doplnit reálnými)
7. **Texty homepage** (hero copy, trust strip, atd.)
8. **Texty static pages** (O nás, Podmínky, GDPR)
9. **Reálné fotky dívek** (zatím Unsplash placeholdery)

**Programátor začne s placeholderá, majitel doplní reálná data před launchem.**

---

# 24. KONTAKT NA AUTORA ZADÁNÍ

Pokud máš dotazy k zadání nebo nejasnosti:
- Otázky pište do GitHub Issues / Linear / Notion
- Designové rozhodnutí: vrať se k mockupu, ten je single source of truth
- Logické rozhodnutí: vrať se k tomuto dokumentu

---

**Tohle je definitivní zadání. Server-rendered, 0 JS, multi-language, kompletní funkce.**

**Jako programátor: začni Fází 1, postupuj sekvenčně. Mockupy v zipu jsou tvůj design partner.**
