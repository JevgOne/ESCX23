# TASK #11: Failed Vercel deploys — commit da3de5a

## Status: ANALYZA HOTOVA — pravdepodobne resolved

## Analyza

### Commit
`da3de5a` — "feat: auto-registration for new Telegram clients + pending bookings"

Zmenene soubory (4):
- `lib/telegram-ai/booking-flow.ts` — pending status pro nove klienty
- `lib/telegram-ai/system-prompt.ts` — update promptu
- `lib/telegram-ai/tool-handlers.ts` — novy `registerNewClient` handler
- `lib/telegram-ai/tools.ts` — novy tool definition

### Vysledky kontroly

1. **TypeScript** — ZADNE chyby. `npx tsc --noEmit` na commit `da3de5a` (po vycisteni .next) vraci 0 errors.

2. **Kod** — Zadne syntakticke ani logicke chyby v diffech. Vsechny zmeny jsou v `lib/telegram-ai/` — serverove API routes pro Telegram bota, zadne stranky ktere by se renderovaly pri buildu.

3. **10 commitu po da3de5a** — existuji a jsou na `origin/main` (posledni: `f54b056`). Pokud by tyto deploy taky failovaly, uzivatel by to zmnil.

4. **Mozna pricina:**
   - **Transientni Vercel infrastructure error** — obcas se stava
   - **OG image runtime error** — `app/[locale]/divky/opengraph-image.tsx` vola DB pri build-time collect phase. Pokud Turso DB byla docasne nedostupna, build pada s `LibsqlError: URL_INVALID` (videno pri lokalnim testu s prazdnym DB URL)
   - **Vercel retry** — email rika "2 deployments failed" — casto se jedna o preview + production deploy ze stejneho push, oba failnou ze stejneho duvodu

### Zaver

**Tento task je pravdepodobne uz resolved.** Nasledujici commity se deploynuly uspesne. Neni co fixovat v kodu.

### Doporuceni pro prevenci

Pokud OG images failuji pri buildu kvuli nedostupne DB:
1. Pridat fallback do `getSiteFacts()` — vraci default hodnoty pokud DB neni dostupna
2. Nebo pridat `try/catch` do OG image generatoru — vraci staticke fallback OG image

Ale to je enhancement, ne kriticka oprava.

## Soubory k editovat
ZADNE — problem je pravdepodobne resolved.
