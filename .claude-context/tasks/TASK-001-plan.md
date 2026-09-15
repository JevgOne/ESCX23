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
- Fallback `startsWith` (řádky 54-60) by měl zachytit (`"eliška".startsWith("eli")`) — ale je to NESPOLEHLIVÉ (mohlo by matchnout jiné jméno začínající na "Eli" jako Elizabeth)
- **FIX:** Použít hardcoded girl ID mapping místo nespolehlivého DB lookup + alias

#### Bug 2: startsWith fallback matchne špatně
- `"eliška".substring(0, 3)` = `"eli"` — ale `"elizabeth".startsWith("eli")` = **TRUE**!
- Pokud Elizabeth (id=21) je v mapě PŘED Eliškou (id=44), fallback vrátí špatné ID
- Map iterace v JS je v pořadí insertion — záleží na pořadí DB výsledků

#### Bug 3: Hardcoded ID mapping je spolehlivější
Task poskytuje přesný mapping:
```
Anetta=41, Dana=42, Elizabeth=21, Eliška=44, Ema=57, Emily=28, 
Katy=31, Kim=46, Luna=22, Lyra=43, Natalie=26, Nika=25, Nina=56, 
Sara=20, Timea=55, Viktoria=50
```

#### Bug 4: Chybí try/catch kolem DB operací
- Jakákoliv DB chyba vyhodí unhandled exception → 500
- Měl by být top-level try/catch s error logováním

## Parsed data (z /tmp/ics_import.json)
- 21 budoucích rezervací
- Datumový rozsah: 2026-09-15 až 2026-09-18
- Girls: Emily (10x), Nika (6x), Kim (2x), Caty/Katy (1x), Eliška (1x)
- fixPending: true (smaže starou pending booking #1)

## Plán implementace

### Krok 1: Opravit route.ts — girl name resolution
Nahradit nespolehlivý alias+startsWith systém hardcoded fallback mappingem:

```typescript
// Hardcoded fallback — reliable mapping from task spec
const GIRL_ID_FALLBACK: Record<string, number> = {
  'anetta': 41, 'dana': 42, 'elizabeth': 21, 'eliška': 44, 'eliska': 44,
  'ema': 57, 'emily': 28, 'katy': 31, 'caty': 31, 'kim': 46,
  'luna': 22, 'lyra': 43, 'natalie': 26, 'nika': 25, 'nina': 56,
  'sara': 20, 'timea': 55, 'viktoria': 50, 'victoria': 50,
};
```

Girl resolution flow:
1. DB lookup (primary — catches future new girls)
2. Fallback to `GIRL_ID_FALLBACK` mapping
3. Skip with error message if neither works

### Krok 2: Přidat try/catch
Obalit celý POST handler v try/catch, vracet `{ error, details }` s 500 statusem.

### Krok 3: Smazat nespolehlivý alias + startsWith systém
Odstranit řádky 47-61 (aliases object + startsWith loop), nahradit fallback mappingem.

### Krok 4: Commit + Deploy
1. `git add app/api/admin/fix-data/route.ts`
2. Commit
3. Push → Vercel auto-deploy

### Krok 5: Spustit import
```bash
curl -X POST https://www.lovelygirls.cz/api/admin/fix-data \
  -H "Authorization: Bearer fbbaca95f0e2ef94e6d39cca56ecfac8265a663895a88c19c5f457dc6e2d68fc" \
  -H "Content-Type: application/json" \
  -d @/tmp/ics_import.json
```

### Krok 6: Verifikace
```bash
curl -X GET https://www.lovelygirls.cz/api/admin/fix-data \
  -H "Authorization: Bearer fbbaca95f0e2ef94e6d39cca56ecfac8265a663895a88c19c5f457dc6e2d68fc"
```

## Soubory k editaci
1. **`app/api/admin/fix-data/route.ts`** — opravit bugy, pak commitnout (UNTRACKED)

## Env vars potřebné na Vercel produkci
- `IMPORT_SECRET` = `fbbaca95f0e2ef94e6d39cca56ecfac8265a663895a88c19c5f457dc6e2d68fc` (ověřit že je set)
- `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (musí být set pro DB přístup)

## Rizika
- Pokud `IMPORT_SECRET` není v Vercel env vars → 401 Unauthorized
- Pokud Turso credentials nejsou set → DB connection error → 500
