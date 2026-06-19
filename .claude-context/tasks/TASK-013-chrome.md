# TASK-013-chrome — Chrome Test: Profil redesign vizuální kontrola

**Datum:** 2026-06-02  
**Tester:** TEST-CHROME  
**URL:** http://localhost:3000/cs/profil/emily

---

## Souhrn

| # | Test | Výsledek | Poznámka |
|---|------|----------|---------|
| 1 | Kulatá fotka nahoře | PASS | border-radius: 50% |
| 2 | Úplná adresa místo jen "Praha 2" | FAIL | queries.ts:1278 — l.address místo l.display_name |
| 3 | Pills waist/hips/piercing | FAIL (data) | Chybí data v DB pro Emily |
| 4 | Service chips 4+4 | FAIL (data) | Emily má 0 girl_services |
| 5 | Pořadí služby→hashtagy→lokace | PASS (kód OK) | Chybí jen data |
| 6 | personalMessage + voiceUrl | FAIL (data) | Chybí data v DB |
| 7 | Styl block | PASS | Renderuje správně |
| 8 | Mobile kulatá fotka | PASS | ig-avatar s border-radius: 50% |

---

## Detaily testů

### TEST 1: Kulatá fotka nahoře (desktop IG header)
**PASS**

HTML: `<div class="ig-avatar"><img src="..." /></div>`  
CSS (`globals.css:2926-2930`):
```css
.ig-avatar {
  width: 124px; height: 124px;
  border-radius: 50%;  /* kulatá */
  overflow: hidden;
  box-shadow: 0 18px 40px -12px rgba(0,0,0,0.7);
}
```
Fotka je kulatá, s gradientovým kroužkem via `::before`. IG header je přítomen v HTML.

---

### TEST 2: Úplná adresa místo jen "Praha 2"
**FAIL — kódový bug**

Zobrazuje se: `📍 Vinohrady`  
Očekáváno: plná adresa jako `📍 Nové Město, Praha 2`

**Příčina:** `lib/queries.ts:1278` — `getGirlScheduleForToday` vrací:
```sql
l.address AS schedule_address   -- hodnota: "Vinohrady"
```
Ale `l.display_name = "Nové Město, Praha 2"` se nevyužívá pro adresu.

`ProfilDetails.tsx:281` pak zobrazí `scheduleAddress` (= `"Vinohrady"`) přímo.

**Oprava:** Změnit `l.address AS schedule_address` na `l.display_name AS schedule_address` v queries.ts:1278.

---

### TEST 3: Pills waist, hips, piercing
**FAIL — chybí data v DB**

Zobrazené pills: Prsa · Oči · Vlasy (+ jazyky)  
`waist`, `hips`, `piercing` chybí — Emily má NULL v DB.

```sql
SELECT waist, hips, piercing FROM girls WHERE slug='emily';
-- NULL | NULL | 0
```

Kód (`ProfilDetails.tsx:320-362`) zobrazuje podmíněně `girl.waist != null` — logika je správná.  
Problém je čistě datový (Emily nemá seed pro tato pole).

---

### TEST 4: Service chips 4+4
**FAIL — chybí data v DB**

`profile-mini-chips` se vůbec nevykresluje.

```sql
SELECT COUNT(*) FROM girl_services WHERE girl_id=28;  -- 0
```

Kód (`ProfilDetails.tsx:407-425`) je správně implementován (slice(0,4) + slice(0,4)).  
`includedServices.length + extraServices.length = 0` → podmínka false → blok se nerenduje.

---

### TEST 5: Pořadí: služby → hashtagy → lokace
**PASS (kód je správně)**

Pořadí v `ProfilDetails.tsx`:
1. Styl & Šatník (řádky 398-405)
2. Služby mini-chips (řádky 406-425) — neviditelné kvůli chybějícím datům
3. Hashtagy (řádky 428-436)
4. Lokace (řádky 438-448)

Pořadí je správné. Vizuálně chybí jen blok služeb (data).

---

### TEST 6: personalMessage (citace) a voiceUrl (audio player)
**FAIL — chybí data v DB**

```sql
SELECT personal_message, voice_url FROM girls WHERE slug='emily';
-- NULL | NULL
```

`ProfilDetails.tsx:376-395` a `ProfilHero.tsx:323-341` zobrazují podmíněně.  
Kód je správně implementován. Problém je datový.

---

### TEST 7: Styl block se zobrazuje
**PASS**

HTML potvrzeno:
```html
<div class="profile-mini-label">STYL & ŠATNÍK</div>
<p class="profile-styl-sub">přizpůsobí se · řekni styl předem</p>
<p class="profile-styl-note">Emily se přizpůsobí jakémukoliv stylu — gala, business, plavky, lingerie. Stačí říct předem.</p>
```

---

### TEST 8: Mobile view — kulatá fotka v IG headeru + adresa
**PASS (fotka) / FAIL (adresa — stejný bug jako #2)**

`profile-ig-header` div přítomen v HTML. `ig-avatar` s `border-radius: 50%` tvoří kulatou fotku v mobilním layoutu.

Adresa v `ig-loc` elementu: `Vinohrady` — stejný problém jako test #2 (queries.ts:1278).

---

## Závěr

**1 kódový bug:**
- `lib/queries.ts:1278`: `l.address AS schedule_address` → změnit na `l.display_name AS schedule_address`

**3 chybějící seed data pro Emily (není kódový bug):**
- `waist`, `hips`, `piercing` = NULL v tabulce `girls`
- `girl_services` = 0 záznamů (girl_id=28)
- `personal_message`, `voice_url` = NULL

**Komponenty a logika jsou správně implementovány.**  
Stačí doplnit seed data a opravit queries.ts:1278.

---

*Původní obsah tohoto souboru (opening dates test) byl nahrazen výsledky profil redesign testu.*
