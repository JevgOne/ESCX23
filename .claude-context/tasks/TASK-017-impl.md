# TASK-017: Implementace — Rozšířit What's new feed

## Datum: 2026-06-21

## Změněné soubory

### 1. `lib/queries.ts`
- Rozšířen `ActivityItem` interface: přidány `kind: 'video' | 'profile_update'` a `videoCount?: number`
- `getRecentActivity()` rozšířena o 2 nové SQL queries v `Promise.all`:
  - **Video query:** `girl_videos` JOIN `girls`, seskupení per dívka per den, COUNT videí
  - **Profile update query:** `girls` WHERE `updated_at > created_at` AND posledních 30 dní
- Mapping na `ActivityItem[]` pro oba nové typy
- Merge: `[...photos, ...reviews, ...videos, ...profileUpdates]` → sort by `when` DESC → slice

### 2. `components/home/ActivityFeed.tsx`
- Ikony rozšířeny: `📷` foto, `🎬` video, `✨` profile update, `⭐` recenze
- Texty: nové i18n klíče `added_video`, `added_videos`, `updated_profile`
- Singular/plural logika pro videa (identická s fotkami)

### 3. `messages/cs.json`
- `"added_video": "přidala nové video"`
- `"added_videos": "přidala {count} nová videa"`
- `"updated_profile": "aktualizovala svůj profil"`

### 4. `messages/en.json`
- `"added_video": "added a new video"`
- `"added_videos": "added {count} new videos"`
- `"updated_profile": "updated her profile"`

### 5. `messages/de.json`
- `"added_video": "hat ein neues Video hinzugefügt"`
- `"added_videos": "hat {count} neue Videos hinzugefügt"`
- `"updated_profile": "hat ihr Profil aktualisiert"`

### 6. `messages/uk.json`
- `"added_video": "додала нове відео"`
- `"added_videos": "додала {count} нових відео"`
- `"updated_profile": "оновила свій профіль"`

## Chování po změně

| Typ aktivity | Ikona | Příklad textu (CS) | Zdroj dat |
|-------------|-------|---------------------|-----------|
| Přidání fotek | 📷 | "přidala 6 nových fotografií" | `girl_photos.created_at` (existující) |
| Nová recenze | ⭐ | "obdržela recenzi 5★" | `reviews.created_at` (existující) |
| Přidání videa | 🎬 | "přidala nové video" | `girl_videos.created_at` (**nové**) |
| Aktualizace profilu | ✨ | "aktualizovala svůj profil" | `girls.updated_at` (**nové**) |

## Ověření
- TypeScript kompilace: OK (tsc --noEmit bez nových chyb)
- 6 souborů upraveno (2 TS + 4 JSON)
- Žádné nové npm balíčky
- Žádná DB migrace
- Čistě server-side (Server Component)
