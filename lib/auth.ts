import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';

async function getLocale(): Promise<string> {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const match = pathname.match(/^\/(cs|en|de|uk)\//);
  return match ? match[1] : 'cs';
}

const SESSION_COOKIE = 'escx23_session';
const SESSION_MAX_AGE_DAYS = 30;

export interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'manager' | 'girl';
  girl_id: number | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const SECRET = process.env.SESSION_SECRET ?? (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[AUTH] SESSION_SECRET is not set! Sessions will break on restart. Set it in Vercel env vars.');
  }
  return 'dev-secret-change-in-prod-' + Math.random().toString(36);
})();

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

function createToken(userId: number, role: string): string {
  const exp = Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${role}.${exp}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 4) return null;
    const [userId, role, exp, sig] = parts;
    if (sign(`${userId}.${role}.${exp}`) !== sig) return null;
    if (Number(exp) < Date.now()) return null;
    return { userId: Number(userId), role };
  } catch {
    return null;
  }
}

export async function setSession(userId: number, role: string) {
  const token = createToken(userId, role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const verified = verifyToken(token);
  if (!verified) return null;

  const result = await db.execute({
    sql: 'SELECT id, email, role, girl_id FROM users WHERE id = ? LIMIT 1',
    args: [verified.userId],
  });
  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: Number(row.id),
    email: String(row.email),
    role: row.role as 'admin' | 'manager' | 'girl',
    girl_id: row.girl_id != null ? Number(row.girl_id) : null,
  };
}

export async function authenticate(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const result = await db.execute({
    sql: 'SELECT id, email, password_hash, role, girl_id FROM users WHERE email = ? LIMIT 1',
    args: [email.trim().toLowerCase()],
  });
  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  const ok = await verifyPassword(password, String(row.password_hash));
  if (!ok) return null;

  return {
    id: Number(row.id),
    email: String(row.email),
    role: row.role as 'admin' | 'manager' | 'girl',
    girl_id: row.girl_id != null ? Number(row.girl_id) : null,
  };
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    const locale = await getLocale();
    redirect(`/${locale}/admin/login`);
  }
  return user;
}

/**
 * Use on admin pages that managers must NOT access (e.g. CMS, pricing, settings).
 * Redirects manager to dashboard so they don't see admin-only data.
 */
export async function requireFullAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    const locale = await getLocale();
    if (user?.role === 'manager') {
      redirect(`/${locale}/admin`);
    }
    redirect(`/${locale}/admin/login`);
  }
  return user;
}

export async function requireGirl(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'girl') {
    const locale = await getLocale();
    redirect(`/${locale}/studio/login`);
  }
  return user;
}
