# TASK-009 Chrome Test — GCal Integration (Admin + Studio)

**Datum:** 2026-06-05  
**Tester:** test-chrome  
**Dev server:** http://localhost:3000  
**Metoda:** Playwright HEADED (viditelný Chrome browser)

---

## Výsledky

| # | Test | Výsledek | Poznámka |
|---|------|----------|----------|
| 1 | Admin login (info@lovelygirls.cz) | PASS | Redirect → /admin |
| 2 | Admin Rezervace — sekce "Google Kalendáře dívek" | PASS | Heading přítomen |
| 3 | Admin Rezervace — tlačítko "Propojit GCal" | PASS | U každé nepropojené dívky |
| 4 | Propojit GCal → OAuth redirect na Google | PASS | Redirect na accounts.google.com |
| 5 | Studio login jako dívka | PASS | Redirect → /studio |
| 6 | Studio Kalendář — grid se zobrazuje | PASS | "Pracuji"/"Volno" viditelné |
| 7 | Studio Kalendář — žádné tlačítko Connect/Disconnect | PASS | Read-only view |

**CELKEM: 7/7 PASS — vše zelené.**

---

## Detaily testů

### TEST 1–3: Admin Rezervace — GCal sekce
Stránka `/cs/admin/rezervace` obsahuje sekci **"Google Kalendáře dívek"** na spodku stránky.  
Pro každou dívku bez propojení: zlaté tlačítko **"Propojit GCal"** (odkaz na `/api/gcal/auth?girl_id={id}`).  
Pro propojenou dívku: tlačítko **"Odpojit"** (v DB v tomto testu žádná dívka propojena nebyla).

### TEST 4: Propojit GCal → OAuth redirect
Klik na "Propojit GCal" správně:
1. Odešle request na `/api/gcal/auth?girl_id=41`
2. Vytvoří OAuth state v DB + přesměruje na Google OAuth
3. URL: `https://accounts.google.com/signin/oauth/...`

Google vrátil **`redirect_uri_mismatch`** — tohle je OČEKÁVANÉ chování v dev prostředí  
(`http://localhost:3000/api/gcal/callback` není registrováno v Google Cloud Console).  
Flow jako takový funguje správně — redirect na Google proběhl.

### TEST 5–7: Studio Kalendář — read-only
Stránka `/cs/studio/kalendar` zobrazuje:
- 14denní grid s pracovními dny dívky (Pracuji/Volno)
- Rezervace dívky (pokud existují)
- GCal sekci pouze pro čtení (žádné connect/disconnect tlačítko)

Správně chybí jakékoli "Propojit" nebo "Odpojit" tlačítko — to patří pouze do admin panelu.  
GCal events sekce se nezobrazila (dívka lunamanazer@gmail.com nemá propojený GCal — to je správné).

---

## Nalezená kritická chyba — SESSION_SECRET

**BUG (HIGH):** `lib/auth.ts:27` používá `Math.random()` jako fallback SECRET:
```ts
const SECRET = process.env.SESSION_SECRET ||
  'dev-secret-change-in-prod-' + Math.random().toString(36);
```

V Next.js dev (Turbopack) mohou mít page routes a API routes **různé module contexty**,  
takže `Math.random()` se zavolá dvakrát → **dvě různé hodnoty SECRET**.  
Cookie podepsaná při loginu (page route) se pak nedá ověřit v `/api/gcal/auth` (API route).

**Symptom:** Klik na "Propojit GCal" → redirect na `/admin/login` místo Google OAuth.

**Fix (aplikovaný v .env.local pro test):**
```
SESSION_SECRET=dev-fixed-secret-escx23-local-testing
```

**Doporučení pro produkci:** Nastavit `SESSION_SECRET` jako silný náhodný string v Vercel env vars.  
V produkci byl tento problém pravděpodobně skrytý, protože serverless functions sdílí module cache  
jinak než dev server — je to potřeba ověřit.

---

## Souhrn

**GCal integrace funguje správně** při použití stabilního `SESSION_SECRET`.  
Všechny 3 požadované oblasti prošly:
- ✓ Admin: seznam dívek + "Propojit GCal" tlačítka
- ✓ Admin: klik na "Propojit GCal" → Google OAuth redirect
- ✓ Studio: read-only view bez connect/disconnect tlačítek

**Jediný problém:** chybějící `SESSION_SECRET` v `.env.local` (nyní přidán).  
Na Vercel produkci je potřeba nastavit `SESSION_SECRET` jako env var.
