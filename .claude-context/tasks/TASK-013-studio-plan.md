# TASK-013: Studio video self-service — Implementační plán

## Zadání
> Dívky si nemůžou samy přidat/smazat Vimeo video, musí prosit admina. Přidat /studio/videa stránku.

## Aktuální stav

### Admin verze (vzor)
- **Stránka:** `app/[locale]/(admin)/admin/divky/[id]/videa/page.tsx` (202 řádků)
- **Server Actions:** `addGirlVideo()` a `removeGirlVideo()` v `lib/admin-actions.ts:1292-1331`
- **Query:** `getGirlVideos(girlId)` v `lib/queries.ts:2144` — vrací `GirlVideo[]` s `id, girl_id, url, vimeo_id, display_order, created_at`
- **Helper:** `extractVimeoId()` v `lib/admin-actions.ts:1283` — parsuje Vimeo URL/ID

### Studio pattern
- **Layout:** `app/[locale]/studio/layout.tsx` — `requireGirl()` guard, `StudioSidebar` + `studio-main`
- **Auth:** `requireGirl()` vrací `AuthUser` s `girl_id: number | null`
- **Pattern na stránce:** `const user = await requireGirl(); const girlId = user.girl_id!;`
- **Existující actions:** `lib/studio-actions.ts` — `'use server'`, používá `requireGirl()` / `requireAdmin()`, `studioRedirect()`
- **Sidebar:** `components/studio/StudioSidebar.tsx` — pole `NAV` s položkami (chybí "Videa")
- **Topbar:** `components/studio/StudioTopbar.tsx` — jednoduchý `<h1>` wrapper

### Existující studio stránky (19)
- Dashboard, Základní info, Tělo, Životní styl, Dostupnost, Kalendář, Osobní zpráva, Hlasová zpráva, Doporučený program, Služby, Hashtagy, Jazyky, Fotky, Stories, Recenze, Rezervace, Statistiky, Status profilu, Login
- **Videa chybí** — dívka musí prosit admina

### DB tabulka `girl_videos`
```
id, girl_id, filename, url, display_order, created_at
```
- Žádný video limit per girl (admin verze nemá)
- `display_order` se automaticky počítá jako `MAX(display_order) + 1`

---

## Implementační plán

### Krok 1: Server Actions — přidat do `lib/studio-actions.ts`

Dvě nové funkce na konec souboru:

```ts
export async function addStudioVideo(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id;
  if (!girlId) await studioRedirect('/studio');

  const rawUrl = String(formData.get('vimeo_url') ?? '').trim();
  if (!rawUrl) await studioRedirect('/studio/videa?error=empty');

  const vimeoId = extractVimeoId(rawUrl);
  if (!vimeoId) await studioRedirect('/studio/videa?error=invalid');

  const url = `https://vimeo.com/${vimeoId}`;

  const orderRes = await db.execute({
    sql: `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM girl_videos WHERE girl_id = ?`,
    args: [girlId],
  });
  const nextOrder = Number(orderRes.rows[0]?.next_order ?? 0);

  await db.execute({
    sql: `INSERT INTO girl_videos (girl_id, filename, url, display_order, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    args: [girlId, `vimeo-${vimeoId}`, url, nextOrder],
  });

  revalidatePath('/cs/studio/videa');
  revalidatePath('/cs/profil');
  await studioRedirect('/studio/videa?saved=1');
}

export async function removeStudioVideo(formData: FormData) {
  const user = await requireGirl();
  const girlId = user.girl_id;
  if (!girlId) await studioRedirect('/studio');

  const videoId = Number(formData.get('video_id'));
  if (!videoId) await studioRedirect('/studio/videa');

  // BEZPEČNOST: smazat jen video patřící přihlášené dívce
  await db.execute({
    sql: `DELETE FROM girl_videos WHERE id = ? AND girl_id = ?`,
    args: [videoId, girlId],
  });

  revalidatePath('/cs/studio/videa');
  revalidatePath('/cs/profil');
  await studioRedirect('/studio/videa');
}
```

**Důležité rozdíly oproti admin verzi:**
1. **Auth:** `requireGirl()` místo `requireAdmin()`
2. **girl_id z session:** Bere `user.girl_id` — dívka nemůže editovat cizí videa
3. **Delete WHERE:** `WHERE id = ? AND girl_id = ?` — extra ochrana (admin verze má jen `WHERE id = ?`)
4. **Redirect:** `studioRedirect()` místo `adminRedirect()`

**Helper `extractVimeoId`:** Už existuje v `admin-actions.ts:1283`. Buď:
- (A) Přesunout do sdíleného `lib/utils.ts` a importovat v obou — **čistější**
- (B) Zkopírovat do `studio-actions.ts` — **rychlejší, bez refaktoru**

**Doporučení:** Varianta (A) — vytvořit `extractVimeoId` v `lib/utils.ts` (nebo `lib/vimeo.ts`), importovat v obou action souborech. Funkce má 6 řádků, je pure, nemá žádné závislosti.

### Krok 2: Stránka — `app/[locale]/studio/videa/page.tsx` (nový soubor)

Server Component, bez `'use client'`. Vzor: admin videa stránka, ale se studio layoutem.

```tsx
import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlVideos } from '@/lib/queries';
import { addStudioVideo, removeStudioVideo } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// STYLES — znovupoužít admin gv-* CSS s úpravou (viz Krok 4)

export default async function StudioVideaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;
  const videos = await getGirlVideos(girlId);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <StudioTopbar title="Moje videa" />

      <div className="studio-content">
        {/* Formulář pro přidání */}
        <div className="gv-card">
          <h3>Přidat Vimeo video</h3>
          <form action={addStudioVideo}>
            <div className="gv-form-row">
              <input className="gv-input" name="vimeo_url" type="text" required
                     placeholder="https://vimeo.com/123456789" />
              <button type="submit" className="gv-btn-add">+ Přidat</button>
            </div>
            <div className="gv-hint">
              Vlož odkaz z Vimeo (např. https://vimeo.com/123456789) nebo jen číslo videa
            </div>
          </form>
        </div>

        {/* Seznam videí */}
        <div className="gv-card">
          <h3>Moje videa ({videos.length})</h3>
          {videos.length === 0 ? (
            <div className="gv-empty">Zatím žádná videa.</div>
          ) : (
            <div className="gv-list">
              {videos.map((v) => (
                <div key={v.id} className="gv-item">
                  <div className="gv-thumb">
                    <iframe
                      src={`https://player.vimeo.com/video/${v.vimeo_id}?badge=0&autopause=0`}
                      allow="autoplay; fullscreen" allowFullScreen
                      title={`Video ${v.vimeo_id}`}
                    />
                  </div>
                  <div className="gv-item-info">
                    <div className="gv-item-url">{v.url}</div>
                    {v.created_at && (
                      <div className="gv-item-date">Přidáno: {v.created_at}</div>
                    )}
                  </div>
                  <form action={removeStudioVideo}>
                    <input type="hidden" name="video_id" value={v.id} />
                    <button type="submit" className="gv-btn-del">Smazat</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

### Krok 3: Sidebar — přidat odkaz do `components/studio/StudioSidebar.tsx`

Přidat položku do pole `NAV` za "Fotky" (řádek 23):

```ts
{ href: '/cs/studio/fotky',        label: 'Fotky',            emoji: '📷' },
{ href: '/cs/studio/videa',        label: 'Videa',            emoji: '🎬' },  // NOVÉ
{ href: '/cs/studio/stories',      label: 'Stories',           emoji: '📸' },
```

### Krok 4: CSS — `STYLES` konstanta ve stránce

Znovupoužít admin `gv-*` třídy (jsou scoped inline přes `<style>`, nekonflikují). CSS je identický s admin verzí (`gv-wrap`, `gv-card`, `gv-form-row`, `gv-input`, `gv-btn-add`, `gv-hint`, `gv-list`, `gv-item`, `gv-thumb`, `gv-item-info`, `gv-item-url`, `gv-item-date`, `gv-btn-del`, `gv-empty`).

Jednoduše zkopírovat `STYLES` konstantu z admin stránky. Obě stránky mají inline `<style>` tag, takže se nepřekrývají.

**Alternativa:** Přesunout `gv-*` třídy do `globals.css` a sdílet. Ale inline pattern je konzistentní s existujícím kódem (admin i studio stránky používají inline `<style>`).

---

## Soubory k vytvoření

| Soubor | Účel |
|--------|------|
| `app/[locale]/studio/videa/page.tsx` | Studio video self-service stránka |

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `lib/studio-actions.ts` | Přidat `addStudioVideo()` + `removeStudioVideo()` (~40 řádků) |
| `components/studio/StudioSidebar.tsx` | Přidat "Videa" do NAV pole (1 řádek) |

## Volitelná úprava (refaktor)

| Soubor | Změna |
|--------|-------|
| `lib/vimeo.ts` (nový) | Extrahovat `extractVimeoId()` ze sdílení |
| `lib/admin-actions.ts` | Import `extractVimeoId` z `lib/vimeo.ts` místo lokální funkce |
| `lib/studio-actions.ts` | Import `extractVimeoId` z `lib/vimeo.ts` |

---

## Scope

- 1 nový soubor + 2 upravené (+ volitelně 1 nový `lib/vimeo.ts` + 1 upravený)
- ~120 řádků TypeScript (stránka ~80 + actions ~40)
- Čistě server-side (no `'use client'`)
- Formuláře přes Server Actions (`<form action={...}>`)
- Funguje bez JS
- Žádné nové npm balíčky

## Bezpečnostní poznámky

1. **Ownership guard:** `removeStudioVideo` DELETE query má `AND girl_id = ?` — dívka nemůže smazat cizí video
2. **Auth guard:** `requireGirl()` v actions i ve stránce (layout to řeší globálně, ale actions musí být nezávisle chráněné)
3. **Input validace:** `extractVimeoId()` sanitizuje vstup — jen číselné Vimeo ID se uloží
4. **Žádný file upload:** Pouze Vimeo URL odkaz, videa hostuje Vimeo (žádné blob storage)

## Závislosti

- `getGirlVideos()` z `lib/queries.ts` — **existuje**
- `requireGirl()` z `lib/auth.ts` — **existuje**
- `studioRedirect()` z `lib/studio-actions.ts` — **existuje**
- `extractVimeoId()` z `lib/admin-actions.ts` — **existuje** (potřeba sdílet nebo zkopírovat)
- `StudioTopbar` z `components/studio/StudioTopbar.tsx` — **existuje**
- `girl_videos` tabulka — **existuje** (žádná migrace potřeba)
