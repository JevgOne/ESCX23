# TASK-013: Styl & Šatník — Implementace hotová

## Co bylo implementováno

### Krok 1: DB migrace
**Soubor:** `lib/db.ts`
- Přidána migrace `ALTER TABLE girls ADD COLUMN style_wardrobe TEXT DEFAULT NULL`

### Krok 2: GirlUpdateData + updateGirlById
**Soubor:** `lib/queries.ts`
- Přidáno `style_wardrobe?: string | null` do `GirlUpdateData` interface
- Přidáno `style_wardrobe=?` do UPDATE SQL v `updateGirlById()`
- Přidáno `data.style_wardrobe ?? null` do args pole

### Krok 3: Server Actions
**Soubor:** `lib/admin-actions.ts`

**3a: updateGirl()** — přidáno sestavení `style_wardrobe` JSON z `formData.getAll('style_types')` a `formData.getAll('wardrobe_items')`, předáno do `updateGirlById()`

**3b: createGirl()** — přidáno `style_wardrobe` do INSERT SQL sloupců, VALUES placeholderů i args (stejná logika jako updateGirl)

**3c: createGirlFromApplication()** — přidán přenos `style_wardrobe` z aplikace (`app.style_wardrobe`) do nové dívky v INSERT SQL

### Krok 4: Admin edit UI
**Soubor:** `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx`
- Přidáno parsování `style_wardrobe` JSON do `activeStyles` a `activeWardrobe` setů
- Definovány konstanty `STYLE_OPTIONS` (9 položek) a `WARDROBE_OPTIONS` (14 položek)
- Nová sekce 6 "Styl & Šatník" s checkbox chipy (mezi "Tetování & Piercing" a "Služby")
- Přečíslovány sekce 6→7, 7→8, ..., 12→13

### Krok 5: Admin "nová dívka" UI
**Soubor:** `app/[locale]/(admin)/admin/divky/nova/page.tsx`
- Přidána nová card "Styl & Šatník" s checkboxy (před sekci Bio)
- Inline styling konzistentní s ostatními kartami na stránce

## Verifikace
- TypeScript: 0 chyb v modifikovaných souborech
- Build: úspěšný (`next build` prošel bez chyb)

## Soubory změněné
1. `lib/db.ts` — 1 řádek (migrace)
2. `lib/queries.ts` — 3 řádky (interface + SQL + args)
3. `lib/admin-actions.ts` — ~25 řádků (3 akce)
4. `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` — ~65 řádků (data parsing, konstanty, UI sekce, přečíslování)
5. `app/[locale]/(admin)/admin/divky/nova/page.tsx` — ~45 řádků (nová karta)
