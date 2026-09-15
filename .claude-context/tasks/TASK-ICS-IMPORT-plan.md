# TASK #1: Import ICS rezervací z Google Calendar do DB

## Status: PLÁN HOTOVÝ — čeká na implementaci

## Analýza problému

### Hlavní příčina 500 chyby
**Soubor `app/api/admin/fix-data/route.ts` je UNTRACKED v gitu** — nikdy nebyl commitnut ani deploynut na Vercel. Na produkci endpoint neexistuje → HTTP 404 (nebo 500 pokud je redirect/middleware problém).

```
$ git status -- app/api/admin/fix-data/route.ts
Untracked files: app/api/admin/fix-data/route.ts
```

### Sekundární bugy v kódu route.ts (opravit PŘED commitem)

#### Bug 1: Girl name alias "eliška" → "eliska" nefunguje
- Řádek 49: `'eliška': 'eliska'` — hledá v mapě klíč `eliska` (bez háčku)
- Ale v DB je jméno `Eliška`, takže v mapě je klíč `eliška` (lowercase S háčkem)
- `girlMap.get('eliska')` vrátí `undefined`
- Fallback `startsWith` (řádky 54-60) by měl zachytit (`"eliška".startsWith("eli")`) — ale je to NESPOLEHLIVÉ (mohlo by matchnout jiné jméno)
- **FIX:** Alias by měl být `'eliška': 'eliška'` — ale to nedává smysl. Lepší: rovnou použít hardcoded girl ID mapping z tasku místo DB lookupu.

#### Bug 2: Hardcoded ID mapping je spolehlivější
Task poskytuje přesný mapping:
```
Anetta=41, Dana=42, Elizabeth=21, Eliška=44, Ema=57, Emily=28, 
Katy=31, Kim=46, Luna=22, Lyra=43, Natalie=26, Nika=25, Nina=56, 
Sara=20, Timea=55, Viktoria=50
```
Doporučuji nahradit nespolehlivý DB lookup + alias system tímto přímým mappingem. Spolehlivější a jednodušší.

#### Bug 3: "Caty" → "Katy" alias funguje, ale jen náhodou
- V JSON: `"girl": "Caty"` → lowercase `caty`
- Alias `caty → katy` → hledá `katy` v mapě
- Záleží na tom, jestli DB jméno je přesně `Katy` (lowercase `katy`)
- S hardcoded mappingem by stačilo přidat `'caty': 31`

#### Bug 4: Chybí try/catch kolem DB operací
- Jakákoliv DB chyba (constraint violation, connection error) vyhodí unhandled exception → 500
- Měl by být top-level try/catch s error logováním

## Parsed data (z /tmp/ics_import.json)
- 21 budoucích rezervací
- Datumový rozsah: 2026-09-15 až 2026-09-18
- Girls: Emily (10x), Nika (6x), Kim (2x), Caty/Katy (1x), Eliška (1x), Victoria/Viktoria (1x — v JSON girl="Eliška" ale summary říká "Victoria")
- fixPending: true (smaže starou pending booking #1)

## Plán implementace

### Krok 1: Opravit route.ts
1. **Přidat hardcoded girl name → ID mapping** (jako fallback nebo primary)
   ```typescript
   const GIRL_ID_MAP: Record<string, number> = {
     'anetta': 41, 'dana': 42, 'elizabeth': 21, 'eliška': 44, 'eliska': 44,
     'ema': 57, 'emily': 28, 'katy': 31, 'caty': 31, 'kim': 46,
     'luna': 22, 'lyra': 43, 'natalie': 26, 'nika': 25, 'nina': 56,
     'sara': 20, 'timea': 55, 'viktoria': 50, 'victoria': 50,
   };
   ```

2. **Přidat try/catch kolem celého POST handleru** s error response

3. **Zachovat DB lookup jako primary** (pro budoucí dívky), hardcoded mapping jako fallback

### Krok 2: Commit + Deploy
1. `git add app/api/admin/fix-data/route.ts`
2. Commit s ostatními staged changes
3. Push → Vercel auto-deploy

### Krok 3: Spustit import
```bash
curl -X POST https://www.lovelygirls.cz/api/admin/fix-data \
  -H "Authorization: Bearer fbbaca95f0e2ef94e6d39cca56ecfac8265a663895a88c19c5f457dc6e2d68fc" \
  -H "Content-Type: application/json" \
  -d @/tmp/ics_import.json
```

### Krok 4: Verifikace
```bash
curl -X GET https://www.lovelygirls.cz/api/admin/fix-data \
  -H "Authorization: Bearer fbbaca95f0e2ef94e6d39cca56ecfac8265a663895a88c19c5f457dc6e2d68fc"
```

## Env vars potřebné na Vercel produkci
- `IMPORT_SECRET` = `fbbaca95f0e2ef94e6d39cca56ecfac8265a663895a88c19c5f457dc6e2d68fc` (ověřit že je set)
- `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (musí být set pro DB přístup)

## Rizika
- Pokud `IMPORT_SECRET` není v Vercel env vars → 401 Unauthorized
- Pokud Turso credentials nejsou set → DB connection error → 500
- Redirect z escx23.vercel.app na www.lovelygirls.cz by neměl blokovat API calls pokud se volá přímo www.lovelygirls.cz
