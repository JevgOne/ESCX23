# TASK-007: Age gate "Odejit" + Review auto-approval fix

**Datum:** 2026-05-29
**Status:** Plan hotovy

---

## 1. AGE GATE — tlacitko "Odejit"

### Stav: UZ IMPLEMENTOVANO

Soubor `components/AgeGate.tsx` **uz obsahuje** vsechno co bylo pozadovano:

- **i18n preklady** (radky 33, 40, 47, 54):
  - cs: "Odejit"
  - en: "Leave"
  - de: "Verlassen"
  - uk: "Vyity"

- **HTML odkaz** (radek 90):
  ```tsx
  <a href="https://www.google.com" className="age-gate-leave">
    {L.leave}
  </a>
  ```
  Funguje bez JS (je to plain `<a href>`).

- **CSS styling** (globals.css:6016-6023):
  ```css
  .age-gate-leave {
    font-size: 13px;
    color: var(--color-text-dim);
    text-decoration: underline;
    transition: color 0.15s;
  }
  ```
  Vizualne odlisene od "Vstoupit" (sekundarni styl — maly podtrzeny text vs velke ruzove tlacitko).

**Zaver:** TASK-7 je splnen, neni treba zadna zmena. Task uz byl oznacen jako completed.

---

## 2. REVIEW AUTO-APPROVAL → PENDING

### Problem

V `app/[locale]/recenze/nova/[slug]/page.tsx` funkce `submitReview()` vklada recenze se `status='approved'` (radky 63-64, 70-71). Recenze se okamzite zverejni bez moderace.

### Infrastruktura pro pending review uz existuje

1. **Admin stranka** `/admin/recenze` — uz ukazuje pending recenze s tlacitky "Schvalit"/"Zamitnout"
2. **getPendingReviews()** v `lib/queries.ts:827` — filtruje `WHERE r.status IS NULL OR r.status = 'pending'`
3. **approveReview()** v `lib/admin-actions.ts:954` — nastavi `status='approved'`
4. **rejectReview()** v `lib/admin-actions.ts:964` — nastavi `status='rejected'`
5. **Verejne dotazy** — vsechny filtruji `WHERE status = 'approved'` (radky 178, 259, 308, 358 v queries.ts)

### Implementacni plan

#### Krok 1: Zmenit status pri insertu z 'approved' na 'pending'

**Soubor:** `app/[locale]/recenze/nova/[slug]/page.tsx`

**Zmena 1a** (radek 63-64 — plny insert):
```diff
-        sql: `INSERT INTO reviews (girl_id, rating, content, author_name, status, mood, vibe_tags, recommends)
-              VALUES (?, ?, ?, ?, 'approved', ?, ?, ?)`,
+        sql: `INSERT INTO reviews (girl_id, rating, content, author_name, status, mood, vibe_tags, recommends)
+              VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
```

**Zmena 1b** (radek 70-71 — fallback insert):
```diff
-        sql: `INSERT INTO reviews (girl_id, rating, content, author_name, status)
-              VALUES (?, ?, ?, ?, 'approved')`,
+        sql: `INSERT INTO reviews (girl_id, rating, content, author_name, status)
+              VALUES (?, ?, ?, ?, 'pending')`,
```

#### Krok 2: Odebrat immediate rating recalc z submitReview

**Soubor:** `app/[locale]/recenze/nova/[slug]/page.tsx`

Smazat radky 76-85 (recalc blok):
```ts
    // SMAZAT — recalc se provede az pri admin approve
    const aggRes = await db.execute({
      sql: `SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE girl_id = ? AND status = 'approved'`,
      args: [girlId],
    });
    const newAvg = Number(aggRes.rows[0]?.avg_rating ?? 0);
    const newCount = Number(aggRes.rows[0]?.cnt ?? 0);
    await db.execute({
      sql: `UPDATE girls SET rating = ?, reviews_count = ? WHERE id = ?`,
      args: [Math.round(newAvg * 10) / 10, newCount, girlId],
    });
```

**Duvod:** Pending recenze nemeni rating. Recalc se presouva do approveReview.

#### Krok 3: Pridat rating recalc do approveReview

**Soubor:** `lib/admin-actions.ts` — funkce `approveReview` (radek 954)

Zmenit z:
```ts
export async function approveReview(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await db.execute({
    sql: `UPDATE reviews SET status='approved', approved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [id],
  });
  revalidatePath('/cs/admin/recenze');
}
```

Na:
```ts
export async function approveReview(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  
  // Get girl_id before approving
  const reviewRes = await db.execute({
    sql: `SELECT girl_id FROM reviews WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const girlId = reviewRes.rows.length > 0 ? Number(reviewRes.rows[0].girl_id) : null;
  
  await db.execute({
    sql: `UPDATE reviews SET status='approved', approved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [id],
  });
  
  // Recalculate girl rating after approval
  if (girlId) {
    const aggRes = await db.execute({
      sql: `SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE girl_id = ? AND status = 'approved'`,
      args: [girlId],
    });
    const newAvg = Number(aggRes.rows[0]?.avg_rating ?? 0);
    const newCount = Number(aggRes.rows[0]?.cnt ?? 0);
    await db.execute({
      sql: `UPDATE girls SET rating = ?, reviews_count = ? WHERE id = ?`,
      args: [Math.round(newAvg * 10) / 10, newCount, girlId],
    });
  }
  
  revalidatePath('/cs/admin/recenze');
}
```

#### Krok 4: Pridat rating recalc do rejectReview (analogicky)

**Soubor:** `lib/admin-actions.ts` — funkce `rejectReview` (radek 964)

Pridat stejny recalc blok po `UPDATE reviews SET status='rejected'`, protoze pokud admin zamitne recenzi ktera byla omylem schvalena, rating se musi prepocitat.

#### Krok 5: Zmenit success message pro uzivatele

**Soubor:** `app/[locale]/recenze/nova/[slug]/page.tsx`

Zmenit texty pro success screen (radky 127-128, atd.):
```
cs: sentMsg: 'Recenze byla odeslána a čeká na schválení.'
en: sentMsg: 'Review submitted and awaiting approval.'
de: sentMsg: 'Bewertung eingereicht und wartet auf Genehmigung.'
uk: sentMsg: 'Відгук надіслано та очікує схвалення.'
```

---

## 3. SOUBORY K UPRAVE (checklist)

| # | Soubor | Co zmenit |
|---|--------|----------|
| 1 | `app/[locale]/recenze/nova/[slug]/page.tsx` | 'approved' → 'pending' (2 mista), smazat immediate recalc, zmenit success msg (4 locale) |
| 2 | `lib/admin-actions.ts` | Pridat rating recalc do `approveReview` a `rejectReview` |

**Zadne dalsi soubory se nemeni.** Infrastruktura (admin UI, getPendingReviews, verejne dotazy) uz existuje a funguje.

---

## 4. TESTOVACI PLAN

1. Odeslat recenzi na `/cs/recenze/nova/{slug}` → overit ze se zobrazi "ceka na schvaleni"
2. Overit ze recenze se NEZOBRAZUJE na verejnem profilu `/cs/profil/{slug}`
3. Overit ze recenze se ZOBRAZUJE v admin `/cs/admin/recenze` jako pending
4. Kliknout "Schvalit" v adminu → overit ze recenze se objevi na profilu + rating se aktualizuje
5. Kliknout "Zamitnout" na jinou recenzi → overit ze zmizi z fronty i z profilu
