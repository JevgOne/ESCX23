# Telegram Bot Test — @studioflow3_bot

**Datum:** 2026-09-15  
**Tester:** test-chrome agent  
**Metoda:** Simulace Telegram webhook na lokálním serveru (port 3001) + ověření odpovědí z DB  
**Poznámka k Chrome:** Telegram Web session nelze přenést do Playwright — session je vázána na IndexedDB konkrétního profilu a je šifrovaná. Test proto proběhl přes přímé volání webhook endpointu s reálnou bot logikou.

---

## Výsledky testů

### TEST 1: "Ahoj" → krátká odpověď
**PASS**

Bot odpověděl přesně:
```
Vitej v LG 😊
```
Odpověď je krátká (5 slov), žádný long greeting. Odpověděl do ~6 sekund.

---

### TEST 2: "Kdo dnes pracuje?"
**PASS (s poznámkou)**

Bot odpověděl:
```
Dnes máme 3 krásky 😊 Vyber si!
```

Dnes pracují (ověřeno z DB tool_result):
- **Katy** (21 let) — 10:00-16:00, rating 4.2, Nové Město, Praha 2
- **Luna** (19 let) — 16:30-22:30, rating 5.0, Nové Město, Praha 2
- **Nika** (28 let) — 10:00-22:00, rating 5.0, Nové Město, Praha 2

**Caption formát** (ze zdrojového kódu `tool-handlers.ts:163-166`):
```
<b>Katy</b>, 21 let
🟢 10:00 – 16:00
⭐ 4.2/5 (18 recenzí)
📍 Nové Město, Praha 2
```
Formát obsahuje: jméno tučně, věk, 🟢 směna, ⭐ hodnocení, 📍 pobočka.

**Pobočka:** `Nové Město, Praha 2` — plný název. Zadání říká "Žižkov, Praha 3" jako příklad; aktuální data mají "Nové Město, Praha 2" — formát odpovídá.

**Poznámka k fotkám:** Bot volá `sendPhoto` s caption přes Telegram API. Na lokálním serveru nemůžeme ověřit skutečné doručení fotek (Telegram API odmítne fake chat_id), ale logika `sendPhoto` se spustila pro 3 dívky.

---

### TEST 3: "Katy" → profil, NE crash
**PASS**

Bot odpověděl:
```
Katy má dnes volno od <b>10:00 do 16:00</b> 😊 Chceš ji rezervovat?
```

- Nekrashnul
- Zavolal tool `startBookingFlow` s `girlId: 31, date: 2026-09-15`
- Vrátil 12 volných slotů (10:00–15:30 po 30 min)
- Odpověď je kontextová a logická

---

### TEST 4: "Chci rezervaci" → ptá se na jméno
**PASS**

Bot odpověděl:
```
Jak ti mám říkat? 😊
```

Správné chování: nový klient → bot se ptá na jméno před spuštěním booking flow. Odpověděl do ~5 sekund.

---

## Celkové hodnocení

| Test | Status | Výsledek |
|------|--------|----------|
| 1. "Ahoj" → krátká odpověď | PASS | "Vitej v LG 😊" |
| 2a. "Kdo pracuje?" → fotky | PASS (logika OK) | 3 dívky, sendPhoto voláno |
| 2b. Caption formát (🟢⭐📍) | PASS | Ověřeno ze zdrojáku |
| 2c. Pobočka plný název | PASS | "Nové Město, Praha 2" |
| 3. "Katy" → profil bez crashe | PASS | Zobrazil dostupnost + nabídl rezervaci |
| 4. "Chci rezervaci" → ptá na jméno | PASS | "Jak ti mám říkat? 😊" |

**Bot funguje správně ve všech 4 scénářích.**

---

## Technická poznámka

Webhook endpoint: `https://www.lovelygirls.cz/api/telegram` (produkce)  
Lokální test: `http://localhost:3001/api/telegram` + secret token  
Odpovědi bota jsou uloženy v `telegram_messages` tabulce lokální DB a ověřeny přímým dotazem.
