'use server';

import { db } from './db';
import { requireBookingAdmin, hashPassword } from './auth';

// ---------------------------------------------------------------------------
// Update user profile (role, display name, telegram, active status)
// ---------------------------------------------------------------------------

const VALID_ROLES = ['admin', 'manager', 'operator'];

export async function updateUser(
  userId: number,
  data: {
    role?: string;
    displayName?: string;
    telegramChatId?: string;
    isActive?: boolean;
  },
): Promise<{ ok: true } | { error: string }> {
  const currentUser = await requireBookingAdmin();

  // Cannot change your own role (prevents self-promotion to admin)
  if (currentUser.id === userId && data.role !== undefined) {
    return { error: 'Nemuzes zmenit svoji vlastni roli.' };
  }

  // Cannot deactivate yourself
  if (currentUser.id === userId && data.isActive === false) {
    return { error: 'Nemuzes deaktivovat svuj vlastni ucet.' };
  }

  if (data.role && !VALID_ROLES.includes(data.role)) {
    return { error: 'Neplatna role.' };
  }

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (data.role !== undefined) {
    updates.push('role = ?');
    args.push(data.role);
  }
  if (data.displayName !== undefined) {
    updates.push('display_name = ?');
    args.push(data.displayName || null);
  }
  if (data.telegramChatId !== undefined) {
    updates.push('telegram_chat_id = ?');
    args.push(data.telegramChatId || null);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    args.push(data.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return { error: 'Zadna zmena.' };
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  args.push(userId);

  await db.execute({
    sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Create new user
// ---------------------------------------------------------------------------

export async function createUser(data: {
  email: string;
  password: string;
  role: string;
  displayName?: string;
}): Promise<{ ok: true; userId: number } | { error: string }> {
  await requireBookingAdmin();

  if (!data.email || !data.password || !data.role) {
    return { error: 'Vyplnte email, heslo a roli.' };
  }

  if (!VALID_ROLES.includes(data.role)) {
    return { error: 'Neplatna role.' };
  }

  if (data.password.length < 6) {
    return { error: 'Heslo musi mit alespon 6 znaku.' };
  }

  // Check duplicate email
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
    args: [data.email.trim().toLowerCase()],
  });
  if (existing.rows.length > 0) {
    return { error: 'Uzivatel s timto emailem jiz existuje.' };
  }

  const passwordHash = await hashPassword(data.password);

  const result = await db.execute({
    sql: `INSERT INTO users (email, password_hash, role, display_name, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [data.email.trim().toLowerCase(), passwordHash, data.role, data.displayName || null],
  });

  return { ok: true, userId: Number(result.lastInsertRowid) };
}
