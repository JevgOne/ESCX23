# TASK-014: FAQ na hashtag strnkach -- kontextove relevantni ke kazdemu tagu

**Datum:** 2026-09-03
**Status:** Plan hotovy, ceka na implementaci

---

## 1. PROBLEM

FAQ sekce na hashtag landing strankach zobrazuji genericke otazky, ktere nesouvisejici s konkretnim hashtagem. Napriklad na strance "Cernovlasky Praha" je FAQ "Jak dlouhe je standardni setkani?" misto otazek specifickych pro cernovlasky.

Dalsi problem: 22 hashtagu z TAG_NAMES nema zadny HASHTAG_CONTENT (zadne FAQ, intro, ani metaDesc) -- zobrazuji se jen s fallback meta description a bez FAQ sekce.

---

## 2. AKTUALNI STAV

### Soubor: `lib/seo/landing-content.ts`

### Hashtags S custom obsahem (13):

| # | Slug | FAQ count | Relevance | Problem |
|---|------|-----------|-----------|---------|
| 1 | `blondynky-praha` | 5 | OK | -- |
| 2 | `brunetky-praha` | 4 | OK | -- |
| 3 | `cernovlasky-praha` | 1 | **GENERIC** | FAQ "Jak dlouhe je standardni setkani?" neni o cernovlaskach |
| 4 | `gfe-praha` | 5 | OK | -- |
| 5 | `studentky-praha` | 4 | OK | -- |
| 6 | `spolecnice-praha` | 4 | OK | -- |
| 7 | `prirodni-poprsi` | 4 | OK | -- |
| 8 | `tetovani` | 1 | OK ale malo | Jen 1 otazka, pridat 2-3 dalsi |
| 9 | `escort-prague` | 5 | OK | -- |
| 10 | `escort-praha` | 3 | OK | -- |
| 11 | `sex-praha` | 3 | OK | -- |
| 12 | `vip-escort-praha` | 2 | OK | -- |
| 13 | `luxusni-spolecnice-praha` | 2 | OK | -- |

### Hashtags BEZ obsahu (22 -- zadne FAQ, intro, metaDesc):

| # | Slug | Cesky nazev |
|---|------|-------------|
| 1 | `girlfriend-experience` | Girlfriend Experience |
| 2 | `mlade-holky` | Mlade spolecnice |
| 3 | `holky-praha` | Spolecnice Praha |
| 4 | `ceske-holky` | Ceske spolecnice |
| 5 | `ruske-holky` | Ruske spolecnice |
| 6 | `ukrajinske-holky` | Ukrajinske spolecnice |
| 7 | `piercing-holky` | Piercing |
| 8 | `plne-rty` | Plne rty |
| 9 | `dlouhe-nohy` | Dlouhe nohy |
| 10 | `fit-holky` | Fit telo |
| 11 | `stihla-postava` | Stihla postava |
| 12 | `krivky` | Krivky |
| 13 | `velka-prsa` | Velka prsa |
| 14 | `kratke-vlasy` | Kratke vlasy |
| 15 | `dlouhe-vlasy` | Dlouhe vlasy |
| 16 | `milf-praha` | MILF Praha |
| 17 | `modre-oci` | Modre oci |
| 18 | `exoticke-krasky` | Exoticke krasky |
| 19 | `luxusni-sluzby` | Luxusni sluzby |
| 20 | `elegantni-holky` | Elegantni spolecnice |
| 21 | `sexy-holky` | Sexy spolecnice |
| 22 | `krasne-holky` | Krasne spolecnice |
| 23 | `hot-holky-praha` | Hot spolecnice Praha |
| 24 | `dokonale-telo` | Dokonale telo |

**Poznamka:** `robots: { index: !!content }` v generateMetadata znamena, ze hashtag stranky BEZ HASHTAG_CONTENT maji `noindex`. Takze nemaji FAQ a Google je neindexuje. To je spravne chovani -- neni nutne pridavat content pro vsechny.

---

## 3. CO OPRAVIT

### A) Opravit genericke FAQ (1 hashtag)

**`cernovlasky-praha`** -- nahradit genericky FAQ specifickymi otazkami o cernovlaskach:

Stare FAQ (1 otazka):
- "Jak dlouhe je standardni setkani?" -- GENERIC, neni o cernovlaskach

Nove FAQ (4 otazky):
1. "Kolik cernovlasek mate aktualne k dispozici?" / "How many dark-haired companions are currently available?"
   - Odpoved: Aktualni pocet a dostupnost v rozvrhu.
2. "Jsou fotografie cernovlasek skutecne?" / "Are the dark-haired photos real?"
   - Odpoved: Ano, kazda overena vcetne fotek.
3. "Kde se s cernovlaskou potkam?" / "Where do I meet a dark-haired companion?"
   - Odpoved: V diskretnim apartmanu v centru Prahy ({districts}).
4. "Nabizeji cernovlasky GFE?" / "Do dark-haired companions offer GFE?"
   - Odpoved: Vetsina ano, GFE je v profilu kazde spolecnice.

### B) Rozsirit male FAQ (1 hashtag)

**`tetovani`** -- pridat 2 dalsi otazky:

Stavajici FAQ (1 otazka):
- "Jak rozshle tetovani spolecnice ma?" -- OK, nechat

Pridat:
2. "Mohu si vybrat spolecnici podle stylu tetovani?" / "Can I choose a companion by tattoo style?"
   - Odpoved: Ano, v profilu kazde spolecnice je popis tetovani a fotogalerie.
3. "Maji tetovane spolecnice stejny cenik?" / "Do tattooed companions have the same pricing?"
   - Odpoved: Ano, cenik je jednotny pro vsechny spolecnice.

### C) Hashtags bez obsahu -- NERIDIT (NOINDEX)

22 hashtagu bez HASHTAG_CONTENT ma `robots: { index: false }` -- Google je neindexuje. Pridavat obsah pro vsechny neni priorita. Pokud uzivatel chce indexovat dalsi hashtag stranky, prida se obsah per-hashtag.

**Vyjimka -- zvazit pridani obsahu pro popularni hashtags z POPULAR_HASHTAGS:**
- `fit-holky` -- je v POPULAR_HASHTAGS ale nema obsah
- `ceske-holky` -- je v POPULAR_HASHTAGS ale nema obsah
- `ukrajinske-holky` -- je v POPULAR_HASHTAGS ale nema obsah
- `luxusni-sluzby` -- je v POPULAR_HASHTAGS ale nema obsah
- `elegantni-holky` -- je v POPULAR_HASHTAGS ale nema obsah

Tyto hashtags jsou v POPULAR_HASHTAGS (pouzivane na homepage a /divky pro cross-linking), ale maji noindex. To znamena ze klient na homepage klika na link ktery vede na noindex stranku bez FAQ/intro. **Doporucuji pridat HASHTAG_CONTENT minimalne pro techto 5 hashtagu.**

---

## 4. IMPLEMENTACNI PLAN

### Soubor ke zmene: `lib/seo/landing-content.ts`

### Krok 1: Opravit `cernovlasky-praha` FAQ
Nahradit 1 generickou otazku 4 specifickymi otazkami o cernovlaskach (vzor: blondynky-praha FAQ ale o cernovlaskach).

### Krok 2: Rozsirit `tetovani` FAQ
Pridat 2 dalsi otazky specificke pro tetovani.

### Krok 3 (volitelne, ale doporuceno): Pridat HASHTAG_CONTENT pro 5 popularnich hashtagu
Pro kazdy pridat: metaDesc, intro, 3-4 FAQ, related slugs.

Hashtags k pridani:
1. `fit-holky` -- FAQ o fitness/sportovnich spolecnicich
2. `ceske-holky` -- FAQ o ceskych spolecnicich (jazyk, mentalita)
3. `ukrajinske-holky` -- FAQ o ukrajinskych spolecnicich (jazyk, dostupnost)
4. `luxusni-sluzby` -- FAQ o premiovych sluzbch
5. `elegantni-holky` -- FAQ o elegantnich spolecnicich

### Content guidelines (stejne jako blog):
- Ton: profesionalni, pristupny, nikdy vulgarni
- 4 jazyky: cs, en, de, uk
- FAQ otazky musi byt VZDY relevantni ke konkretnimu hashtagu
- Pouzivat {districts}, {count}, {companions} tokeny kde to dava smysl
- Min. 3 FAQ na hashtag, idealne 4-5

### Krok 4: Overeni
- Zkontrolovat ze vsechny FAQ v HASHTAG_CONTENT jsou relevantni ke svemu hashtagu
- Overit ze robots.index = true pro vsechny hashtags s HASHTAG_CONTENT
- Build test (npm run build)

---

## 5. ODHAD ROZSAHU

- Krok 1 (cernovlasky fix): ~30 radku zmena
- Krok 2 (tetovani rozsireni): ~20 radku pridano
- Krok 3 (5 novych hashtagu): ~250-350 radku pridano (50-70 na hashtag)
- Celkem: 1 soubor zmenen, ~300-400 radku

---
