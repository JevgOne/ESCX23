# TASK-013-chrome-retest2 — Chrome Re-test #2: Homepage po g.vip fix

**Datum:** 2026-06-02  
**Tester:** TEST-CHROME  
**Dev server:** http://localhost:3000

---

## Souhrn

| # | Test | Výsledek |
|---|------|----------|
| 1 | Homepage se renderuje bez erroru | PASS |
| 2 | LocationsRow — Žižkov/Smíchov badges | PASS |
| 3 | Stories row — funguje | INFO (viz detaily) |
| 4 | Girls grid — karty se zobrazují | PASS |

---

## Detaily

### TEST 1: Homepage render — PASS

**URL:** http://localhost:3000/cs  
**Title:** "LovelyGirls Praha — Ověřené společnice"  
**Crash:** false  
**Console errors:** 0

Homepage se renderuje správně. Žádné SQLITE errory, žádný `__next_error__`. Age gate se zobrazí (očekávané chování).

---

### TEST 2: LocationsRow badges — PASS

Playwright zachytil tyto viditelné badge elementy:
```
"Otevíráme · 18.6."   ← Žižkov (Praha 3)
"Otevíráme · 25.7."   ← Smíchov (Praha 5)
```

- `locRowElements`: 28 (LocationsRow sekce plně renderována)
- Badge text přesně odpovídá zadání

---

### TEST 3: Stories row — INFO

Sekce s nadpisem **"Co je nového"** je přítomna v headings. Homepage obsahuje `<video>` tag v HTML (hasVideoInContent: true). Nicméně žádné CSS třídy s `story`/`stories`/`reel` nebyly nalezeny — sekce je implementována pod jiným názvem nebo classname. Vizuálně v Chrome stránka scrollovala přes tuto sekci bez erroru.

**Závěr:** Stories sekce nevyhazuje error (žádné console errors), ale Playwright ji nenašel pod očekávanými CSS třídami. Není jasné zda chybí nebo je implementována jinak.

---

### TEST 4: Girls grid — PASS

- `girlCards` (article/companion class): 7
- `anyCards` (article + card): 50
- Karty se zobrazují s reálnými daty (Emily, Anetta, Natalie aj.)
- Data: výška, prsa, váha, věk, jazyk, rating

Viditelný text z girls sekce:
```
Emily — Nové Město, Praha 2 — Výška: 176, Prsa: 2, Váha: 60, Věk: 20
Anetta — Nové Město, Praha 2 — Výška: 165, Prsa: 1, Váha: 50, Věk: 19
Natalie — Nové Město, Praha 2 — Výška: 170, Prsa: 4, Váha: ...
```

---

## Navigace na homepage — nalezené sekce (headings)

1. "Společnice Praha — Luxusní escort"
2. "Naše společnice"
3. "Co je nového" ← pravděpodobně stories
4. "Ověřené recenze"
5. "Oblíbené kategorie"
6. "Diskrétní apartmány v Praze" ← LocationsRow
7. "3 kroky k diskrétnímu setkání"
8. "Máte čas dnes?"

---

## Závěr

Homepage funguje. Blokující bugy (s.caption, g.vip) jsou opraveny. LocationsRow badges "Otevíráme · 18.6." a "Otevíráme · 25.7." jsou viditelné v Chrome. Girls grid renderuje reálná data.
