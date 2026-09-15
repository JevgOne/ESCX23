# TASK: Admin editace profilu — neuložené změny se ztratí při navigaci

## Bug report

Uživatel edituje profil dívky (např. Ema) v admin panelu, zaklikne změny (služby, jazyky, hashtagy atd.), pak klikne na "Spravovat fotky" → neuložené změny se ztratí bez varování.

## Root cause

**Soubor:** `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx`

Na řádcích 929 a 942 jsou plain `<a>` linky UVNITŘ formuláře (řádky 486–1003):

```html
<!-- řádek 929 -->
<a href="/cs/admin/divky/${g.id}/fotky" class="gf2-media-btn">
  Spravovat fotky →
</a>

<!-- řádek 942 -->
<a href="/cs/admin/divky/${g.id}/videa" class="gf2-media-btn">
  Spravovat videa →
</a>
```

Kliknutí naviguje na úplně jinou stránku a opouští formulář. Protože:

- Formulář je **Server Component** (žádný `'use client'`)
- **Žádný `beforeunload` handler**
- **Žádná detekce neuložených změn**
- Všechna data jsou v DOM (`defaultValue`), ne v React state
- Form action je `updateGirl` server action — submit = POST s redirect

...neuložené změny se jednoduše zahodí.

Stejný problém platí i pro odkaz "Zpět na profil" (řádek 475) a "Zrušit" (řádek 1001), ale ty jsou méně kritické — uživatel je klikne záměrně k opuštění formuláře.

## Navrhované řešení: Confirm dialog (varianta B)

### Proč confirm dialog a ne auto-save

| Varianta | Pro | Proti |
|----------|-----|-------|
| **A) Auto-save** | Nejlepší UX | `updateGirl` dělá kompletní update — partial save = refactoring. Může uložit nechtěný stav. |
| **B) Confirm dialog** | Jednoduchý, standardní UX, uživatel rozhodne | Vyžaduje `'use client'` komponent |
| **C) Inline fotky** | Žádná navigace | Fotky mají vlastní upload/reorder/delete flow — příliš složité |

**Varianta B je optimální** — minimální kód, standardní chování, progresivní (bez JS se chová jako teď).

### Implementační plán

#### 1. Vytvořit `components/admin/UnsavedChangesGuard.tsx` (NOVÝ, ~45 řádků)

```tsx
'use client';

import { useEffect, useRef } from 'react';

export default function UnsavedChangesGuard({ formId }: { formId: string }) {
  const dirty = useRef(false);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    // Track any change in the form
    const markDirty = () => { dirty.current = true; };
    form.addEventListener('change', markDirty);
    form.addEventListener('input', markDirty);

    // Reset dirty on successful submit
    const markClean = () => { dirty.current = false; };
    form.addEventListener('submit', markClean);

    // Intercept all <a> clicks inside the form
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]');
      if (!link || !dirty.current) return;
      
      const confirmed = window.confirm(
        'Máte neuložené změny. Opravdu chcete odejít?'
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    form.addEventListener('click', handleClick);

    // Fallback: browser beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      form.removeEventListener('change', markDirty);
      form.removeEventListener('input', markDirty);
      form.removeEventListener('submit', markClean);
      form.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formId]);

  return null; // renderless component
}
```

#### 2. Upravit `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx`

Změny (3 řádky):

```diff
+ import UnsavedChangesGuard from '@/components/admin/UnsavedChangesGuard';

  // ... (řádek ~486)
- <form action={updateGirl} className="gf2-wrap">
+ <form action={updateGirl} className="gf2-wrap" id="girl-edit-form">

  // ... (hned za <form>)
+   <UnsavedChangesGuard formId="girl-edit-form" />
    <input type="hidden" name="id" value={g.id} />
```

#### 3. Soubory k úpravě

| Soubor | Akce | Rozsah |
|--------|------|--------|
| `components/admin/UnsavedChangesGuard.tsx` | NOVÝ | ~45 řádků |
| `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` | EDIT | +3 řádky (import, id, component) |

### Edge cases

- **Bez JS:** Guard se nehydratuje → žádný dialog → stejné chování jako teď (progressive enhancement)
- **Submit formuláře:** `dirty` se resetuje na `false` → žádný falešný dialog
- **"Zpět" a "Zrušit" linky:** Jsou MIMO `<form>` element (řádky 475 a 1001), takže guard na ně nereaguje — to je OK, ty jsou záměrné navigace pryč
- **Checkboxy služeb/jazyků:** Trigger `change` event → guard je zachytí

### Ověření

- Otevřít editaci profilu, zakliknout službu, kliknout "Spravovat fotky" → musí ukázat confirm
- Otevřít editaci profilu, nic neměnit, kliknout "Spravovat fotky" → musí projít bez dialogu
- Otevřít editaci, změnit něco, submitnout form, pak kliknout fotky → musí projít (dirty reset)
- Otevřít editaci, změnit něco, zavřít tab → beforeunload musí varovat
