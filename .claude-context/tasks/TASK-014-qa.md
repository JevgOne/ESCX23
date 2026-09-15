# QA Report — Task #14: FAQ relevance fix (cernovlasky-praha, tetovani)

**Datum:** 2026-09-03
**Kontrolor:** kontrolor agent
**Zadání:** Ověřit že FAQ jsou specifické pro dané téma, ne generické

---

## 1. Simplify — čistota kódu

### `cernovlasky-praha` FAQ (lib/seo/landing-content.ts:117–134)
- 4 FAQ otázky, každá ve 4 jazycích (cs/en/de/uk)
- Struktura konzistentní se zbytkem souboru
- Odpovědi stručné a relevantní
- Žádný dead code, žádné duplicity

### `tetovani` FAQ (lib/seo/landing-content.ts:291–304)
- 3 FAQ otázky, každá ve 4 jazycích
- Struktura konzistentní
- Žádný zbytečný kód

**Simplify verdict: PASS**

---

## 2. Debug

### TypeScript check
- **Produkční kód: 0 chyb** ✅
- Pouze `e2e/tests/full-test.spec.ts(26)` — nesouvisí

**Debug verdict: PASS**

---

## 3. Reverzní kontrola — FAQ relevance

### Zadání uživatele
> "FAQ at se hodi k danemu tematu"

### `cernovlasky-praha` — 4 FAQ (řádky 119–133)

| # | Otázka (CS) | Tematická relevance |
|---|-------------|---------------------|
| 1 | Kolik černovlásek máte aktuálně k dispozici? | ✅ Specifická — ptá se na počet **černovlásek** |
| 2 | Jsou fotografie černovlásek skutečné? | ✅ Specifická — ptá se na foto **černovlásek** |
| 3 | Kde se s černovláskou potkám? | ✅ Specifická — ptá se na setkání s **černovláskou** |
| 4 | Nabízejí černovlásky GFE? | ✅ Specifická — ptá se na služby **černovlásek** |

Všechny 4 otázky explicitně zmiňují „černovlásky" / „dark-haired" / „schwarzhaarige" — jsou tematicky ukotvené, ne generické.

### `tetovani` — 3 FAQ (řádky 293–303)

| # | Otázka (CS) | Tematická relevance |
|---|-------------|---------------------|
| 1 | Jak rozsáhlé tetování společnice má? | ✅ Specifická — přímo o **tetování** a jeho rozsahu |
| 2 | Mohu si vybrat společnici podle stylu tetování? | ✅ Specifická — výběr podle **tetování** |
| 3 | Mají tetované společnice stejný ceník? | ✅ Specifická — ceny **tetovaných** společnic |

Všechny 3 otázky se točí kolem tématu tetování. Žádná generická otázka (typ „jak se zarezervovat" nebo „jsou fotky reálné" bez vazby na téma).

**Reverzní kontrola verdict: PASS**

---

## Celkový výsledek

| Kontrola | Výsledek |
|----------|----------|
| 1. Simplify | PASS ✅ |
| 2. Debug | PASS ✅ |
| 3. Reverzní kontrola | PASS ✅ |

**CELKOVÝ VERDICT: APPROVED — FAQ jsou tematicky relevantní pro oba hashtagy.**

### Poznámky
- `cernovlasky-praha`: 4 FAQ, všechny explicitně tematicky ukotvené (zmiňují „černovlásky" v otázce)
- `tetovani`: 3 FAQ, všechny o tetování (rozsah, styl, ceny)
- TS chyba v e2e testovacím souboru přetrvává — nesouvisí s touto implementací
