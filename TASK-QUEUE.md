# FRONTA ÚKOLŮ (TASK QUEUE)

> Úkoly se zpracovávají shora dolů podle priority.
> Stav: čeká | zpracovává se | hotovo | chyba
> Nové úkoly přidávej na konec — lead je seřadí podle priority.

---

## TASK-018: Opravit design hashtag landing stránek
Priorita: 1
Stav: hotovo
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
Stav: hotovo
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

## TASK-019: Hybridní booking flow — AI konverzace + tlačítka na rezervace
Priorita: 1
Stav: zpracovává se
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Uživatel říká: "nasad ty rezervace, pokud si klient vybere dívku už tam zařad ty rezervace na odkliky at se neplacají kredity na claude AI" a "jo at proste prvních max 6 zprav jsou jako človek, a když bot napíše jakou slečnu chce napíše katy tak už jede structured data"

Implementovat hybridní Telegram bot flow:

1. **AI konverzace (Claude API)** — prvních max ~6 zpráv funguje jako přirozená konverzace s AI operátorkou "Nikolou". Klient píše co chce, AI odpovídá, doporučuje holky, zjišťuje preference.

2. **Přepnutí na tlačítka** — Jakmile AI identifikuje kterou holku klient chce (např. napíše "Katy"), AI zavolá nový tool `startBookingFlow` místo pokračování konverzace. Od tohoto bodu vše jede přes inline keyboard buttons BEZ dalších Claude API volání:
   - Krok 1: Zobrazí dostupné časové sloty jako tlačítka (z DB, reálná dostupnost)
   - Krok 2: Zobrazí délky programu jako tlačítka (30/45/60/90/120 min)
   - Krok 3: Zobrazí shrnutí + Potvrdit/Zrušit tlačítka
   - Krok 4: Vytvoří booking přímo z DB (bez AI), pošle potvrzení

3. **Callback handling** — Všechny booking callbacks (bk_time:*, bk_dur:*, bk_ok:*, bk_cancel) se zpracují PŘÍMO v telegram-bot.ts bez volání Claude API.

4. **Účel:** Šetření Claude API kreditů. AI se použije jen na úvodní konverzaci a identifikaci preference, strukturovaný booking flow jede přes buttony.

### Kontext:
- Stávající soubory: lib/telegram-bot.ts, lib/telegram-ai/handler.ts, lib/telegram-ai/tools.ts, lib/telegram-ai/tool-handlers.ts
- Telegram API: lib/telegram.ts (sendMessage s replyMarkup pro inline keyboard)
- DB: bookings_v2, girl_schedules, schedule_exceptions, slot_locks, pricing_plans tabulky
- Existující tool createBooking v tool-handlers.ts má veškerou booking logiku (slot lock, price calc, validation)
- Bot právě opraven: webhook 401 fix (await handleAIMessage místo fire-and-forget pro Vercel serverless)
- Deploy: vercel --prod

---

## TASK-020: Profesionální klientské karty — multi-kanálová identita
Priorita: 1
Stav: čeká
Projekt: /Users/zen/Projects/ESCX23

### Kompletní zadání:
Uživatel říká: "potřebuju když máme ten adresar seřadit ty klienty, ted je máme podle čísla, co když nejaky klient když mu pošleme zpravu do WA neboli odkaz tak použije jiné číslo nebo jenom nick na telegramu? Musíme mít ty karty seřazené profesionalně aby se vedelo co je co"

Problémy k vyřešení:
1. **Multi-kanálová identita** — klient může mít WA s jedním číslem, Telegram s jiným číslem, nebo jen Telegram nick bez čísla. Systém musí umožnit propojit tyto kontakty do jedné klientské identity.
2. **Řazení klientů** — ne podle čísla (nepřehledné), ale profesionálně: podle jména/nicku, případně s filtry (poslední návštěva, počet návštěv, oblíbená dívka).
3. **Klientská karta** — přehledně zobrazit: jméno/nick, všechna telefonní čísla (WA, Telegram, osobní), Telegram username, počet návštěv, oblíbené dívky, historie bookingů, poznámky.
4. **Deduplikace** — detekce že dva "různí" klienti jsou stejná osoba (např. stejné jméno ale jiné číslo).

### Kontext:
- DB: booking_clients (encrypted PII), telegram_users (telegram chat_id + username)
- Šifrování: lib/crypto.ts (AES-256-GCM pro PII, HMAC pro vyhledávání)
- Admin panel: app/admin/ — sem patří klientský adresář
- Stávající propojení: telegram_users.client_id → booking_clients.id
- **Deep-link propojení WA→Telegram:** Klientovi se pošle WA odkaz `t.me/studioflow3_bot?start=TOKEN`, token je svázaný s jeho klientskou kartou. Když klikne a napíše /start, bot propojí jeho Telegram chat_id s existující kartou. Kdo přijde bez odkazu, identifikuje se jménem + kódem klienta.
- Uživatel se ptá: "Jde to že bot bude odepisovat jenom když napíše to číslo které ma na WA?" → Řešení: bot odpovídá všem, ale jen propojení klienti (přes deep-link nebo manuální ověření) mohou bookovat.

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
