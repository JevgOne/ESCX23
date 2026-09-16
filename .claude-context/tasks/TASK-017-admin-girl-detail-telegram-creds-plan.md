# Task #17: Detail dívky v admin — Telegram + přihlašovací údaje

## Cíl
Na detail stránce dívky v admin panelu (Správa → Dívky → klik na řádek → detail) přidat:
1. Telegram propojení sekci (stav, deep-link)
2. Přihlašovací údaje sekci (email, reset hesla)

## Kontext

### Existující stránky:
| Stránka | Cesta | Popis |
|---------|-------|-------|
| **Seznam dívek** (booking admin) | `app/booking/girls/page.tsx` | Tabulka dívek — **NEMÁ klikací řádky/detail** |
| **Detail dívky** (admin) | `app/[locale]/(admin)/admin/divky/[id]/page.tsx` | Read-only profil, akční tlačítka |
| **Edit dívky** (admin) | `app/[locale]/(admin)/admin/divky/[id]/edit/page.tsx` | Formulář s 13 sekcemi |

### Rozhodnutí: KAM přidat?
Uživatel říká "bych to dal" na detail page. Nejlepší místo je **admin detail** (`admin/divky/[id]/page.tsx`) — je to read-only přehled, kam se přidá Telegram stav a credentials sekce.

Alternativně pro booking admin: přidat link z `booking/girls/page.tsx` řádků na detail — ale to je mimo scope tohoto tasku.

### DB schema — `users` tabulka:
```
id, email, password_hash, role, girl_id, display_name, is_active, 
telegram_chat_id, created_at, updated_at
```
- `role = 'girl'` + `girl_id = X` → propojení user účtu s dívkou
- Seed: `emily@lovelygirls.cz / emily123 / role: girl / girl_id: 28`

## Implementační plán

### Krok 1: Server actions pro credentials management

**Soubor:** `lib/admin-actions.ts` — přidat na konec

```typescript
export async function createOrUpdateGirlUser(formData: FormData): Promise<void> {
  await requireAdmin();
  
  const girlId = Number(formData.get('girl_id'));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '').trim();
  
  if (!girlId || !email) throw new Error('Email je povinný');
  
  const bcrypt = await import('bcryptjs');
  
  // Check if user exists for this girl
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE girl_id = ? LIMIT 1',
    args: [girlId],
  });
  
  if (existing.rows.length > 0) {
    // Update existing user
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await db.execute({
        sql: 'UPDATE users SET email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE girl_id = ?',
        args: [email, hash, girlId],
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE girl_id = ?',
        args: [email, girlId],
      });
    }
  } else {
    // Create new user for girl
    if (!password) throw new Error('Heslo je povinné pro nový účet');
    const hash = await bcrypt.hash(password, 12);
    
    // Get girl name for display_name
    const girlRes = await db.execute({
      sql: 'SELECT name FROM girls WHERE id = ? LIMIT 1',
      args: [girlId],
    });
    const displayName = girlRes.rows[0] ? String(girlRes.rows[0].name) : 'Girl';
    
    await db.execute({
      sql: `INSERT INTO users (email, password_hash, role, girl_id, display_name, is_active)
            VALUES (?, ?, 'girl', ?, ?, 1)`,
      args: [email, hash, girlId, displayName],
    });
  }
  
  revalidatePath(`/cs/admin/divky/${girlId}`);
}
```

### Krok 2: Rozšířit admin detail page

**Soubor:** `app/[locale]/(admin)/admin/divky/[id]/page.tsx`

**2a) Přidat importy:**
```typescript
import { createOrUpdateGirlUser } from '@/lib/admin-actions';
```

**2b) Přidat data fetching (za existující photoResult query, cca řádek 35):**

```typescript
// Telegram link status
const telegramResult = await db.execute({
  sql: 'SELECT chat_id, username, linked_at FROM telegram_links WHERE girl_id = ? AND is_active = 1 LIMIT 1',
  args: [Number(id)],
});
const telegramLinked = telegramResult.rows.length > 0;
const telegramUsername = telegramLinked && telegramResult.rows[0].username 
  ? String(telegramResult.rows[0].username) : null;
const telegramLinkedAt = telegramLinked && telegramResult.rows[0].linked_at 
  ? String(telegramResult.rows[0].linked_at) : null;

// Generate deep-link URL
const { generateLinkToken } = await import('@/lib/telegram');
const token = generateLinkToken(Number(id));
const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'studioflow3_bot';
const deepLinkUrl = `https://t.me/${botUsername}?start=GIRL_${token}`;

// Girl user account (login credentials)
const userResult = await db.execute({
  sql: 'SELECT id, email, is_active FROM users WHERE girl_id = ? AND role = \'girl\' LIMIT 1',
  args: [Number(id)],
});
const girlUser = userResult.rows.length > 0 ? {
  id: Number(userResult.rows[0].id),
  email: String(userResult.rows[0].email),
  isActive: Number(userResult.rows[0].is_active) === 1,
} : null;
```

**2c) Přidat dvě nové sekce do JSX** (za existující "Akce" div, před uzavírající `</div>` gridu):

```tsx
{/* Sekce: Telegram */}
<div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
  <div style={{ fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
    Telegram
  </div>
  
  {telegramLinked ? (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '13px' }}>Propojeno</span>
        {telegramUsername && (
          <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>@{telegramUsername}</span>
        )}
      </div>
      {telegramLinkedAt && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
          Od: {new Date(telegramLinkedAt).toLocaleString('cs-CZ')}
        </div>
      )}
    </div>
  ) : (
    <div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
        Nepropojeno
      </div>
      <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-line)', borderRadius: '8px', padding: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
          Aktivacni odkaz (poslete divce):
        </div>
        <code style={{ fontSize: '11px', wordBreak: 'break-all', display: 'block' }}>
          {deepLinkUrl}
        </code>
      </div>
    </div>
  )}
</div>

{/* Sekce: Prihlasovaci udaje */}
<div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
  <div style={{ fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
    Prihlasovaci udaje (Studio)
  </div>
  
  <form action={createOrUpdateGirlUser}>
    <input type="hidden" name="girl_id" value={String(girl.id)} />
    
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '12px', color: 'var(--color-text-dim)', display: 'block', marginBottom: '4px' }}>
        Email
      </label>
      <input
        name="email"
        type="email"
        defaultValue={girlUser?.email ?? ''}
        placeholder="divka@lovelygirls.cz"
        required
        style={{
          width: '100%', padding: '8px 12px', background: 'var(--color-bg-elev)',
          border: '1px solid var(--color-line)', borderRadius: '8px',
          color: 'var(--color-text)', fontSize: '13px', boxSizing: 'border-box',
        }}
      />
    </div>
    
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '12px', color: 'var(--color-text-dim)', display: 'block', marginBottom: '4px' }}>
        {girlUser ? 'Nove heslo (ponechte prazdne pro zachovani)' : 'Heslo *'}
      </label>
      <input
        name="password"
        type="text"
        placeholder={girlUser ? '' : 'Zadejte heslo'}
        style={{
          width: '100%', padding: '8px 12px', background: 'var(--color-bg-elev)',
          border: '1px solid var(--color-line)', borderRadius: '8px',
          color: 'var(--color-text)', fontSize: '13px', boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '4px' }}>
        {girlUser ? 'Vyplnte pouze pokud chcete zmenit heslo' : 'Heslo pro prihlaseni do Studia'}
      </div>
    </div>
    
    <button
      type="submit"
      className="admin-btn-primary"
      style={{ marginTop: '4px' }}
    >
      {girlUser ? 'Ulozit' : 'Vytvorit ucet'}
    </button>
    
    {girlUser && (
      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '8px' }}>
        Ucet aktivni — divka se prihlasi na /studio s timto emailem
      </div>
    )}
  </form>
</div>
```

### Krok 3: Přidat klikací řádky v booking/girls (volitelné rozšíření)

**Soubor:** `app/booking/girls/page.tsx`

Přidat na řádky dívek odkaz na detail:
```tsx
// V .gp-row přidat onClick nebo obalit <a>:
<a href={`/cs/admin/divky/${g.id}`} key={g.id} className="gp-row" style={{ textDecoration: 'none', color: 'inherit' }}>
  ... existing content ...
</a>
```

## Soubory k úpravě

| Soubor | Akce | Priorita |
|--------|------|----------|
| `app/[locale]/(admin)/admin/divky/[id]/page.tsx` | Přidat Telegram + Credentials sekce | HLAVNÍ |
| `lib/admin-actions.ts` | Přidat `createOrUpdateGirlUser()` server action | HLAVNÍ |
| `app/booking/girls/page.tsx` | Přidat klikací řádky na detail (volitelné) | NÍZKÁ |

## Poznámky pro implementátora

1. **Telegram sekce** je totožná s plánem v TASK-015 — pokud už implementátor přidal Telegram do page.tsx, stačí jen doplnit credentials sekci
2. **bcryptjs** import — dynamický (`await import('bcryptjs')`) kvůli server action kontextu
3. **Password type="text"** — záměrně, admin vidí heslo které nastavuje dívce (pošle jí ho)
4. **Revalidace** — po uložení credentials se revaliduje stránka detailu
5. **users.girl_id** propojuje user account s dívkou — 1:1 vztah
6. **Existující pattern**: seed script vytváří `emily@lovelygirls.cz / role: girl / girl_id: 28` — server action následuje stejný pattern

## Závislosti
- **Task #15** (deep-link handler v telegram-bot.ts) by měl být implementován PŘED tímto — jinak deep-link URL bude nefunkční
- Telegram sekce v tomto tasku je UI-only (zobrazení stavu + URL). Handler je v task #15.
