# Task #9: Research — Push notifikace z booking systému do PC/telefonu

## Otázka uživatele
"Jak se dají nastavit notifikace z toho STUDIA DO PC/TELEFONU aby fakt chodily upozornění?"

---

## 3 Varianty řešení

### Varianta 1: Telegram notifikace (DOPORUČENO)
**Složitost: NÍZKÁ | Čas: ~1h | Náklady: 0 CZK**

**Proč:** Bot už existuje, `sendMessage` funguje, infrastruktura je hotová.

**Jak to funguje:**
- Telegram bot pošle zprávu do chatu operátorky/dívky
- Telegram appka na PC/Mac/iOS/Android zobrazí push notifikaci automaticky
- Uživatel nemusí nic instalovat navíc — stačí mít Telegram

**Co je potřeba:**
1. Implementovat Task #8 (notifikace operátorce/dívkám) — **právě naplánován**
2. Operátorka si propojí Telegram chat ID s účtem v dashboardu (jednoduchý setup formulář)
3. Dívky se propojí přes deep-link (`/start girl_28_abc123`) — tabulka `telegram_links` už existuje

**Výhody:**
- Funguje IHNED na všech zařízeních (PC, Mac, iOS, Android)
- Nulové náklady
- Nulová údržba — žádný service worker, žádné VAPID klíče
- Klient/operátorka/dívka už Telegram pravděpodobně má (booking flow je přes Telegram)
- Zprávy jsou persistentní (nevymizí jako push notifikace)

**Nevýhody:**
- Vyžaduje Telegram na zařízení
- Kdo nepoužívá Telegram, nedostane notifikaci

---

### Varianta 2: Web Push Notifications (PWA)
**Složitost: STŘEDNÍ-VYSOKÁ | Čas: ~8-12h | Náklady: 0 CZK**

**Jak to funguje:**
- Service Worker běží na pozadí v prohlížeči
- Uživatel klikne "Povolit notifikace" v admin dashboardu
- Server pošle push přes Web Push API (VAPID)
- Prohlížeč zobrazí systémovou notifikaci

**Co je potřeba:**
1. Generovat VAPID klíče (env vars)
2. Vytvořit service worker (`public/sw.js`)
3. Registrovat SW v booking admin layoutu
4. API route pro subscribe/unsubscribe (`/api/push/subscribe`)
5. DB tabulka `push_subscriptions` (endpoint, keys, user_id)
6. Server-side push posílání přes `web-push` npm balíček
7. UI tlačítko "Zapnout notifikace" v dashboardu
8. Manifest.json pro PWA (potřeba pro iOS)

**Výhody:**
- Funguje bez Telegramu
- Nativní systémové notifikace
- Funguje na PC (Chrome, Firefox, Edge) i mobilu (Android Chrome)

**Nevýhody:**
- **iOS vyžaduje PWA** (přidat na plochu) — Safari 18.4+ umí push, ale jen jako PWA
- Složitější implementace (~8-12h práce)
- Service worker maintenance
- Uživatel musí explicitně povolit v prohlížeči
- Notifikace se ztratí pokud prohlížeč není otevřený (na mobilu)
- Projekt nemá žádný PWA setup (žádný manifest, žádný SW)

---

### Varianta 3: Email notifikace
**Složitost: NÍZKÁ | Čas: ~2-3h | Náklady: 0-nízké**

**Jak to funguje:**
- Při nové rezervaci se odešle email operátorce/dívce
- Běžný email s detaily rezervace

**Co je potřeba:**
1. Email provider (Resend, SendGrid, nebo SMTP)
2. Email template pro notifikace
3. API route nebo helper pro odesílání
4. Email adresy uživatelů (už v `users.email`)

**Výhody:**
- Jednoduché
- Funguje na všech zařízeních
- Žádná závislost na Telegramu

**Nevýhody:**
- Email NENÍ real-time — může trvat minuty
- Push notifikace na telefonu z emailu nejsou spolehlivé
- Email se ztratí ve spamu
- Méně interaktivní než Telegram zprávy

---

## Doporučení

### Fáze 1 (IHNED): Telegram notifikace
- Implementovat Task #8 — hotový plán existuje
- Přidat do admin dashboardu pole "Telegram Chat ID" pro uživatele
- Deep-link flow pro dívky přes existující `telegram_links`
- **Výsledek:** Operátorka i dívky dostanou push na PC/telefon přes Telegram

### Fáze 2 (VOLITELNĚ, později): Web Push jako doplněk
- Pokud se ukáže potřeba notifikací BEZ Telegramu
- Přidat PWA manifest + service worker
- `web-push` nebo `next-push` knihovna
- Subscription management v dashboardu

### Fáze 3 (VOLITELNĚ): Email jako fallback
- Pro uživatele bez Telegramu
- Jednoduchý email template přes Resend/SendGrid

---

## Technické poznámky

- **Projekt NEMÁ** žádný PWA setup (žádný service worker, manifest.json, VAPID klíče)
- **Projekt MÁ** plně funkční Telegram bot s `sendMessage()` 
- **DB je připravena**: `users.telegram_chat_id`, `telegram_links` tabulka
- **Vercel omezení**: Serverless functions nemají shared memory — Web Push subscriptions musí být v DB, ne v paměti

## Závěr

**Telegram notifikace jsou jasná volba #1.** Infrastruktura existuje, implementace je minimální (Task #8), a výsledek je okamžitý — push notifikace na všech zařízeních kde má uživatel Telegram. Web Push je over-engineering pro současné potřeby.
