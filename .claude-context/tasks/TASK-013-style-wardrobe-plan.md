# TASK-013: Styl & Šatník — Plán implementace

## Problém

Data "Styl & Šatník" se sbírají v přihlášce (`/join`) a ukládají do `girl_applications.style_wardrobe` jako JSON (`{ style: string[], wardrobe: string[] }`). ALE:

1. **Na profilu se nezobrazuje** — komponenty `ProfilHero.tsx` a `ProfilDetails.tsx` čtou `g.style_wardrobe` z `girls` tabulky, ale ten sloupec v `girls` **neexistuje** → vždy `null`.
2. **V admin editaci profilu nelze editovat** — `/admin/divky/[id]/edit/page.tsx` nemá žádné UI pro style_wardrobe.
3. **`girls` tabulka nemá sloupec `style_wardrobe`** — data se ztratí při konverzi aplikace na profil.
4. **`createGirlFromApplication()` nepřenáší `style_wardrobe`** z aplikace na nový girls záznam.

## Stávající stav kódu

### Co už funguje
- **Přihláška (`/join`)**: sbírá `style_type[]` a `wardrobe_item[]` checkboxy, ukládá jako JSON do `girl_applications.style_wardrobe` ✅
- **Admin detail aplikace** (`/admin/aplikace/[id]`): zobrazuje `StyleWardrobeCard` read-only ✅
- **Profil komponenty**: `ProfilHero.tsx:355-422` a `ProfilDetails.tsx:381-446` — rendering kód existuje, čtou `styleWardrobe` prop, parsují JSON, zobrazují chipy. Ale dostávají vždy `null` protože `girls` tabulka sloupec nemá ✅ (kód ready, data chybí)
- **CSS**: styly pro `.ig-styl-chip-style`, `.ig-styl-chip-wardrobe`, `.mini-chip-wardrobe` existují v `globals.css` ✅

### Co chybí
- Sloupec `style_wardrobe TEXT` na tabulce `girls`
- Přenos `style_wardrobe` při konverzi aplikace → dívka
- UI v admin editaci pro správu style & wardrobe
- Zahrnutí `style_wardrobe` v `updateGirl` action a `updateGirlById` query

## Plán implementace (5 kroků)

### Krok 1: DB migrace — přidat sloupec `style_wardrobe` do `girls`

**Soubor:** `lib/db.ts`

Přidat do pole `migrations`:
```
'ALTER TABLE girls ADD COLUMN style_wardrobe TEXT DEFAULT NULL'
```

Tím se sloupec automaticky přidá při startu aplikace.

### Krok 2: Rozšířit `GirlUpdateData` interface a `updateGirlById()` query

**Soubor:** `lib/queries.ts`

1. Přidat `style_wardrobe?: string | null;` do `GirlUpdateData` (řádek ~1032, za `calendar_embed_url`)
2. V `updateGirlById()` SQL (řádek 1037-1051): přidat `style_wardrobe=?` do SET klauzule
3. V `args` (řádek 1052-1065): přidat `data.style_wardrobe ?? null` do pole argumentů

### Krok 3: Rozšířit `updateGirl` server action a `createGirl` action

**Soubor:** `lib/admin-actions.ts`

#### 3a: `updateGirl()` (řádek 22-122)
1. Vytvořit style_wardrobe JSON z form data:
   ```ts
   const styleTypes = formData.getAll('style_types').map(String).filter(Boolean);
   const wardrobeItems = formData.getAll('wardrobe_items').map(String).filter(Boolean);
   const styleWardrobe = (styleTypes.length > 0 || wardrobeItems.length > 0)
     ? JSON.stringify({ style: styleTypes, wardrobe: wardrobeItems })
     : null;
   ```
2. Přidat `style_wardrobe: styleWardrobe` do objektu předávaného `updateGirlById()`

#### 3b: `createGirl()` (řádek 124-272)
1. Přidat stejnou logiku pro `style_wardrobe` z form dat
2. Přidat `style_wardrobe` do INSERT SQL

#### 3c: `createGirlFromApplication()` (řádek 280-389)
1. Přidat přenos `style_wardrobe` z aplikace na novou dívku:
   ```ts
   const styleWardrobe = app.style_wardrobe != null ? String(app.style_wardrobe) : null;
   ```
2. Přidat `style_wardrobe` do INSERT SQL a args

### Krok 4: Admin edit UI — přidat sekci "Styl & Šatník"

**Soubor:** `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx`

1. Definovat konstanty `STYLE_OPTIONS` a `WARDROBE_OPTIONS` na začátku souboru (shodné se seznamem v `/join/page.tsx`):
   ```ts
   const STYLE_OPTIONS = [
     { id: 'elegant', label: 'Elegantní' },
     { id: 'casual', label: 'Casual / ležérní' },
     { id: 'sporty', label: 'Sportovní' },
     { id: 'glamour', label: 'Glamour / okázalý' },
     { id: 'minimalist', label: 'Minimalistický' },
     { id: 'romantic', label: 'Romantický / ženský' },
     { id: 'streetwear', label: 'Streetwear / moderní' },
     { id: 'business', label: 'Business / formální' },
     { id: 'bohemian', label: 'Bohémský / artsy' },
   ];
   const WARDROBE_OPTIONS = [
     { id: 'lingerie', label: 'Sexy lingerie' },
     { id: 'stockings', label: 'Punčochy & podvazky' },
     { id: 'high_heels', label: 'Vysoké podpatky' },
     { id: 'boots', label: 'Kozačky / overknee' },
     { id: 'latex', label: 'Latex / vinyl' },
     { id: 'leather', label: 'Kůže / kožené doplňky' },
     { id: 'corset', label: 'Korzet' },
     { id: 'bodystocking', label: 'Bodystocking / catsuit' },
     { id: 'costume', label: 'Kostým / role-play outfit' },
     { id: 'nurse', label: 'Zdravotní sestřička' },
     { id: 'schoolgirl', label: 'Školačka' },
     { id: 'maid', label: 'Pokojská' },
     { id: 'secretary', label: 'Sekretářka' },
     { id: 'swimwear', label: 'Plavky / bikiny' },
   ];
   ```

2. Parsovat existující `style_wardrobe` JSON z dívky do setů:
   ```ts
   // V objektu g (řádek ~371):
   const styleWardrobeRaw = gr.style_wardrobe ? String(gr.style_wardrobe) : null;
   let activeStyles = new Set<string>();
   let activeWardrobe = new Set<string>();
   if (styleWardrobeRaw) {
     try {
       const parsed = JSON.parse(styleWardrobeRaw);
       activeStyles = new Set(Array.isArray(parsed.style) ? parsed.style : []);
       activeWardrobe = new Set(Array.isArray(parsed.wardrobe) ? parsed.wardrobe : []);
     } catch {}
   }
   ```

3. Přidat novou sekci do formuláře (jako nový `gf2-section`, vložit za sekci 5 "Tetování & Piercing" a před sekci 6 "Služby"). Přečíslovat stávající sekce 6-12 na 7-13.
   ```tsx
   {/* SEKCE 6: Styl & Šatník */}
   <div className="gf2-section">
     <div className="gf2-section-head">
       <div className="gf2-step-badge">6</div>
       <div className="gf2-section-title">Styl & Šatník</div>
     </div>
     <div className="gf2-field">
       <label className="gf2-label">Běžný styl oblékání</label>
       <div className="gf2-chips-wrap">
         {STYLE_OPTIONS.map((s) => (
           <label key={s.id} className="gf2-chip-label">
             <input type="checkbox" name="style_types" value={s.id} defaultChecked={activeStyles.has(s.id)} />
             <span className="gf2-chip-span">{s.label}</span>
           </label>
         ))}
       </div>
     </div>
     <div className="gf2-field" style={{ marginTop: 16 }}>
       <label className="gf2-label">Sexy outfity na vyžádání</label>
       <div className="gf2-chips-wrap">
         {WARDROBE_OPTIONS.map((s) => (
           <label key={s.id} className="gf2-chip-label">
             <input type="checkbox" name="wardrobe_items" value={s.id} defaultChecked={activeWardrobe.has(s.id)} />
             <span className="gf2-chip-span">{s.label}</span>
           </label>
         ))}
       </div>
     </div>
   </div>
   ```

### Krok 5: Admin "nová dívka" — přidat sekci Styl & Šatník

**Soubor:** `app/[locale]/(admin)/admin/divky/nova/page.tsx`

Přidat stejnou sekci jako v edit formuláři (ale bez defaultChecked, protože nová dívka nemá data). Přidat odpovídající `style_wardrobe` zpracování do `createGirl()` action.

## Závislosti a pořadí

```
Krok 1 (DB migrace) 
  → Krok 2 (queries.ts) 
    → Krok 3 (admin-actions.ts) 
      → Krok 4 + 5 (UI, mohou být paralelně)
```

## Soubory k úpravě

| # | Soubor | Co |
|---|--------|----|
| 1 | `lib/db.ts` | Přidat migaci `ALTER TABLE girls ADD COLUMN style_wardrobe TEXT` |
| 2 | `lib/queries.ts` | `GirlUpdateData` + `updateGirlById()` — přidat `style_wardrobe` |
| 3 | `lib/admin-actions.ts` | `updateGirl()` + `createGirl()` + `createGirlFromApplication()` |
| 4 | `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` | Nová sekce "Styl & Šatník" |
| 5 | `app/[locale]/(admin)/admin/divky/nova/page.tsx` | Nová sekce "Styl & Šatník" |

**Žádné nové soubory** nejsou potřeba. Profil stránka a komponenty už rendering kód mají — jakmile bude `style_wardrobe` sloupec v `girls` tabulce a data se tam budou zapisovat, profil je automaticky zobrazí.

## Očekávaný výsledek

1. V admin editaci profilu dívky bude nová sekce "Styl & Šatník" s checkboxy
2. Data se uloží jako JSON do `girls.style_wardrobe`
3. Na veřejném profilu se automaticky zobrazí chipy se stylem a šatníkem (kód je ready)
4. Při konverzi aplikace na profil se `style_wardrobe` automaticky přenese
5. Vše funguje bez JS — checkboxy v `<form>` nativně
