# TASK-014: Chrome test — Auth login (aktualizace)

**Datum:** 2026-06-21
**Tester:** test-chrome

## Výsledky

### Admin login (http://localhost:3000/cs/admin/login)
- [x] Checkbox "Zapamatovat si mě (7 dní)" je viditelný a unchecked by default
- [x] Login BEZ checkboxu funguje
- [x] Redirect po přihlášení: `/cs/admin` (Dashboard)
- [x] "Recenze apartmanu" je v sidebaru adminu
- [x] `/cs/admin/recenze-apartmanu` strana existuje, funguje (zobrazuje "0 recenzí čeká")
- Poznámka: email v DB je `info@lovelygirls.cz` (ne admin@)

### Studio login (http://localhost:3000/cs/studio/login)
- [x] Checkbox "Zapamatovat si mě (7 dní)" viditelný
- [x] Login funguje → redirect na `/cs/studio` ("Ahoj Anetta")
- [x] Studio dashboard: profil 100%, dostupnost, statistiky — OK

## PASS

## Vedlejší nalezy
- middleware.ts deprecated v Next.js 16 → treba prejmenovat na proxy.ts (500 chyby při zátěži)
- Email admina je info@lovelygirls.cz, ne admin@lovelygirls.cz

---

# TASK-014 (TEAM-LEAD ASSIGNMENT): Finální Chrome test — 2026-06-23

**Tester:** test-chrome  
**Stránky otevřeny v Chrome:** localhost:3000

## 1. Šedý badge na /cs/rozvrh?day=2026-06-26

**Výsledek: PROBLÉM — Katy a Kim na tomto dni CHYBÍ**

- Na 2026-06-26 (pátek) se zobrazují pouze: **Anetta, Eliška, Sara**
- **Katy**: schedule jen pro day_of_week 0 (Po), 2 (St), 3 (Čt) — pátek (day=4) chybí v `girl_schedules`
- **Kim**: neexistuje v DB vůbec (`girls` tabulka ji neobsahuje)

**Technicky badge CSS funguje správně:** třída `girl-photo-time-future` má barvu `#94a3b8` (šedá/slate).
Logika v `lib/queries.ts:820-823` je správná — pro dny 2+ dopředu: `status = 'off'`, šedý badge s časy.

**Potřeba:** Přidat Katy do rozvrhu na pátek + vytvořit Kim v DB.

## 2. Favicon

**Výsledek: PASS**

- `app/favicon.ico` — PNG 48x48 (ženská silueta, 2 KB)
- `app/icon.svg` — SVG s plnou ženskou siluetou (LovelyGirls logo path)
- Všechny favicon `<link>` tagy v `<head>` správně nastaveny
- Není tam "L" — je tam logo ženy

## 3. Sekce Styl & Šatník na profilu

**Výsledek: N/A — data v DB nejsou**

- `style_wardrobe = NULL` pro VŠECHNY dívky v `data/app.db`
- Sekce správně skryta dle logiky v `ProfilDetails.tsx:383` (`if (!styleWardrobe) return null`)
- Sekci nelze testovat vizuálně dokud admin nevyplní checkboxy v edit formuláři

## 4. /cs/podminky — meta robots noindex

**Výsledek: PASS**

Potvrzeno v HTML `<head>`:
```html
<meta name="robots" content="noindex, follow"/>
```

## 5. Admin /cs/admin/divky — editace, sekce Styl & Šatník checkboxy

**Výsledek: PASS (kód) / N/A (vizuální UI)**

- Admin panel správně přesměrovává na login (auth funguje)
- Kód v `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx:696` obsahuje sekci "Styl & Šatník"
- Checkboxy pro `style_types` (styl oblékání) a `wardrobe_items` (sexy outfity) EXISTUJÍ v kódu
- Vizuální UI test bez hesla nemožný

## Shrnutí

| Test | Status |
|------|--------|
| Šedý badge Katy/Kim na 26.6. | FAIL — chybí v rozvrhu/DB |
| Favicon — ženská silueta | PASS |
| Šatník sekce na profilu | N/A (DB bez dat) |
| /podminky noindex | PASS |
| Admin edit — Styl & Šatník checkboxy | PASS (kód) |
