# TASK-013 Evzen Compliance Report — Opening dates

**Datum:** 2026-06-02
**Kontrolor:** Evzen (compliance checker)
**Verdikt:** SCHVALENO

---

## Puvodni zadani od uzivatele

1. "Zizkov otevirame 18.6 a Smichov 25.7"
2. "nahraj ty oteviracky pobocek"

---

## Bod-po-bodu kontrola shody

### A. Datumy v DB — SPRAVNE

| Pobocka | Zadani | DB hodnota | Shoda |
|---|---|---|---|
| Zizkov (praha-3) | 18.6. | `2026-06-18` | YES |
| Smichov (praha-5) | 25.7. | `2026-07-25` | YES |
| Nove Mesto (praha-2) | (uz otevrena) | `NULL` | YES — spravne nema opening_date |

### B. DB migrace — SPRAVNE

- Sloupec `opening_date TEXT` pridan do tabulky `locations`
- Hodnoty nastaveny spravne (overeno primo v DB)

### C. Queries — SPRAVNE

- `Location` interface obsahuje `openingDate: string | null`
- `getActiveLocations()` vraci `opening_date` z DB
- `getLocationBySlug()` vraci `openingDate`

### D. LocationsRow (homepage) — SPRAVNE

- Hardcoded `preparingSlugs = new Set(['praha-3', 'praha-5'])` nahrazeno date-based logikou
- `isPreparing = loc.openingDate != null && loc.openingDate > today`
- Pouziva `pragueDateISO()` pro Prague timezone (shoda s CLAUDE.md pravidlo #5)
- Zobrazuje datum u badge: "Otevirame . 18.6." — spravny format
- Labels: CS "Otevirame", EN "Opening", DE "Eroffnung", UK "Vidkryttya" — vsechny jazyky pokryty

### E. Rozvrh — SPRAVNE

- Neotevrene lokace filtrovany z location pills:
  `openLocations = dbLocations.filter(l => !l.openingDate || l.openingDate <= today)`
- Uzivatel neuvidi Zizkov/Smichov v rozvrhu pred datem otevreni

### F. Pobocka detail — SPRAVNE

- Opening banner zobrazen pro budouci lokace
- 4-jazykove labels (CS/EN/DE/UK) se spravnou diakritikou a cyrilikou
- Formatovany datum pomoci `formatOpeningDate()`
- Banner obsahuje ikonu, nazev a datum otevreni

### G. Admin CRUD — SPRAVNE

- **List page:** sloupec "Otevreni" pridan do tabulky
- **Edit page:** `<input type="date">` s helper textem "Pokud je v budoucnu, pobocka se zobrazi jako Pripravujeme"
- **Nova page:** stejny date input
- **Actions:** `createPobocka()` i `updatePobocka()` zpracovavaji `opening_date`
- Admin muze menit datumy — zadna skryta funkcnost

### H. CSS — SPRAVNE

- `.pobocka-opening-banner`, `.pobocka-opening-icon`, `.pobocka-opening-title`, `.pobocka-opening-date` styly pridany
- Design pouziva project design tokens (--color-coral, --color-text-muted)

### I. SEO landing content — SPRAVNE

- `LOCATION_CONTENT['praha-3']` — metaDesc, intro, 3 FAQ, relatedHashtags
- `LOCATION_CONTENT['praha-5']` — metaDesc, intro, 3 FAQ, relatedHashtags
- FAQ obsahuje spravne datumy: "18. cervna 2026" (Zizkov), "25. cervence 2026" (Smichov)
- Texty ve 4 jazycich (CS/EN/DE/UK)
- CS texty maji diakritiku, UK texty maji cyrilici

### J. Footer — SPRAVNE

- Neotevrene lokace zobrazuji suffix " — brzy" (CS) / "soon" (EN) / "bald" (DE) / "skoro" (UK)
- Lokace zustavaji v navigaci (nejsou skryte) — spravne, zadne schovavani

### K. Automaticky prechod — SPRAVNE

- Logika `openingDate > today` zajistuje, ze v den otevreni se pobocka automaticky "otevre"
- Neni potreba manualni zasah — datum v DB je jediny zdroj pravdy

---

## Kontrola absolutnich pravidel z CLAUDE.md

| Pravidlo | Shoda |
|---|---|
| Server-Side Rendering | YES — zadny 'use client' pridan |
| Funguje bez JS | YES — datum je server-rendered, zadny JS pro zobrazeni |
| Prague timezone | YES — `pragueDateISO()` pouziva `Europe/Prague` |
| Nic se neschovava | YES — lokace zustavaji v navigaci/footer, jen rozvrh filtruje |
| Admin najde vse | YES — opening_date v admin listu a edit formulari |
| Zadne zkratky v UI | YES — plne nazvy vsude |

---

## Nalezene odchylky

### Minor (non-blocker)

1. **ISR cache na pobocka detail page** — `revalidate = 3600` (1h). V den otevreni muze banner pretrvat az hodinu navic. Ale CLAUDE.md explicitne povoluje ISR pro pobockove stranky. Akceptovatelne.

2. **Drobny typo v UK textu** — "Smichov" v UK textech obsahuje latinkove "i" misto cyrilickeho. QA oznacilo jako non-blocker. Souhlasim — neblokuje produkci.

---

## VERDIKT: SCHVALENO

Implementace PRESNE odpovida puvodnimu zadani:
- Zizkov = 18.6.2026 — spravne
- Smichov = 25.7.2026 — spravne
- Opening dates v DB, automaticka logika, vsechny UI casti pokryty
- Admin muze menit datumy
- 4 jazyky (CS/EN/DE/UK)
- QA bugy opraveny (diakritika, cyrilice, deduplikace)
- Zadne poruseni absolutnich pravidel z CLAUDE.md
