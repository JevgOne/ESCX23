# TASK-013: Evzen review — Styl & Satnik

## Verdikt: SCHVALENO

## Puvodni zadani uzivatele

> "tohle tam vubec neni ani v admin panelu kdyz se upravuje profil, ani na profilu jako takovym a ma to tam bejt"

Uzivatel pozaduje:
1. Na verejnem profilu divky se musi zobrazovat Styl & Satnik
2. V admin panelu pri editaci profilu divky se musi dat editovat Styl & Satnik
3. Data z prihlasky se pri konverzi na profil musi prenest do girls tabulky

---

## 1. DB migrace — sloupec `style_wardrobe` v girls tabulce

**Soubor:** `lib/db.ts:43`
```
'ALTER TABLE girls ADD COLUMN style_wardrobe TEXT DEFAULT NULL'
```
**Shoda s zadanim:** ANO — girls tabulka nyni ma sloupec pro ulozeni dat.

---

## 2. Profil zobrazuje Styl & Satnik

### ProfilHero.tsx (mobilni verze, radky 355-422)
- Prijima `styleWardrobe` prop
- Parsuje JSON `{ style: string[], wardrobe: string[] }`
- Zobrazuje chipy se 4-jazykovymi labely (cs/en/de/uk)
- 9 stylu + 14 satnikovych polozek — shodne ID s prihlaskovym formularem

### ProfilDetails.tsx (desktopova verze, radky 381-449)
- Stejne jako ProfilHero — `styleWardrobe` prop, JSON parse, chipy
- Trida `profile-desktop-only` — desktop layout

### profil/[slug]/page.tsx (radky 377-380, 406-409)
- Predava `styleWardrobe` do obou komponent z `girl.style_wardrobe`
- Pouziva `as unknown as Record<string, unknown>` cast (akceptovatelne — SELECT g.* vraci vsechny sloupce)

**Shoda s zadanim:** ANO — profil zobrazuje styl i satnik na mobilu i desktopu.

---

## 3. Admin editace — checkboxy pro Styl & Satnik

### admin/divky/[id]/edit/page.tsx
- **STYLE_OPTIONS:** 9 polozek (elegant, casual, sporty, glamour, minimalist, romantic, streetwear, business, bohemian)
- **WARDROBE_OPTIONS:** 14 polozek (lingerie, stockings, high_heels, boots, latex, leather, corset, bodystocking, costume, nurse, schoolgirl, maid, secretary, swimwear)
- **ID shoda s prihlaskovym formularem:** ANO — vsechny ID jsou identicke
- **Data loading:** Parsuje existujici `style_wardrobe` JSON do `activeStyles` a `activeWardrobe` Setu
- **defaultChecked:** Checkboxy spravne zaznaceny podle existujicich dat
- **Sekce cislovani:** Nova sekce 6 "Styl & Satnik" mezi "Tetovani & Piercing" a "Sluzby" — existujici sekce precislovany

### admin/divky/nova/page.tsx
- Stejna sada checkboxu (9 stylu + 14 satnik)
- Bez defaultChecked (nova divka nema data) — spravne

### lib/admin-actions.ts — updateGirl() (radek 103-109)
- Cte `formData.getAll('style_types')` a `formData.getAll('wardrobe_items')`
- Serializuje do JSON `{ style: [...], wardrobe: [...] }`
- Predava do `updateGirlById()`

### lib/admin-actions.ts — createGirl() (radek 178, 222-228)
- Stejna logika jako updateGirl — JSON z form dat
- `style_wardrobe` v INSERT SQL

**Shoda s zadanim:** ANO — admin muze editovat styl/satnik u existujicich i novych divek.

---

## 4. Prenos dat z prihlasky na profil

### lib/admin-actions.ts — createGirlFromApplication() (radek 339, 349, 368)
```ts
const styleWardrobe = app.style_wardrobe != null ? String(app.style_wardrobe) : null;
```
- Cte `style_wardrobe` z aplikace
- Vlozi do INSERT SQL pro novou divku
- JSON format je zachovan beze zmeny (prihlaska i profil pouzivaji `{ style: [], wardrobe: [] }`)

**Shoda s zadanim:** ANO — data se automaticky prenesou.

---

## 5. Kontrola konzistence dat

| Misto | Form field names | ID stylu | ID satniku |
|-------|-----------------|----------|------------|
| Prihlaska (join) | style_type, wardrobe_item | 9 shodnych | 14 shodnych |
| Admin edit | style_types, wardrobe_items | 9 shodnych | 14 shodnych |
| Admin nova | style_types, wardrobe_items | 9 shodnych | 14 shodnych |
| ProfilHero labels | — | 9 shodnych | 14 shodnych |
| ProfilDetails labels | — | 9 shodnych | 14 shodnych |

Vsechny ID jsou konzistentni napric celym systemem.

**Poznamka:** Prihlaskovy formular pouziva jina jmena poli (`style_type`/`wardrobe_item` singular) nez admin formular (`style_types`/`wardrobe_items` plural). To NENI bug — kazdy formular ma svou vlastni server action ktera cte spravna jmena:
- Join action (join/actions.ts) cte `formData.getAll('style_type')`
- Admin action (admin-actions.ts) cte `formData.getAll('style_types')`

---

## 6. Kontrola queries (lib/queries.ts)

- `GirlUpdateData` interface ma `style_wardrobe?: string | null` — OK
- `updateGirlById()` ma `style_wardrobe=?` v SET a `data.style_wardrobe ?? null` v args — OK
- `getGirlBySlug()` pouziva `SELECT g.*` — automaticky vraci `style_wardrobe` — OK

---

## Non-blocker nalezy

| # | Nalez | Zavaznost |
|---|-------|-----------|
| 1 | STYLE_LABELS a WARDROBE_LABELS jsou duplikovany ve 2 komponentach (ProfilHero.tsx + ProfilDetails.tsx) — kazda ma identickou kopii (~50 radku) | Nizka (DRY violation, ale ne bug) |
| 2 | Admin edit/nova ma checkboxy jen v cestine (label pouziva CS text). Pro admin panel to je akceptovatelne. | Velmi nizka |

---

## Zaver

**SCHVALENO** — implementace presne odpovida vsem 3 bodum zadani uzivatele:

1. **Profil zobrazuje styl/satnik** — ANO, na mobilu (ProfilHero) i desktopu (ProfilDetails), ve 4 jazycich
2. **Admin editace ma checkboxy** — ANO, ve formulari editace i pri vytvareni nove divky, s 9 styly + 14 satnikovymi polozkami
3. **Data z prihlasky se prenaseji** — ANO, `createGirlFromApplication()` kopiruje `style_wardrobe` JSON

Vsechny ID jsou konzistentni napric prihlaskovym formularem, admin formulari a profilem. DB migrace je na miste. Server Actions spravne zpracovavaji form data.
