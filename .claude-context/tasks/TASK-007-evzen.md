# TASK-007 Evžen Verdikt — Kontrola shody se zadáním

**Datum:** 2026-06-02
**Kontrolor:** Evžen the King
**Status: SCHVALENO**

---

## Původní zadání

1. Datumy na pobočky: Žižkov 18.6., Smíchov 25.7.2026
2. Vizuální fix podle screenshotu: eyebrow formátování + stray element u trust karet

---

## Kontrola shody

### 1. Datumy poboček — OK

| Pobočka | Zadání | DB hodnota | Shoda |
|---|---|---|---|
| Žižkov (praha-3) | 18.6.2026 | `2026-06-18` | OK |
| Smíchov (praha-5) | 25.7.2026 | `2026-07-25` | OK |

### 2. Eyebrow fix — OK

- Em dash `— ` přesunuta z JSX textu do CSS `::before` pseudo-elementu
- `letter-spacing: normal` zajišťuje že dash nebude mít roztažené spacing
- Všech 6 homepage komponent (`ActivityFeed`, `GirlsGridSection`, `ContactSteps`, `HashtagCloud`, `LocationsRow`, `ReviewsStrip`) správně používá `section-eyebrow` třídu bez hardcoded dash
- `VipGate.tsx` a `ProfilServices.tsx` používají jiné CSS třídy — nejsou součástí opravy (korektně)

### 3. Trust row overflow — OK

- `.trust-row` (globals.css:1363): `overflow: hidden` — přidáno
- `.trust-icon` (globals.css:1391): `overflow: hidden` — přidáno

---

## Verdikt

**SCHVALENO** — Implementace doslovně odpovídá zadání. Žádné odchylky.
