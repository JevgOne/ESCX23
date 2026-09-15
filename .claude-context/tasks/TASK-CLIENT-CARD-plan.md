# TASK #3: Client card redesign — TOP kvalita

## Status: PLAN HOTOVY — ceka na implementaci

## Analyza

### Co uzivatel rika
- "je potreba udelat lip tu kartu tohle je hnusny"
- "tomusi bejt vic TOP chapes"

### Aktualni stav (`app/booking/clients/[id]/page.tsx`)
Stranka existuje a funguje, ale ma tyto problemy:

1. **Flat layout** — vsechno je v jednom sloupci s max-width 700px, vypada jako formulare ne jako CRM karta
2. **Stat cards** — 5 malych boxu v jednom radku (5 sloupcu), na mensim monitoru se zacnou mackat
3. **Info grid** — 2 sloupce (Kontakt + Statistiky) jsou OK ale vizualne nudne
4. **Navstivene divky** — jen text chipy s poctem, zadne fotky/avatary
5. **Historie** — plna tabulka se vsemi sloupci, na mobilech nefunguje
6. **Notes + Trust actions** — pouzivaji komponenty `ClientNotes.tsx` a `ClientTrustActions.tsx` (use client), jsou funkcni ale vizualne basic
7. **Chybi** — zadny hero/cover area, zadna vizualni hierarchie, vse stejne male

### Dostupna data (z `lib/client-queries.ts`)

#### ClientDetail
- `id`, `clientNumber`, `nickname`
- `phoneEncrypted`, `phoneDecrypted` (admin only)
- `nameEncrypted`, `surnameEncrypted`
- `emailEncrypted`, `emailDecrypted` (admin only)
- `telegramId`, `deepLinkToken`
- `source` (phone/telegram/whatsapp/walkin/web)
- `trustLevel` (new/verified/regular/vip)
- `totalVisits`, `totalSpent`, `totalPoints`, `noShowCount`
- `isBanned`, `banReason`
- `notes`
- `firstVisitDate`, `lastVisitDate`
- `regularSince`
- `createdAt`, `updatedAt`

#### ClientGirlStat[]
- `girlName`, `visitCount`

#### ClientBookingHistory[]
- `id`, `date`, `startTime`, `girlName`, `durationMinutes`
- `channel`, `status`, `price`, `pointsEarned`

#### telegram_users tabulka (propojeno pres client_id)
- `telegram_user_id`, `telegram_name`, `chat_id`, `is_active`, `activated_at`, `last_interaction`
- **CHYBI v getClientDetail()** — neni joinovano, je treba pridat

### CSS promenne (z booking layout)
```
--bg: #0c0a0e      --bg-soft: #15101a    --bg-elev: #1f1726
--line: #2a2230     --text: #f4eef4       --muted: #a89cb0
--dim: #6a5e72      --coral: #f27d8d
```

## Plan implementace

### Vizualni koncept: Moderni CRM klientska karta

Inspirace: HubSpot/Salesforce contact cards — hero sekce nahore s prominentnim avatarem a klic. info, pak 2-sloupcovy layout (leva = detail panely, prava = timeline/historie).

### Krok 1: Rozsirit data query — pridat Telegram info

V `lib/client-queries.ts` funkce `getClientDetail()`:

```ts
// Pridat LEFT JOIN na telegram_users
const result = await db.execute({
  sql: `
    SELECT
      bc.*,
      tu.telegram_user_id AS tg_user_id,
      tu.telegram_name AS tg_name,
      tu.chat_id AS tg_chat_id,
      tu.is_active AS tg_is_active,
      tu.activated_at AS tg_activated_at,
      tu.last_interaction AS tg_last_interaction,
      (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id
       AND b.status IN ('completed', 'confirmed', 'in_progress')
       ORDER BY b.date ASC LIMIT 1) AS first_visit,
      (SELECT b.date FROM bookings_v2 b WHERE b.client_id = bc.id
       AND b.status IN ('completed', 'confirmed', 'in_progress')
       ORDER BY b.date DESC LIMIT 1) AS last_visit
    FROM booking_clients bc
    LEFT JOIN telegram_users tu ON tu.client_id = bc.id
    WHERE bc.id = ?
  `,
  args: [id],
});
```

Pridat do `ClientDetail` interface:
```ts
telegramUserId: string | null;   // Telegram user ID
telegramName: string | null;      // Telegram display name
telegramChatId: string | null;    // chat_id
telegramActive: boolean;          // is_active
telegramActivatedAt: string | null;
telegramLastInteraction: string | null;
```

### Krok 2: Novy layout — hero + 2 sloupce

#### Struktura stranky:
```
+----------------------------------------------------------+
| < Zpet na seznam                              + Rezervace |
+----------------------------------------------------------+
|                                                          |
|  [AVATAR]  Nickname            VIP BADGE                 |
|            LG-0042 / TG: @username                       |
|            Klient od: 15.3.2026 / Posledni: 12.9.2026   |
|                                                          |
+----------------------------------------------------------+
|                                                          |
| [Navstevy]  [No-shows]  [Utraceno]  [Body]              |
|    12          0          24,000 Kc   1,200              |
|                                                          |
+-----------------------------+----------------------------+
|  KONTAKT                    |  OBLIBENE DIVKY            |
|  Tel: +420 777 123 456      |  [Emily foto] 5x           |
|  Email: klient@email.cz     |  [Katy foto]  3x           |
|  TG: @username (aktivni)    |  [Luna foto]  2x           |
|  Deep-link: t.me/...        |                            |
|  Zdroj: Telegram            |                            |
+-----------------------------+----------------------------+
|  SPRAVA KLIENTA                                          |
|  [Novy] [Overeny] [Staly] [VIP]  |  [Banovat]           |
+----------------------------------------------------------+
|  INTERNI POZNAMKY                                        |
|  "Preferuje Emily, vzdy plati hotove..."                 |
|  [Upravit poznamky]                                      |
+----------------------------------------------------------+
|  HISTORIE REZERVACI (12)                                 |
|  +------------------------------------------------------+|
|  | 15.9.2026  Emily  60 min  TG  Dokonceno  3000 Kc   ||
|  | 10.9.2026  Katy   45 min  TEL Potvrzeno  2500 Kc   ||
|  | ...                                                  ||
|  +------------------------------------------------------+|
+----------------------------------------------------------+
```

### Krok 3: CSS redesign — konkretni zmeny

#### Hero sekce (nahrazuje puvodni cd-header)
```css
.cd-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, var(--bg-elev) 0%, rgba(242,125,141,0.06) 100%);
  border: 1px solid var(--line);
  border-radius: 14px;
  margin-bottom: 20px;
  position: relative;
}
.cd-hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--bg);
  border: 3px solid var(--coral);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: var(--coral);
  font-size: 28px;
  flex-shrink: 0;
}
.cd-hero-avatar.banned {
  border-color: var(--red);
  color: var(--red);
}
.cd-hero-avatar.vip {
  border-color: var(--yellow);
  box-shadow: 0 0 16px rgba(251,191,36,0.2);
}
.cd-hero-info { flex: 1; }
.cd-hero-name {
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.cd-hero-meta {
  font-size: 13px;
  color: var(--muted);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.cd-hero-meta span { display: flex; align-items: center; gap: 4px; }
```

#### Stat bar (nahrazuje 5-sloupcovy grid)
```css
.cd-stats-bar {
  display: flex;
  gap: 0;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}
.cd-stat-item {
  flex: 1;
  text-align: center;
  padding: 16px 12px;
  border-right: 1px solid var(--line);
}
.cd-stat-item:last-child { border-right: none; }
.cd-stat-val {
  font-size: 22px;
  font-weight: 800;
  font-family: Georgia, serif;
}
.cd-stat-label {
  font-size: 10px;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}
```

#### 2-sloupcovy detail grid
```css
.cd-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 640px) {
  .cd-detail-grid { grid-template-columns: 1fr; }
  .cd-stats-bar { flex-wrap: wrap; }
  .cd-stat-item { flex: 1 1 50%; border-bottom: 1px solid var(--line); }
}
```

#### Panel karta (sdileny styl pro vsechny info sekce)
```css
.cd-panel {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
}
.cd-panel-title {
  font-size: 11px;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cd-panel-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background: var(--coral);
  border-radius: 2px;
}
```

#### Oblibene divky — vizualni chipy s poctem
```css
.cd-girl-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 6px;
}
.cd-girl-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-elev);
  border: 2px solid var(--coral);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--coral);
  flex-shrink: 0;
}
.cd-girl-name { font-size: 13px; font-weight: 600; flex: 1; }
.cd-girl-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--coral);
  background: rgba(242,125,141,0.1);
  padding: 2px 8px;
  border-radius: 10px;
}
```

#### Kontakt sekce — ikony + lepsi spacing
```css
.cd-contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(42,34,48,0.3);
  font-size: 13px;
}
.cd-contact-row:last-child { border-bottom: none; }
.cd-contact-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.cd-contact-icon.phone { background: rgba(74,222,128,0.12); }
.cd-contact-icon.email { background: rgba(96,165,250,0.12); }
.cd-contact-icon.telegram { background: rgba(34,158,217,0.12); }
.cd-contact-label { color: var(--muted); min-width: 60px; }
.cd-contact-value { font-weight: 600; flex: 1; }
```

#### Historie — kompaktnejsi a mobile-friendly
```css
/* Zachovat existujici tabulku na desktopu */
/* Na mobilu prepnout na kartovy layout */
@media (max-width: 640px) {
  .cd-history thead { display: none; }
  .cd-history tr {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .cd-history td { padding: 0; border: none; }
}
```

### Krok 4: Rozsirit girl stats query — pridat fotky

V `lib/client-queries.ts` funkce `getClientGirlStats()`:

```ts
// Pridat photo JOIN pro avatar
const result = await db.execute({
  sql: `
    SELECT g.name AS girl_name, g.slug, COUNT(*) AS cnt,
      (SELECT gp.url FROM girl_photos gp WHERE gp.girl_id = g.id
       AND gp.is_primary = 1 LIMIT 1) AS photo_url
    FROM bookings_v2 b
    JOIN girls g ON g.id = b.girl_id
    WHERE b.client_id = ?
      AND b.status IN ('completed', 'confirmed', 'in_progress')
    GROUP BY b.girl_id
    ORDER BY cnt DESC
  `,
  args: [clientId],
});
```

Pridat do `ClientGirlStat`:
```ts
export interface ClientGirlStat {
  girlName: string;
  girlSlug: string;
  visitCount: number;
  photoUrl: string | null;
}
```

### Krok 5: Ponechat existujici client components

`ClientNotes.tsx` a `ClientTrustActions.tsx` zustavaji beze zmeny — jsou funkcni. Jen je vizualne obali novy `.cd-panel` styl (wrapper v server component).

## Soubory k editovat

1. **`app/booking/clients/[id]/page.tsx`** — kompletni redesign JSX + CSS (hlavni prace)
2. **`lib/client-queries.ts`** — rozsirit `getClientDetail()` o Telegram JOIN, rozsirit `getClientGirlStats()` o fotky
3. **`components/booking/ClientNotes.tsx`** — beze zmeny (nebo jen drobny CSS tweak)
4. **`components/booking/ClientTrustActions.tsx`** — beze zmeny (nebo jen drobny CSS tweak)

## Co se NEMENI

- Logika auth (admin-only PII decrypt) — uz funguje z Task #2
- Audit logging — uz funguje
- Client actions (notes update, trust change, ban) — uz funguje
- Client list stranka — neni soucasti tohoto tasku

## Implementacni poznamky

1. **Server Component** — stranka zustava server component (force-dynamic)
2. **Inline CSS** — pouzivat `<style dangerouslySetInnerHTML>` pattern jako vsude v booking
3. **Mobile responsive** — `@media (max-width: 640px)` breakpoint pro single-column layout
4. **Bez externiho CSS frameworku** — jen CSS variables z booking layout
5. **Max-width** — zvysit z 700px na 800px pro lepsi vyuziti prostoru
6. **Fotky divek** — pokud `photo_url` je null, pouzit initial-avatar (prvni pismeno jmena)

## Priorita

Toto je cisteUI/CSS redesign + maly data rozsireni. Zadna nova business logika. Odhadovana zmena: ~300 radku CSS + ~50 radku JSX restrukturace + ~20 radku query update.
