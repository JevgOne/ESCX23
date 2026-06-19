# QA Report — TASK-011 (novy): Profil detail — Věk/Váha/Výška box layout

**Datum:** 2026-06-14
**Kontrolor:** kontrolor agent
**Status:** PRE-IMPLEMENTACNI AUDIT — zadani je pending, kód zatím nebyl upraven

---

## Zadani

> Na desktop verzi profilu jsou Věk, Výška, Váha zobrazeny jako pill badges v řadě.
> Uzivatel chce aby byly v boxu/kartě jako na mobilu.
> Komponenta: `components/profil/ProfilDetails.tsx` (řádky 289-351, `.profile-stat-details`)
> Styly: `app/globals.css`

---

## Aktualni stav kódu

### Mobil — .ig-stat-hero (ProfilHero.tsx:206)
- 3-sloupcovy grid: `.profile-stat-hero.ig-stat-hero`
- Kazda bunka: `.profile-stat-hero-cell` s `.psh-num coral` (velke cislo) + `.psh-label` (popisek pod nim)
- Vek pouziva `.psh-num.coral` — gradient coral/magenta barva
- CSS: zobrazen na `@media (max-width: 520px)` (nebo obdobne v ig-stat-hero)

### Desktop — .profile-stat-details (ProfilDetails.tsx:289)
- Flex row pill badges: `.profile-stat-details.profile-desktop-only`
- Vek: jen `.psd-value.psd-value-coral` bez `.psd-label` (zadny popisek "Věk")
- Vyska: `.psd-label` + `.psd-value`
- Vaha: `.psd-label` + `.psd-value`
- Plus dalsi pills: prsa, oci, vlasy, tetovani, piercing, jazyky

---

## ✅ Co je v poradku

- Mobil: `.ig-stat-hero` vizualne odpovida "box/karta" stylu — spravne implementovano v `ProfilHero.tsx:205-225`
- CSS pro `.profile-stat-hero` a `.profile-stat-hero-cell` **uz existuje** v `globals.css:9550-9605` — lze reuzit
- Build prochazi bez chyb (overeno samostatne)

---

## ❌ Co chybi (co implementator musi dodelat)

### 1. Desktop nema box/kartu pro Věk/Výška/Váha

`ProfilDetails.tsx:289-351` pouziva `.profile-stat-details` pill-row.
Uzivatel chce stejny vizual jako mobil (`profile-stat-hero` grid s kartičkami).

**Doporucena zmena:**
Pridat `.profile-stat-hero profile-desktop-only` grid PRED nebo MISTO `.profile-stat-details` pill-row pro prvni 3 fieldy (Věk, Výška, Váha). Zbyvajici pills (prsa, oci, vlasy...) zustat jako pill-row pod tim.

### 2. CSS konflikt — `.profile-stat-hero:not(.ig-stat-hero)` je hidden

`globals.css:3267`:
```css
.profile-stat-hero:not(.ig-stat-hero) {
  display: none !important;
}
```

Toto pravidlo bylo pridano pro mobil layout kde desktop hero nema byt videt.
Pokud implementator prida `.profile-stat-hero` do `ProfilDetails.tsx`, musi toto pravidlo opravit.

**Doporucena zmena:**
Nahradit `.profile-stat-hero:not(.ig-stat-hero)` za `.profile-stat-hero.profile-desktop-only` v media query (mobil skryje desktop-only, desktop zobrazi).
Nebo zkontrolovat jaky je scope — je to v `@media (max-width: ...)`? Pokud ano, `display: none` na mobilu je spravne, ale treba overit ze desktop verze je default zobrazena.

---

## ⚠️ Na co si dat pozor pri implementaci

1. **Nezlomit pill-row pro dalsi fieldy** — prsa/oci/vlasy/tetovani/piercing/jazyky maji zustat jako `.psd-pill` chips pod boxem
2. **Nezlomit mobil** — `.ig-stat-hero` v `ProfilHero.tsx` nesmi byt dotceno
3. **profile-desktop-only** — novy desktop box musi mit tuto classu, jinak bude viditelny i na mobilu kde uz hero box je v `ProfilHero.tsx`
4. **psh-num.coral** pro Věk — overit ze coral gradient barva je zachovana i na desktopu

---

## Soubory ke zmene

| Soubor | Co menit |
|---|---|
| `components/profil/ProfilDetails.tsx` | Radky 288-351 — pridat `.profile-stat-hero` grid pro Věk/Výška/Váha |
| `app/globals.css` | Radek ~3267 — opravit `.profile-stat-hero:not(.ig-stat-hero)` override |

---

## Poznamka pro programatora

Vzor pro desktop hero box je primo v `ProfilHero.tsx:205-225` — zkopirovat strukturu a pridat `.profile-desktop-only` classu na wrapper.
