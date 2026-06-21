# TASK-017: Rozšířit "What's new" feed o více typů aktivit — Implementační plán

## Zadání
> Rozšířit activity feed na homepage o další typy: přidání videa, změna profilu, přidání služeb, "jakákoliv změna".

## Aktuální stav

### Jak feed funguje

**Žádná activity log tabulka.** Feed je čistě query-based — dvě paralelní SQL queries na existující tabulky:

**`lib/queries.ts:442-494` — `getRecentActivity(limit)`:**
1. Query na `girl_photos` → seskupí per dívka per den → "Viktoria added 6 new photos"
2. Query na `reviews` (status=approved) → "Nika received a 5★ review"
3. Merge + sort by timestamp + slice to limit

**`components/home/ActivityFeed.tsx`:**
- Server Component, čte `getRecentActivity(6)`
- Ikona: `📷` pro foto, `⭐` pro recenze
- Text z i18n: `homepage.activity.added_photos`, `homepage.activity.received_review`
- Link na profil dívky

### ActivityItem interface (aktuální)
```ts
interface ActivityItem {
  kind: 'photo' | 'review';
  girlSlug: string;
  girlName: string;
  girlPhoto: string | null;
  when: string;
  photoCount?: number;
  rating?: number;
}
```

### I18n klíče (aktuální — 4 jazyky)
```json
{
  "added_photos": "added {count} new photos",
  "added_photo": "added a new photo",
  "received_review": "received a {rating}★ review",
  "no_recent": "No recent updates."
}
```

### Dostupná data v DB pro nové typy

| Aktivita | Tabulka | Timestamp sloupec | Poznámka |
|----------|---------|-------------------|----------|
| Přidání fotek | `girl_photos` | `created_at` | Funguje (existující) |
| Nová recenze | `reviews` | `created_at` | Funguje (existující) |
| Přidání videa | `girl_videos` | `created_at` | **Dostupné** — může se dotazovat stejně jako fotky |
| Změna profilu | `girls` | `updated_at` | **Dostupné** — ale neříká CO se změnilo |
| Přidání služeb | `girl_services` | ❌ žádný timestamp | **Nedostupné** — INSERT nemá `created_at` |

---

## Dva přístupy

### Přístup A: Query-based (rozšíření stávajícího vzoru)

Přidat další SQL queries na existující tabulky, analogicky k fotkám a recenzím. Žádná nová tabulka.

**Výhody:** Jednoduchý, konzistentní s aktuálním kódem, žádná migrace pro videa/profil update.
**Nevýhody:** `girl_services` nemá timestamp → nelze bez migrace. `girls.updated_at` neříká CO se změnilo.

### Přístup B: Activity log tabulka

Nová tabulka `activity_log` kam se zapisuje při každé akci. Feed čte z ní.

**Výhody:** Přesná kontrola co se zobrazí, libovolné typy, zpětné auditování.
**Nevýhody:** Nutná migrace, nutné přidat INSERT do každé Server Action, historická data chybí (feed bude prázdný dokud se neprovedou nové akce).

### Doporučení: Přístup A pro video + profile_update, Přístup B NENÍ potřeba

Pro požadované typy stačí query-based přístup:
- **Video:** Query na `girl_videos` (má `created_at`) — identický vzor s fotkami
- **Profile update:** Query na `girls.updated_at` — generická zpráva "updated her profile"
- **Services:** Přidat `created_at DEFAULT CURRENT_TIMESTAMP` na `girl_services` (malá migrace) NEBO přeskočit (služby se mění vzácně)

---

## Implementační plán

### Krok 1: Rozšířit `ActivityItem` interface

**Soubor:** `lib/queries.ts:432-440`

```ts
export interface ActivityItem {
  kind: 'photo' | 'review' | 'video' | 'profile_update';  // rozšířit
  girlSlug: string;
  girlName: string;
  girlPhoto: string | null;
  when: string;
  photoCount?: number;
  videoCount?: number;   // NOVÉ
  rating?: number;
}
```

### Krok 2: Přidat nové queries do `getRecentActivity()`

**Soubor:** `lib/queries.ts:442-494`

**2a) Video query (nová):**
```ts
// Přidat do Promise.all:
db.execute({
  sql: `SELECT
          g.slug, g.name,
          (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo,
          DATE(v.created_at) AS day,
          COUNT(*) AS cnt,
          MAX(v.created_at) AS last_at
        FROM girl_videos v
        JOIN girls g ON g.id = v.girl_id
        WHERE g.status = 'active'
        GROUP BY g.id, DATE(v.created_at)
        ORDER BY last_at DESC
        LIMIT ?`,
  args: [limit],
}),
```

**Mapping:**
```ts
const videos: ActivityItem[] = videoRes.rows.map((r) => ({
  kind: 'video' as const,
  girlSlug: String(r.slug),
  girlName: String(r.name),
  girlPhoto: r.photo ? String(r.photo) : null,
  when: String(r.last_at),
  videoCount: Number(r.cnt),
}));
```

**2b) Profile update query (nová):**
```ts
db.execute({
  sql: `SELECT
          g.slug, g.name,
          (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo,
          g.updated_at
        FROM girls g
        WHERE g.status = 'active'
          AND g.updated_at > g.created_at
          AND g.updated_at > datetime('now', '-30 days')
        ORDER BY g.updated_at DESC
        LIMIT ?`,
  args: [limit],
}),
```

**Podmínka `updated_at > created_at`:** Filtruje dívky které se nikdy neaktualizovaly (initial insert nastaví obojí stejně).

**Mapping:**
```ts
const profileUpdates: ActivityItem[] = profileRes.rows.map((r) => ({
  kind: 'profile_update' as const,
  girlSlug: String(r.slug),
  girlName: String(r.name),
  girlPhoto: r.photo ? String(r.photo) : null,
  when: String(r.updated_at),
}));
```

**2c) Merge:**
```ts
return [...photos, ...reviews, ...videos, ...profileUpdates]
  .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
  .slice(0, limit);
```

### Krok 3: Rozšířit ActivityFeed komponentu

**Soubor:** `components/home/ActivityFeed.tsx:41-49`

Aktuálně:
```tsx
<div className="activity-icon">
  {item.kind === 'photo' ? '📷' : '⭐'}
</div>
<div className="activity-text">
  <strong>{item.girlName}</strong>{' '}
  {item.kind === 'photo'
    ? item.photoCount === 1 ? t('added_photo') : t('added_photos', { count: item.photoCount ?? 1 })
    : t('received_review', { rating: item.rating ?? 5 })}
</div>
```

Po změně:
```tsx
<div className="activity-icon">
  {item.kind === 'photo' ? '📷' :
   item.kind === 'video' ? '🎬' :
   item.kind === 'profile_update' ? '✨' : '⭐'}
</div>
<div className="activity-text">
  <strong>{item.girlName}</strong>{' '}
  {item.kind === 'photo'
    ? (item.photoCount === 1 ? t('added_photo') : t('added_photos', { count: item.photoCount ?? 1 }))
    : item.kind === 'video'
      ? (item.videoCount === 1 ? t('added_video') : t('added_videos', { count: item.videoCount ?? 1 }))
      : item.kind === 'profile_update'
        ? t('updated_profile')
        : t('received_review', { rating: item.rating ?? 5 })}
</div>
```

### Krok 4: I18n — nové klíče

**Soubory:** `messages/cs.json`, `messages/en.json`, `messages/de.json`, `messages/uk.json`

```json
// en.json — homepage.activity:
{
  "added_video": "added a new video",
  "added_videos": "added {count} new videos",
  "updated_profile": "updated her profile"
}

// cs.json:
{
  "added_video": "přidala nové video",
  "added_videos": "přidala {count} nová videa",
  "updated_profile": "aktualizovala svůj profil"
}

// de.json:
{
  "added_video": "hat ein neues Video hinzugefügt",
  "added_videos": "hat {count} neue Videos hinzugefügt",
  "updated_profile": "hat ihr Profil aktualisiert"
}

// uk.json:
{
  "added_video": "додала нове відео",
  "added_videos": "додала {count} нових відео",
  "updated_profile": "оновила свій профіль"
}
```

### Krok 5: (Volitelné) Deduplikace

**Problém:** Pokud dívka přidala video A ZÁROVEŇ aktualizovala profil ve stejný den, ve feedu se objeví dvě položky. To je OK — jsou to dvě různé aktivity. Ale pokud chceme deduplikovat:

```ts
// Po merge, před slice:
const seen = new Set<string>();
const deduped = merged.filter((item) => {
  const key = `${item.girlSlug}-${item.kind}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
```

**Doporučení:** Neduplikovat zbytečně. Dvě různé aktivity = dvě položky. Deduplikace jen pokud uživatel explicitně řekne že je to moc.

### Krok 6: (Volitelné) Přidat služby

**Problém:** `girl_services` nemá `created_at` — nelze dotazovat kdy se služba přidala.

**Řešení (pokud se chce):**

**6a) Migrace — přidat timestamp:**
```sql
ALTER TABLE girl_services ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```
V `lib/db.ts` `runMigrations()`.

**6b) Query:**
```sql
SELECT g.slug, g.name, ..., COUNT(*) AS cnt, MAX(gs.created_at) AS last_at
FROM girl_services gs
JOIN girls g ON g.id = gs.girl_id
WHERE g.status = 'active' AND gs.created_at IS NOT NULL
GROUP BY g.id, DATE(gs.created_at)
ORDER BY last_at DESC LIMIT ?
```

**6c) I18n:**
```json
{ "added_service": "added a new service", "added_services": "added {count} new services" }
```

**Doporučení:** Přeskočit v první iteraci. Služby se mění vzácně a `profile_update` (via `girls.updated_at`) pokryje většinu případů kde se něco mění.

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `lib/queries.ts` | Rozšířit `ActivityItem` interface, přidat video + profile_update queries do `getRecentActivity()` (~30 řádků) |
| `components/home/ActivityFeed.tsx` | Ikony + texty pro nové typy (~10 řádků) |
| `messages/cs.json` | 3 nové klíče v `homepage.activity` |
| `messages/en.json` | 3 nové klíče |
| `messages/de.json` | 3 nové klíče |
| `messages/uk.json` | 3 nové klíče |

## Volitelné soubory

| Soubor | Změna |
|--------|-------|
| `lib/db.ts` | Migrace: ALTER TABLE girl_services ADD COLUMN created_at (jen pokud chceme services v feedu) |

## Scope

- 6 souborů k úpravě (2 TS + 4 JSON)
- ~40 řádků TypeScript + 12 řádků i18n
- Žádné nové soubory
- Žádné nové npm balíčky
- Žádná migrace (pokud přeskočíme services)
- Čistě server-side

## Chování po změně

| Typ aktivity | Ikona | Příklad textu (EN) | Zdroj dat |
|-------------|-------|---------------------|-----------|
| Přidání fotek | 📷 | "added 6 new photos" | `girl_photos.created_at` (existující) |
| Nová recenze | ⭐ | "received a 5★ review" | `reviews.created_at` (existující) |
| Přidání videa | 🎬 | "added a new video" | `girl_videos.created_at` (**nové**) |
| Aktualizace profilu | ✨ | "updated her profile" | `girls.updated_at` (**nové**) |

## Bezpečnostní poznámky

- Žádné user-generated content v activity textech — jen i18n klíče s parametry (count, rating)
- `girls.status = 'active'` filtr na všech queries — neaktivní/archivované profily se nezobrazují
- `updated_at > created_at` filtr — profily bez reálné aktualizace se nezobrazují
