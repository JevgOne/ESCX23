# TASK-015: Chrome test — Apartment Reviews (hodnocení apartmánů)

**Datum:** 2026-06-21
**Tester:** test-chrome

## Výsledky

### Pobočka Praha 2 (http://localhost:3000/cs/pobocka/praha-2)
- [x] Strana existuje (200 OK) — slug je `praha-2`, NE `vinohrady`
- [x] 18+ Age gate zobrazena správně ("Prohlášení")
- [x] Po kliknutí "Souhlasím" → obsah stránky se zobrazí
- [x] Sekce "Hodnocení apartmánu" přítomna (nadpis viditelný)
- [x] Formulář "Ohodnoťte apartmán" obsahuje:
  - Pole "Vaše jméno" (required)
  - Dropdown "Celkové hodnocení" (required)
  - Dropdown "Čistota"
  - Dropdown "Diskrétnost"
  - Dropdown "Komfort"
  - Textarea "Váš komentář" (required)
  - Tlačítko "Odeslat hodnocení" (pink/primary button)
- [x] 17 review-related DOM elementů (apt-review-form-wrap, apt-review-form, apt-review-field, apt-review-input)
- [x] 2 formy na strance (review form + pravdepodobne age gate)

### Admin panel — recenze apartmánů (/cs/admin/recenze-apartmanu)
- [x] Strana existuje a funguje
- [x] Sidebar: "Recenze apartmanu" odkaz viditelný
- [x] Obsah: "0 recenzí čeká na schválení", "Žádné recenze apartmánů."
- [x] Prázdný stav správně zobrazen (žádné fake data)

## Vizuální hodnocení
- Formulář vypadá profesionálně — dark theme, pink CTA button
- Správné pořadí polí (jméno → celkové → kategorie → komentář)

## Problémy / Poznámky
- URL `/cs/pobocka/vinohrady` → 404 (slug je `praha-2`, ne `vinohrady`)
  - DB: locations.name = 'praha-2', display_name = 'Nové Město, Praha 2'
  - Toto je správné chování — "vinohrady" není slug v DB

## Status: PASS
