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

Stránka zobrazuje "sifrovano" pro VŠECHNY uživatele (admin i operátor). Admin musí vidět dešifrovaný telefon.

### Co máme k dispozici
1. **`decrypt()`** v `lib/crypto.ts` (řádek 69) — AES-256-GCM dešifrování, formát `iv:tag:ciphertext`
2. **`getCurrentUser()`** v `lib/auth.ts` (řádek 111) — vrací `AuthUser` s `role`
3. **`auditClientDecrypt()`** v `lib/audit.ts` (řádek 85) — audit log pro PII přístup
4. **Auth layout** — `/booking/layout.tsx` volá `requireBooking()` (řádek 108), ale page.tsx nemá přístup k user objektu
5. **`BOOKING_ENCRYPTION_KEY`** env var — klíč pro decrypt (v `.env.local` řádek 13)

### Bezpečnostní kontext
- Stránka je Server Component (`force-dynamic`)
- Layout zajišťuje auth přes `requireBooking()` — povoleno pro `admin` + `operator`
- **Admin** MUSÍ vidět dešifrovaný telefon + email
- **Operator** by MĚL také vidět (potřebuje volat klientům) — ALE task říká pouze admin
- Decrypt se musí auditovat (compliance requirement)

## Plán implementace

### Přístup A: Server-side decrypt přímo v page.tsx (DOPORUČENO)
Nejjednodušší a nejbezpečnější — telefon se nikdy neposílá jako ciphertext do browseru.

#### Krok 1: V page.tsx přidat import + getCurrentUser
```typescript
import { getCurrentUser } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import { auditClientDecrypt } from '@/lib/audit';
```

#### Krok 2: V `ClientDetailPage` funkci přidat user check + decrypt
Po `const client = ...` přidat:
```typescript
const user = await getCurrentUser();
const isAdmin = user?.role === 'admin';

// Decrypt PII for admin
let phone: string | null = null;
let email: string | null = null;

if (isAdmin && client.phoneEncrypted) {
  try {
    phone = decrypt(client.phoneEncrypted);
    auditClientDecrypt(user!.id, client.id, 'phone').catch(() => {});
  } catch {
    phone = null; // decrypt failed — show fallback
  }
}

if (isAdmin && client.emailEncrypted) {
  try {
    email = decrypt(client.emailEncrypted);
    auditClientDecrypt(user!.id, client.id, 'email').catch(() => {});
  } catch {
    email = null;
  }
}
```

#### Krok 3: Upravit JSX pro telefon (řádky 138-143)
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

#### Krok 4: Stejně upravit email (řádky 165-170)
```tsx
<span className="cd-info-value">
  {email ? (
    <a href={`mailto:${email}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>
      {email}
    </a>
  ) : client.emailEncrypted ? (
    <span className="cd-encrypted">sifrovano</span>
  ) : (
    <span className="cd-dim">--</span>
  )}
</span>
```

#### Krok 5: Volitelně dešifrovat jméno + příjmení
Pokud `nameEncrypted` a `surnameEncrypted` existují, zobrazit je pro admina vedle nicknamu. Ale task explicitně zmiňuje jen telefon — minimální scope.

### Soubory k editaci
1. **`app/booking/clients/[id]/page.tsx`** — přidat decrypt logiku + upravit JSX (hlavní změna)

### Env vars potřebné
- `BOOKING_ENCRYPTION_KEY` — musí být nastavený (je v `.env.local`)
- Pozor: v `.env.prod-pulled.local` má trailing `\n`! (`"...5d27\n"`) — to by mohlo rozbít decrypt na produkci

### VAROVÁNÍ: Trailing `\n` v encryption key
V `.env.prod-pulled.local` řádek 4:
```
BOOKING_ENCRYPTION_KEY="84e5a282858084a74db9403f16833faf29462636c51266cb6e167c4c01ec5d27\n"
```
Ten `\n` na konci by mohl způsobit, že `resolveKey()` v crypto.ts selže (hex string bude 66 znaků místo 64). Ale `.env.local` (řádek 13) je bez `\n` — záleží na tom, který env file se používá na produkci.

**Implementátor by měl ověřit**, že Vercel production env `BOOKING_ENCRYPTION_KEY` NEMÁ trailing newline.

### Bezpečnostní opatření
1. Decrypt probíhá POUZE server-side (Server Component)
2. Audit log zaznamenává KDO a KDY dekryptoval (compliance)
3. Plaintext telefon se nikdy neukládá do DB — jen se dekryptuje za letu
4. Operátor vidí pouze "sifrovano" (pokud task chce jen admin)
