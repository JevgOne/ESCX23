# Analýza Google Calendar ICS Exportů — LovelyGirls Booking Historie

**Datum analýzy:** 2026-09-13
**Zdroj dat:** 14 ICS souborů z `/Users/zen/Desktop/lovely10girls@gmail/`

---

## 1. Přehled souborů

| Kalendář | Velikost | VEVENT | Stav |
|----------|----------|--------|------|
| Emily | 44 717 B | 142 | Nejvíce aktivní |
| Luna | 27 719 B | 89 | Aktivní |
| Caty | 26 706 B | 87 | Aktivní |
| Nika | 26 756 B | 87 | Aktivní |
| Kim | 23 955 B | 76 | Aktivní |
| Eliška (ffdc) | 20 646 B | 65 | Aktivní (sdílený s Victoria) |
| Shared (lovely10girls) | 9 629 B | 31 | Operátorský kalendář |
| Aneta | 9 364 B | 30 | Aktivní (ukončena ~červenec 2026) |
| Nina | 6 219 B | 20 | Nová (od srpna 2026) |
| Natalie | 3 275 B | 10 | Krátké období (červen-červenec 2026) |
| Ema | 782 B | 2 | Nová (září 2026) |
| Dana | 182 B | 0 | Prázdný |
| Sara | 182 B | 0 | Prázdný |
| Timea | 183 B | 0 | Prázdný |

**Celkem: 639 VEVENT záznamů v 11 aktivních kalendářích.**

---

## 2. Celkové statistiky

| Metrika | Hodnota |
|---------|---------|
| Celkem rezervací | 639 |
| Aktivních kalendářů | 11 |
| Prázdných kalendářů | 3 (Dana, Sara, Timea) |
| Unikátních klient kódů | 454 |
| Stálí klienti (2+ návštěv) | 89 (19.6% ze všech klientů) |
| Klienti s 2+ dívkami | 38 (8.4%) |
| Telegram rezervací | 20 (3.1%) |
| Nových klientů (NO/Novy/Nový) | 102 (16.0%) |
| Se slevou | 19 (3.0%) |
| No-shows (explicitní) | 0 (žádné záznamy) |
| Průměrná délka schůzky | ~57 min |

### Poznámky k no-shows
V žádném ICS souboru nebyla nalezena klíčová slova "nepřišel", "cancel", "storno", "no-show". Všechny VEVENT záznamy mají `STATUS:CONFIRMED`. To znamená buď:
- No-shows se nesledují v kalendáři (pravděpodobné — mazání eventu místo označení)
- Nebo se no-shows neodehrávají (méně pravděpodobné)

**Doporučení pro booking systém:** Zavést explicitní status `NO_SHOW` u rezervací.

---

## 3. Statistiky per dívka

| Dívka | Celkem | Unique klienti | Stálí (2+) | Telegram | Nový | Sleva | Avg min |
|-------|--------|---------------|------------|----------|------|-------|---------|
| Emily | 142 | 82 | 27 | 4 | 32 | 0 | 61 |
| Luna | 89 | 73 | 10 | 7 | 15 | 2 | 57 |
| Caty | 87 | 81 | 4 | 3 | 16 | 5 | 56 |
| Nika | 87 | 76 | 8 | 2 | 15 | 7 | 62 |
| Kim | 76 | 65 | 6 | 2 | 11 | 2 | 53 |
| Eliška/Victoria | 65 | 57 | 6 | 1 | 0* | 2 | 56 |
| Aneta | 30 | 29 | 1 | 0 | 5 | 0 | 49 |
| Nina | 20 | 20 | 0 | 0 | 5 | 1 | 50 |
| Natalie | 10 | 10 | 0 | 1 | 3 | 0 | 50 |
| Ema | 2 | 2 | 0 | 0 | 0 | 0 | 60 |

*Eliška/Victoria: "Nový" prefix nepoužívá tato operátorka (jiný styl pojmenování).

### Časové rozsahy

| Dívka | Od | Do | Poznámka |
|-------|----|----|----------|
| Emily | 2025-02-25 | 2026-09-10 | Nejdelší historie (19+ měsíců) |
| Caty | 2025-02-24 | 2026-09-12 | Nejdelší historie |
| Nika | 2025-02-21 | 2026-09-09 | Nejdelší historie |
| Luna | 2026-05-26 | 2026-08-09 | ~3 měsíce |
| Kim | 2026-05-25 | 2026-09-11 | ~4 měsíce |
| Eliška/Victoria | 2026-05-26 | 2026-09-12 | ~4 měsíce |
| Aneta | 2026-05-26 | 2026-07-16 | Ukončena |
| Natalie | 2026-06-29 | 2026-07-06 | Velmi krátké (8 dní) |
| Nina | 2026-08-23 | 2026-09-05 | Nová |
| Ema | 2026-09-02 | 2026-09-03 | Nová |
| Shared | 2023-03-21 | 2026-09-06 | Operátorský — nejstarší data |

---

## 4. Konvence pojmenování klientů

### Formát SUMMARY
```
{JménoDívky} {KlientKód} [poznámky]
```

### Distribuce vzorů klient kódů

| Vzor | Počet | % | Příklady |
|------|-------|---|----------|
| Jméno+DDMM | 239 | 52.6% | `Petr1507`, `Martin2004`, `Vladimír1806` |
| Novy/NO+čísla | 77 | 17.0% | `Novy0409`, `NO27/07`, `NO01/26` |
| Iniciály+čísla | 41 | 9.0% | `AB08`, `DK`, `K07` |
| Klient+čísla | 40 | 8.8% | `Klient04093`, `Klient1507` |
| Jiné | 54 | 11.9% | `HynekSvoboda`, `DevilDJ telegram`, `Bob` |
| Cizinec+čísla | 3 | 0.7% | `Cizinec140301`, `Cizinec711` |

### Klíčové poznatky pro booking systém
1. **Dominantní formát: Jméno+DDMM** (52.6%) — odpovídá požadavku uživatele "KLIENT1309"
2. **DDMM = pravděpodobně datum prvního kontaktu**, ne datum narození (DD=01-31, MM=01-12)
3. **"Nový/NO" prefix** = nový klient, čísla za ním jsou unikátní identifikátor
4. **"Klient" prefix** = anonymní klient, neudal jméno
5. **Suffix "/26"** = rok 2026 (např. `Lukas01/26` = Lukas, leden 2026)
6. **Suffix písmeno (a, b, c, d, e)** = rozlišení duplicit (např. `N0704b`, `NOVÝ1601c`)

### Anotace v SUMMARY

| Anotace | Význam | Frekvence |
|---------|--------|-----------|
| `telegram` | Klient přišel z Telegramu | 20 (3.1%) |
| `sleva XXXkc` / `#Sleva XXX.-` | Poskytnutá sleva | 19 (3.0%) |
| `prvni navsteva` / `1.navsteva` | První návštěva | Zahrnuty ve "sleva" (combo) |
| `!!` prefix / `!` | Označení důležitosti | Vzácné (~5) |
| `( chce si od vas koupit kalhotky )` | Osobní poznámka | Vzácné |
| `Cizinec` | Zahraniční klient | 3 unikátní kódy |

### Varianty jmen dívek

| Kanonické | Varianty v SUMMARY |
|-----------|-------------------|
| Aneta | Aneta, Anett, Anetta |
| Caty | Caty, Katy, Cary |
| Eliška/Victoria | Eliška, Victoria, Viktorie, Viktoria |

**Doporučení pro booking systém:** Kanonizovat jména dívek v DB, neumožnit varianty.

---

## 5. Speciální kalendáře

### Eliška (ffdc) — sdílený kalendář dvou dívek
- **Eliška:** 10 eventů
- **Victoria/Viktorie/Viktoria:** 55 eventů
- Sdílí jeden ICS soubor (pojmenovaný "Eliška" v X-WR-CALNAME)
- Victoria má 3 varianty jména (Victoria, Viktorie, Viktoria)

### Shared (lovely10girls@gmail.com) — operátorský kalendář
31 eventů, obsahuje:
- **Směny:** `M směna - Placeno`, `K směna PLACENO` (8x) — platby za směny operátorky
- **Jednopísmenné kódy:** `N`, `A` (15x) — zkrácené záznamy (pravděpodobně jen poznámky)
- **Pohovory:** `Pohovor nová slečna`
- **Kontakty dívek:** `Natali-+420 733 247 630`, `Zoe /792766247`
- **Duo/speciální:** `Scarlett Slova esc Duo ( esc)`, `Scarlett-725 590 498`

**Data od 2023-03** — nejstarší záznamy v celém exportu, ukazují že provoz funguje od jara 2023.

---

## 6. Časová analýza

### Měsíční distribuce rezervací

| Měsíc | Počet | Trend |
|-------|-------|-------|
| 2026-07 | 167 | Peak |
| 2026-08 | 144 | Mírný pokles |
| 2026-06 | 129 | Růst |
| 2026-09 | 84 | Zatím neúplný (13. dne) |
| 2026-05 | 56 | Start hlavní sezóny |
| 2025-02 | 19 | Starší data (Emily, Caty, Nika) |
| 2025-03 | 18 | Starší data |
| 2023-05 | 10 | Operátorský kalendář |
| 2023-03–2023-12 | 12 | Operátorský kalendář |

**Trend:** Silný růst od května 2026 s peakem v červenci (léto = hlavní sezóna). Září zatím ~84 za 13 dní → odhad ~195/měsíc (pokračování růstu).

### Den v týdnu

| Den | Počet | % |
|-----|-------|---|
| Úterý | 129 | 20.2% |
| Čtvrtek | 117 | 18.3% |
| Středa | 98 | 15.3% |
| Pátek | 87 | 13.6% |
| Sobota | 77 | 12.1% |
| Pondělí | 67 | 10.5% |
| Neděle | 64 | 10.0% |

**Poznatek:** Úterý a čtvrtek = nejsilnější dny. Víkend je slabší než pracovní dny.

### Hodiny (UTC → CET +1/+2)

| Hodina UTC | CET/CEST | Počet | Pozice |
|------------|----------|-------|--------|
| 08:00 | 10:00 | 66 | Peak dopoledne |
| 11:00 | 13:00 | 64 | Peak poledne |
| 13:00 | 15:00 | 64 | Peak odpoledne |
| 09:00 | 11:00 | 62 | |
| 14:00 | 16:00 | 62 | |
| 10:00 | 12:00 | 50 | |
| 12:00 | 14:00 | 49 | |
| 19:00 | 21:00 | 48 | Peak večer |
| 15:00 | 17:00 | 43 | |
| 17:00 | 19:00 | 43 | |
| 18:00 | 20:00 | 33 | |
| 16:00 | 18:00 | 29 | Dip |
| 06:00 | 08:00 | 18 | Ranní |

**Poznatek:** Hlavní provoz 10:00-16:00 CET, druhý peak 19:00-21:00 CET. Minimální provoz po 22:00 a před 08:00.

---

## 7. TOP stálí klienti

### TOP 15 podle počtu návštěv

| Klient kód | Návštěvy | Dívky |
|------------|----------|-------|
| Klient04093 | 13x | Emily |
| Cizinec711 | 10x | Emily(8), Nika(2) |
| Cizinec140301 | 8x | Emily |
| JozefN1211 | 6x | Emily(3), Nika(2), Nina(1) |
| Klient01066 | 6x | Kim(5), Luna(1) |
| Kl1111 | 5x | Caty(1), Emily(1), Luna(3) |
| HynekSvoboda | 5x | Emily(4), Natalie(1) |
| Vladimír1806 | 4x | Aneta, Kim, Luna, Nika |
| Kl02310 | 4x | Caty(4) |
| LiborN2807 | 4x | Emily(4) |
| NO1018 | 4x | Emily(4) |
| N10005 | 4x | Emily(1), Kim(1), Natalie(1), Nika(1) |
| N0330 | 4x | Luna(4) |
| Nov0412 | 4x | Nika(3), Nina(1) |
| Klient08116 | 4x | Nika(4) |

### Klienti navštěvující 3+ dívek

| Klient | Návštěvy | Dívky |
|--------|----------|-------|
| Vladimír1806 | 4x | Aneta, Kim, Luna, Nika |
| N10005 | 4x | Emily, Kim, Natalie, Nika |
| J0204 | 3x | Aneta, Ema, Nika |
| Jl3008 | 3x | Aneta, Caty, Nina |
| L1307 | 3x | Caty, Kim, Nika |
| Kl1111 | 5x | Caty, Emily, Luna |
| JozefN1211 | 6x | Emily, Nika, Nina |
| Klient14012 | 3x | Emily, Luna, Nika |
| NO0203 | 3x | Emily, Kim, Natalie |
| Stefano1006 | 3x | Kim, Luna, Nika |

**Celkem 38 klientů navštívilo 2+ různých dívek.**

---

## 8. Doporučení pro booking systém

Na základě této analýzy doporučuji pro nový booking systém:

### 8.1 Klient ID formát
- Zachovat stávající konvenci **Jméno+DDMM** (52.6% klientů ji již používá)
- Automaticky generovat kód: `{první 4 znaky jména}{DDMM prvního kontaktu}`
- Příklad: klient "Petr" zavolá 15.07. → kód `PETR1507`
- Pro anonymní: `KLIENT{DDMM}{pořadí}`

### 8.2 Povinná pole při vytvoření klienta
- Klient kód (auto-gen z jména + data)
- Zdroj (telefon / telegram / web — nyní jen 3.1% z TG, ale roste)
- Typ: nový / stálý (flag "is_new" na první návštěvě)

### 8.3 Sledování no-shows
- V kalendáři se no-shows NEsledují (0 nalezených)
- Booking systém musí mít explicitní status: CONFIRMED → COMPLETED / NO_SHOW / CANCELLED
- Dashboard s no-show % per klient

### 8.4 Cross-girl tracking
- 8.4% klientů navštěvuje 2+ dívky → systém musí zobrazit historii klienta across all girls
- Operátorka potřebuje vidět: "Vladimír1806 byl u 4 dívek, naposledy u Niky 9.9."

### 8.5 Slevy
- Aktuálně ruční poznámky "sleva 200kc" / "#Sleva 300.-"
- Booking systém: pole `discount_amount` + `discount_reason` (prvni_navsteva, telegram, promo)

### 8.6 Kanonizace jmen
- Aneta/Anett/Anetta → Aneta
- Caty/Katy/Cary → Caty
- Eliška = Victoria/Viktorie/Viktoria → **jedna dívka, pracovní jméno Victoria**
- V booking systému: jeden profil per dívka, žádné varianty

### 8.7 Eliška/Victoria — jedna dívka
- Victoria je pracovní jméno Elišky (stejná osoba)
- V kalendáři "Eliška" (ffdc): 55 eventů jako Victoria/Viktorie, 10 jako Eliška
- V booking systému: jeden profil "Victoria" (nebo "Eliška"), ne dva oddělené

### 8.8 Rejection flag (nový požadavek)
- Některé dívky konkrétního klienta odmítají — interní flag, klient se NIKDY nedozví
- Při bookingu: systém upozorní operátorku, ta řekne "má plno" (ne "odmítá tě")
- DB tabulka: `client_girl_rejections (client_id, girl_id, reason, created_at)`
- Z kontaktů zjištěno 21 girl-specific rejections (viz sekce 10.4)

---

## 10. Analýza kontaktů (contacts.csv)

**Zdroj:** `/Users/zen/Desktop/contacts.csv`
**Datum analýzy:** 2026-09-13

### 10.1 Celkové statistiky

| Metrika | Hodnota |
|---------|---------|
| Celkem kontaktů | 6 348 |
| S telefonem | 5 813 |
| Validní klienti (non-problematic) | 5 535 |
| Se jménem (non-empty First Name) | 5 804 |
| S poznámkami (meaningful) | 26 |
| CZ telefony (+420) | 4 492 (77.3%) |
| Zahraniční telefony | 1 155 (20.5%) |

### 10.2 Pojmenování klientů v kontaktech

| Vzor | Počet | % |
|------|-------|---|
| Jméno+DDMM (4+ digits) | 4 095 | 64.5% |
| Jiné (volný text) | 889 | 14.0% |
| Jen jméno (bez kódu) | 620 | 9.8% |
| (prázdné) | 544 | 8.6% |
| Iniciály+čísla | 77 | 1.2% |
| Klient+čísla | 70 | 1.1% |
| Novy/NO+čísla | 33 | 0.5% |
| Girl-specific rejection | 15 | 0.2% |

**Potvrzení:** Dominantní formát Jméno+DDMM (64.5%) konzistentní s ICS daty (52.6%). V kontaktech ještě silnější podíl.

### 10.3 Problémové kontakty

| Kategorie | Počet | Význam |
|-----------|-------|--------|
| No-shows (nepřišel/nedorazil) | 244 | Klient nepřišel na rezervaci |
| Nebrat (úplný ban) | 76 | Kompletní zákaz — nesmí se obsluhovat |
| Girl-specific rejection ({GIRL} NE) | 21 | Konkrétní dívka klienta odmítá |
| Celkem problémových (union) | 347 | 5.5% z kontaktů |

**No-shows jsou MASIVNÍ problém:** 244 no-show kontaktů = 3.8% všech klientů. V ICS kalendáři nebyly žádné — protože se mazaly/nepřidávaly. Kontakty odhalují skutečný rozsah.

**Nebrat (úplný ban) důvody z kontaktů:**
- Opakovaný no-show bez omluvy
- Hrubé/agresivní chování ("drzej", "hrubý", "negramot", "surový")
- Zdravotní rizika ("vyrážka na penisu", "bez gumy")
- Tajné natáčení
- Podvodné jednání ("nechce platit", "posouvá časy")
- Obtěžování ("ocumuje holky", "vyptal se")

### 10.4 Girl-specific rejections

| Dívka | Odmítnutých klientů | Příklady |
|-------|---------------------|----------|
| Emily | 9 | A0101, Alex19041, Kishan1505, Nový0306, Španěl, Stal Ok |
| Nika | 4 | Dylan0207, Klient04031, NO016123, Tom1707 |
| Kim | 3 | JK302, N0708, Klient08025 (+ Emily NE) |
| Luna | 2 | M0902 ("zkouší to bez gumy"), P0903N |
| Victoria | 1 | Klient1903Nový |
| Caty | 1 | Lukas1510 |
| Katy | 1 | Chen1401 |
| Nina | 1 | Olžas0112 |

**Formát v kontaktech:**
- V First Name: `"A0101 EMILY NE"`, `"Tom1707 NIKA NE"`
- V Last Name: `"Emily Ne"`, `"Victoria Ne"`, `"NE"`
- Vícenásobné: `"Klient08025 EMILY NE!KIM NE!"` — jeden klient odmítaný dvěma dívkami

**Důležité pro booking systém:**
- Rejection je INTERNÍ — klient NIKDY neví že je odmítaný
- Operátorka řekne "má plno" nebo jiný důvod
- Systém musí při bookingu zobrazit warning: "Emily tohoto klienta odmítá"

### 10.5 Telefonní předvolby klientů

| Země | Počet | % |
|------|-------|---|
| CZ (+420) | 4 492 | 77.3% |
| Zahraniční (celkem) | 1 155 | 20.5% |
| DE (+49) | 144 | 2.5% |
| UK (+44) | 120 | 2.1% |
| SK (+421) | 69 | 1.2% |
| AT (+43) | 15 | 0.3% |
| Bez předvolby | 165 | 2.8% |

**20.5% zahraničních klientů** — systém musí podporovat mezinárodní telefonní formáty.

### 10.6 Labels z kontaktů

| Label | Počet | Význam |
|-------|-------|--------|
| Importováno 18.3. | 1 399 | Bulk import |
| Importováno 1.3. | 1 144 | Starší import |
| Recenzent | 9 | Klient co napsal recenzi |
| Nedorazil | 1 | Label-based tracking |
| Nedorazil 2x | 1 | Opakovaný no-show |

### 10.7 Last Name pole — nestandardní využití

Last Name (765 non-empty z 6348) slouží jako overflow pole:
- **236 × číslo** — pravděpodobně pokračování klient kódu
- **32 × "NE"** — rejection flag (doplněk k girl NE v First Name)
- **10 × jméno dívky** — girl-specific rejection/note
- **486 × jiný text** — poznámky operátorky

---

## 11. Aktualizovaná doporučení pro booking systém

### 11.1 Rejection flag (nový požadavek #24)
```sql
CREATE TABLE IF NOT EXISTS client_girl_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  girl_id INTEGER NOT NULL,
  reason TEXT,              -- enc: důvod odmítnutí
  created_by TEXT,          -- 'admin:1', 'girl:25'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE,
  UNIQUE(client_id, girl_id)
);
```

**UI flow:**
1. Při vytváření bookingu → systém kontroluje `client_girl_rejections`
2. Pokud existuje rejection: **WARNING banner** v booking formuláři
3. Text: "Emily tohoto klienta odmítá (důvod: {reason})"
4. Operátorka může: vybrat jinou dívku NEBO override (s poznámkou)
5. Rejection je NIKDY viditelná klientovi — jen admin panel

### 11.2 No-show tracking (aktualizace na základě kontaktů)
- 244 no-show kontaktů v databázi = problém je REÁLNÝ a rozsáhlý
- Stávající řešení v kontaktech: přejmenování kontaktu na "Neprisel0507"
- Nový systém: `no_show_count` na klientské kartě + auto-eskalace po 3×
- Import: parsovat "Neprisel/Nedorazil" z kontaktů → `no_show_count` na kartě

### 11.3 Nebrat (ban) tracking
- 76 "nebrat" kontaktů = kompletní ban
- Systém: `type = 'banned'` status na klientské kartě (přidat k existujícím new/regular/vip/untrusted)
- Při bookingu: **BLOCK** — nelze vytvořit rezervaci pro banned klienta
- Důvod banu uložený v notes (encrypted)

### 11.4 Směny (2 za den)
- Doplnění: systém podporuje 2 směny za den (ranní + odpolední) per dívka
- V `availability`/`girl_schedules`: 2 řádky pro jeden den pokud je split shift
- Nebo: `shift_1_start`, `shift_1_end`, `shift_2_start`, `shift_2_end`

### 11.5 Data migration z kontaktů
Při spuštění booking systému importovat z contacts.csv:
1. Parsovat First Name → client_code + type
2. Parsovat Phone → phone (encrypted) + phone_hash
3. Parsovat "NEBRAT" → type: 'banned'
4. Parsovat "{GIRL} NE" → client_girl_rejections
5. Parsovat "Neprisel" → no_show_count estimate
6. Parsovat Notes → clients.notes (encrypted)

---

## 12. Shrnutí klíčových čísel

```
=== ICS KALENDÁŘE ===
Celkem rezervací:           639
Aktivní dívky:              10 (+1 nová Ema)
Unikátní klienti (ICS):     454
Stálí klienti (2+):         89 (19.6%)
Cross-girl klienti:         38 (8.4%)
Peak měsíc:                 červenec 2026 (167 rezervací)
Nejsilnější den:            úterý (20.2%)
Hlavní hodiny (CET):        10:00–16:00 + 19:00–21:00
Průměrná délka:             57 min
Telegram podíl:             3.1%
Sleva podíl:                3.0%
No-shows v kalendáři:       0 (nesledováno)

=== KONTAKTY ===
Celkem kontaktů:            6 348
Validní klienti:            5 535
No-show kontakty:           244 (3.8%)
Nebrat (ban):               76 (1.2%)
Girl-specific rejection:    21 (0.3%)
Celkem problémových:        347 (5.5%)
Zahraniční klienti:         20.5%
Dominantní formát:          Jméno+DDMM (64.5%)
```
