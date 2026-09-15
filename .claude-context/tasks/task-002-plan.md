# TASK #2: Phone decryption pro admin — klientská karta

## Status: PLÁN HOTOVÝ — čeká na implementaci

## Analýza problému

### Aktuální stav
Soubor `app/booking/clients/[id]/page.tsx`, řádky 138-143:
```tsx
{client.phoneEncrypted ? (
  <span className="cd-encrypted">sifrovano</span>
) : (
  <span className="cd-dim">--</span>
)}
```

Stránka zobrazuje "sifrovano" pro VŠECHNY uživatele (admin i operátor). Admin MUSÍ vidět dešifrovaný telefon.

### Co máme k dispozici
1. **`decrypt()`** v `lib/crypto.ts` (řádek 69) — AES-256-GCM dešifrování, formát `iv:tag:ciphertext`
2. **`getCurrentUser()`** v `lib/auth.ts` (řádek 111) — vrací `AuthUser` s `role` (`admin | manager | operator | girl`)
3. **`auditClientDecrypt()`** v `lib/audit.ts` (řádek 85) — audit log pro PII přístup
4. **Auth layout** — `/booking/layout.tsx` řádek 108 volá `requireBooking()` (povoleno pro `admin` + `operator`)
5. **`BOOKING_ENCRYPTION_KEY`** env var — klíč pro decrypt

### Bezpečnostní kontext
- Stránka je Server Component (`export const dynamic = 'force-dynamic'`)
- Plaintext telefon nikdy nejde do client-side JS — čistě server-side render
- Decrypt se musí auditovat (compliance — kdo co viděl)

## Plán implementace

### Krok 1: Přidat importy do page.tsx
Na začátek souboru (za existující importy):
```typescript
import { getCurrentUser } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import { auditClientDecrypt } from '@/lib/audit';
```

### Krok 2: Přidat decrypt logiku do ClientDetailPage funkce
Po řádku 69 (`if (!client) notFound();`), přidat:

```typescript
// Decrypt PII for admin
const user = await getCurrentUser();
const isAdmin = user?.role === 'admin';

let phone: string | null = null;
let email: string | null = null;
let fullName: string | null = null;

if (isAdmin) {
  if (client.phoneEncrypted) {
    try {
      phone = decrypt(client.phoneEncrypted);
      auditClientDecrypt(user!.id, client.id, 'phone').catch(() => {});
    } catch {
      phone = null;
    }
  }
  if (client.emailEncrypted) {
    try {
      email = decrypt(client.emailEncrypted);
      auditClientDecrypt(user!.id, client.id, 'email').catch(() => {});
    } catch {
      email = null;
    }
  }
  if (client.nameEncrypted || client.surnameEncrypted) {
    try {
      const name = client.nameEncrypted ? decrypt(client.nameEncrypted) : '';
      const surname = client.surnameEncrypted ? decrypt(client.surnameEncrypted) : '';
      fullName = [name, surname].filter(Boolean).join(' ') || null;
      if (fullName) auditClientDecrypt(user!.id, client.id, 'name').catch(() => {});
    } catch {
      fullName = null;
    }
  }
}
```

### Krok 3: Upravit JSX — telefon (řádky 138-143)
Nahradit:
```tsx
<span className="cd-info-value">
  {client.phoneEncrypted ? (
    <span className="cd-encrypted">sifrovano</span>
  ) : (
    <span className="cd-dim">--</span>
  )}
</span>
```

Za:
```tsx
<span className="cd-info-value">
  {phone ? (
    <a href={`tel:${phone}`} style={{ color: 'var(--coral)', textDecoration: 'none', fontWeight: 700 }}>
      {phone}
    </a>
  ) : client.phoneEncrypted ? (
    <span className="cd-encrypted">sifrovano</span>
  ) : (
    <span className="cd-dim">--</span>
  )}
</span>
```

### Krok 4: Upravit JSX — email (řádky 165-170)
Nahradit:
```tsx
<span className="cd-info-value">
  {client.emailEncrypted ? (
    <span className="cd-encrypted">sifrovano</span>
  ) : (
    <span className="cd-dim">--</span>
  )}
</span>
```

Za:
```tsx
<span className="cd-info-value">
  {email ? (
    <a href={`mailto:${email}`} style={{ color: '#229ED9', textDecoration: 'none' }}>
      {email}
    </a>
  ) : client.emailEncrypted ? (
    <span className="cd-encrypted">sifrovano</span>
  ) : (
    <span className="cd-dim">--</span>
  )}
</span>
```

### Krok 5: Volitelně — zobrazit fullName pro admina
V header sekci (řádek ~89), pod nickname přidat:
```tsx
{fullName && (
  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
    {fullName}
  </div>
)}
```

## Soubory k editaci
1. **`app/booking/clients/[id]/page.tsx`** — jediný soubor, přidat decrypt logiku + upravit JSX

## VAROVÁNÍ: Trailing `\n` v encryption key
V `.env.prod-pulled.local` řádek 4:
```
BOOKING_ENCRYPTION_KEY="84e5a282...5d27\n"
```
Ten `\n` na konci by způsobil selhání `resolveKey()` v crypto.ts (66 hex chars místo 64).
V `.env.local` (řádek 13) je klíč BEZ `\n` — to je správně.
**Implementátor musí ověřit**, že Vercel production env `BOOKING_ENCRYPTION_KEY` NEMÁ trailing newline.

## Bezpečnostní opatření
1. Decrypt POUZE server-side (Server Component, `force-dynamic`)
2. Audit log zaznamenává KDO a KDY dekryptoval (compliance)
3. Plaintext se nikdy neukládá do DB — dekryptuje se za letu per-request
4. Operátor vidí pouze "sifrovano" — nemá decrypt oprávnění
5. `try/catch` kolem každého decrypt — pokud selže, fallback na "sifrovano"
