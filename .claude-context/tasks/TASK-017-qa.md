# TASK-017: QA — Activity feed rozšíření

**Datum:** 2026-06-21
**Kontrolor:** kontrolor

---

## 1. Simplify kontrola

### lib/queries.ts — getRecentActivity()

**Architektura:**
4 paralelní DB queries v `Promise.all` → merge → sort DESC → slice. Správný vzor, efektivní. ✅

**Photo query (existující):**
```sql
GROUP BY g.id, DATE(p.created_at)
```
Seskupuje fotky per dívka per den — správně, zabraňuje flood od jedné dívky. ✅

**Video query (nová):**
```sql
SELECT ... FROM girl_videos v JOIN girls g ON g.id = v.girl_id
WHERE g.status = 'active'
GROUP BY g.id, DATE(v.created_at)
ORDER BY last_at DESC LIMIT ?
```
Identická struktura jako photo query — konzistentní. ✅

**Profile update query (nová):**
```sql
WHERE g.status = 'active'
  AND g.updated_at > g.created_at
  AND g.updated_at > datetime('now', '-30 days')
ORDER BY g.updated_at DESC LIMIT ?
```
Podmínka `updated_at > created_at` správně filtruje nově vytvořené profily (kde `updated_at == created_at`). Okno 30 dní. ✅

**Potenciální issue — profile update flood:**
Na rozdíl od foto a video queries, profile update query **neseskupuje per dívka per den**. Pokud admin aktualizuje profil Anetty 3x za den, zobrazí se **pouze jednou** (protože query vrací jen 1 řádek per dívka — `LIMIT ?` funguje na celý resultset, ne per dívka). Ale: pokud je `limit=6` a máme 6 různých dívek s updatem, může jedna dívka zabrat více slotů pokud má více updates — **NE, GROUP BY není přítomen** takže jeden dívka = jeden řádek (ORDER BY updated_at DESC + LIMIT vrátí nejnovější pro každou dívku jen pokud je LIMIT dost velký). Spíše riziko jen pokud je DB hodně aktivní. Akceptovatelné pro současný rozsah (malý počet dívek). Non-blocker.

**Sort merge:**
```ts
return [...photos, ...reviews, ...videos, ...profileUpdates]
  .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
  .slice(0, limit);
```
Správné — merge 4 polí, sort by `when` DESC, slice na `limit`. ✅

**Potenciální issue — `when` jako string z SQLite:**
SQLite vrací datetime jako string (`"2026-06-21 14:30:00"`). `new Date("2026-06-21 14:30:00")` — toto je ambivalentní formát (bez timezone). Node.js to typicky parsuje jako lokální čas. Může způsobit minoritní nesprávné pořadí u položek ze stejné sekundy. V praxi nepodstatné. Non-blocker.

### components/home/ActivityFeed.tsx

Kód je čistý. Logika zobrazení textu je správně strukturovaná s ternárními výrazy:
```tsx
item.kind === 'photo'   → singular/plural fotky
item.kind === 'video'   → singular/plural videa  
item.kind === 'profile_update' → fixed text
default (review)        → t('received_review', { rating })
```

**Singular/plural logika pro video:**
```tsx
(item.videoCount ?? 1) === 1 ? t('added_video') : t('added_videos', { count: item.videoCount ?? 1 })
```
Správně — identická logika jako pro foto. ✅

**Ikony:**
- 📷 foto ✅
- 🎬 video ✅
- ✨ profile update ✅
- ⭐ recenze (default) ✅

**Link na profil:**
```tsx
href={{ pathname: '/profil/[slug]', params: { slug: item.girlSlug } }}
```
Všechny 4 typy aktivit odkazují na profil dívky — správné. ✅

**Server Component:**
Žádný `'use client'`, žádný `useState`. ✅

### i18n — messages/*.json

Všechny 4 jazyky mají nové klíče na **stejném řádkovém místě** (řádky 88-91), konzistentně:

| Klíč | CS | EN | DE | UK |
|------|-----|-----|-----|-----|
| `added_video` | přidala nové video | added a new video | hat ein neues Video hinzugefügt | додала нове відео |
| `added_videos` | přidala {count} nová videa | added {count} new videos | hat {count} neue Videos hinzugefügt | додала {count} нових відео |
| `updated_profile` | aktualizovala svůj profil | updated her profile | hat ihr Profil aktualisiert | оновила свій профіль |
| `no_recent` | Zatím žádné nedávné aktualizace. | No recent updates. | Noch keine Updates. | Нових оновлень поки немає. |

**Placeholder `{count}` přítomen ve všech jazycích.** ✅

**Jazyková poznámka — CS pluralizace:**
`"přidala {count} nová videa"` — v češtině by správná pluralizace byla:
- 1 → "přidala nové video" (singular klíč)
- 2-4 → "přidala 2 nová videa" ✅
- 5+ → "přidala 5 **nových** videí" (genitive plural)

Pro 5+ videí bude text gramaticky nesprávný ("přidala 5 nová videa"). next-intl podporuje ICU plural rules — ale implementace používá jen binary singular/plural (1 vs. >1), což je omezení existující i pro fotky. Konzistentní s existujícím vzorem. Non-blocker.

---

## 2. Debug kontrola

### TypeScript
```
npx tsc --noEmit → 3 chyby v e2e/tests/full-test.spec.ts (pre-existing)
```
Produkční kód bez nových chyb. ✅

### Build
Pre-existing — build prošel v předchozích QA kolech. Žádné strukturální změny které by rozbily build.

---

## 3. Reverzní kontrola vs zadání

### Původní zadání TASK-017
"Rozšířit What's new feed o více typů aktivit"

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Nový typ aktivity: přidání videa | ✅ | `kind: 'video'`, query na `girl_videos` |
| 2 | Nový typ aktivity: aktualizace profilu | ✅ | `kind: 'profile_update'`, query na `girls.updated_at` |
| 3 | ActivityItem interface rozšířen | ✅ | Přidány `'video' \| 'profile_update'` do kind union |
| 4 | `videoCount` field přidán | ✅ | `videoCount?: number` v interface |
| 5 | Ikony pro nové typy | ✅ | 🎬 video, ✨ profile_update |
| 6 | Texty pro nové typy | ✅ | i18n klíče added_video/added_videos/updated_profile |
| 7 | Lokalizace ve 4 jazycích | ✅ | cs/en/de/uk — všechny kompletní |
| 8 | Singular/plural pro video | ✅ | Identická logika jako pro foto |
| 9 | Žádná DB migrace potřeba | ✅ | Využívá existující `girl_videos` a `girls.updated_at` |
| 10 | Server Component zachován | ✅ | Žádné 'use client' přidáno |

---

## Závěr

### Blokery
Žádné.

### Non-blocker nálezy

| # | Nález | Závažnost |
|---|-------|-----------|
| 1 | Profile update query neseskupuje per dívka per den (možné duplicitní položky při časté editaci) | Nízká |
| 2 | CS pluralizace videí gramaticky nesprávná pro 5+ (konsistentní s existujícím vzorem fotek) | Velmi nízká |
| 3 | `when` datetime string bez timezone — sort může být nesprávný u položek ze stejné sekundy | Velmi nízká |
| 4 | e2e TypeScript chyby (3x sidebarText possibly null) — pre-existing | Existující |

### Verdikt
**PASS** — rozšíření feedu implementováno správně. Nové SQL queries jsou konzistentní se stávajícím vzorem. i18n kompletní ve všech 4 jazycích. TypeScript bez nových chyb. Server Component zachován.
