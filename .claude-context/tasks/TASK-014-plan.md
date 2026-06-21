# TASK-014: Zabezpečení auth — Session expirace & častější přihlášení

## Problém od uživatele
> "Na jednom a tom samém PC jsem neustále přihlášený, musí to vyžadovat častěji heslo"

## Aktuální stav auth systému

### Session mechanismus (`lib/auth.ts`)

```
Cookie: escx23_session
Token: base64url( userId.role.expTimestamp.hmacSignature )
Max age: 30 dní (SESSION_MAX_AGE_DAYS = 30)
```

**Klíčové vlastnosti:**
- **Fixed expiration** — session vyprší přesně 30 dní po vytvoření
- **Žádný sliding window** — čas se neobnovuje při aktivitě
- **Žádný idle timeout** — session je platná i po dnech neaktivity
- **Cookie maxAge: 30 dní** — browser cookie přežije zavření prohlížeče
- **Žádný server-side session store** — token je self-contained (JWT-like)
- **Žádná session revocation** — nelze invalidovat session ze serveru (kromě změny SESSION_SECRET)
- **Žádný concurrent session limit** — uživatel může mít neomezený počet platných tokenů

### Proč je uživatel "neustále přihlášený"
1. Session cookie má `maxAge: 30 * 24 * 60 * 60` = 2,592,000 sekund
2. Token expiruje za 30 dní od vytvoření
3. Žádný idle timeout — i když uživatel nepoužívá admin 2 týdny, session je stále platná
4. Cookie přežije zavření prohlížeče (není session cookie — má explicitní maxAge)

---

## Navrhované změny

### Změna 1: Snížit session maxAge

**Soubor:** `lib/auth.ts`

Aktuálně:
```ts
const SESSION_MAX_AGE_DAYS = 30;
```

Navrhovaná hodnota:
```ts
const SESSION_MAX_AGE_HOURS = {
  admin: 8,     // admin: 8 hodin (pracovní směna)
  manager: 8,   // manager: 8 hodin
  girl: 72,     // studio: 3 dny (dívky se přihlašují méně často)
};
```

**Implementace:**
- `setSession(userId, role)` — nastaví `maxAge` podle role
- `createToken(userId, role)` — nastaví expiration podle role
- Cookie: `maxAge: SESSION_MAX_AGE_HOURS[role] * 3600`

### Změna 2: Idle timeout (volitelné, složitější)

Pro admin panel implementovat "last activity" tracking:

**Přístup A — server-side (doporučeno):**
- Přidat `lastActive` timestamp do tokenu
- V `getCurrentUser()` zkontrolovat: pokud `lastActive` > 2 hodiny → session neplatná
- V `setSession()` obnovovat `lastActive` při každém requestu
- **Problém:** self-contained token se nedá aktualizovat bez re-set cookie při každém requestu

**Přístup B — middleware (jednodušší):**
- V middleware.ts: při každém requestu na `/admin/*` zkontrolovat token a pokud je starší než X hodin, redirect na login
- Nepotřebuje měnit token format

**Doporučení:** Přístup B je jednodušší. Middleware zkontroluje token expiration a redirect na login pokud je starý. Toto se ale dá dosáhnout i jen snížením maxAge (Změna 1).

### Změna 3: "Remember me" checkbox (volitelné)

Na login formuláři přidat checkbox:
- **Zaškrtnuto:** session 7 dní (cookie s maxAge)
- **Nezaškrtnuto:** session cookie (browser zavře = session pryč, `maxAge` se nenastavuje)

**Implementace:**
- `loginAdmin` Server Action přečte `formData.get('remember')`
- Předá do `setSession(userId, role, remember)`
- `setSession` nastaví `maxAge` jen pokud `remember === true`
- Bez `maxAge` → browser session cookie → zavření = odhlášení

### Změna 4: Session invalidation při změně hesla (low priority)

- Při změně hesla v admin panelu invalidovat všechny existující sessions
- Realizace: přidat `password_changed_at` timestamp do users tabulky
- V `verifyToken()` porovnat: pokud token byl vytvořen před `password_changed_at` → neplatný

---

## Doporučená implementace (minimální scope)

Pro vyřešení problému uživatele stačí **Změna 1 + Změna 3**:

### Krok 1: Upravit `lib/auth.ts`

```ts
// Řádek 15: změnit maxAge
const SESSION_MAX_AGE_SECONDS = {
  admin: 8 * 60 * 60,      // 8 hodin
  manager: 8 * 60 * 60,    // 8 hodin
  girl: 72 * 60 * 60,      // 72 hodin (3 dny)
};

// setSession: přidat parameter remember
export async function setSession(userId: number, role: string, remember = false) {
  const maxAge = remember
    ? 7 * 24 * 60 * 60  // 7 dní pokud "remember me"
    : SESSION_MAX_AGE_SECONDS[role as keyof typeof SESSION_MAX_AGE_SECONDS] ?? 8 * 60 * 60;

  const token = createToken(userId, role, maxAge);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge } : {}),  // bez maxAge = session cookie
  });
}

// createToken: přijmout maxAge místo pevného SESSION_MAX_AGE_DAYS
function createToken(userId: number, role: string, maxAgeSeconds: number): string {
  const exp = Date.now() + maxAgeSeconds * 1000;
  // ... zbytek stejný
}
```

### Krok 2: Upravit `lib/auth-actions.ts`

```ts
export async function loginAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const locale = await getLocale();

  const user = await authenticate(email, password);
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect(`/${locale}/admin/login?error=invalid`);
  }

  await setSession(user.id, user.role, remember);
  redirect(`/${locale}/admin`);
}
```

Analogicky pro `loginGirl`.

### Krok 3: Přidat "Remember me" do login formuláře

**Soubor:** `app/[locale]/(admin)/admin/login/page.tsx`

Přidat pod heslo pole:
```tsx
<label className="escx-login-remember">
  <input type="checkbox" name="remember" />
  <span>Zapamatovat si mě (7 dní)</span>
</label>
```

CSS (v LOGIN_STYLES):
```css
.escx-login-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}
.escx-login-remember input[type="checkbox"] {
  accent-color: var(--color-coral, #f27d8d);
  width: 16px;
  height: 16px;
}
```

Analogicky pro studio login.

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `lib/auth.ts` | Snížit maxAge podle role, přidat `remember` param |
| `lib/auth-actions.ts` | Předat `remember` z formData do `setSession` |
| `app/[locale]/(admin)/admin/login/page.tsx` | Přidat "remember me" checkbox |
| `app/[locale]/studio/login/page.tsx` | Přidat "remember me" checkbox |

**Celkem: 4 soubory, ~30 řádků změn.**

## CSRF ochrana

CSRF je řešena automaticky Next.js Server Actions (Origin check). Viz TASK-010 — potřeba přidat `allowedOrigins` pro custom doménu.
