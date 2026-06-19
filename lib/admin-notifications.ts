'use server';

import { db } from './db';
import { revalidatePath } from 'next/cache';

export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
  created_at: string;
}

export async function createAdminNotification(
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  await db.execute({
    sql: `INSERT INTO admin_notifications (type, title, message, link) VALUES (?, ?, ?, ?)`,
    args: [type, title, message, link ?? null],
  });
}

export async function getAdminNotifications(limit = 50): Promise<AdminNotification[]> {
  const result = await db.execute({
    sql: `SELECT id, type, title, message, link, read, created_at FROM admin_notifications ORDER BY created_at DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows.map((r) => ({
    id: Number(r.id),
    type: String(r.type),
    title: String(r.title),
    message: String(r.message),
    link: r.link ? String(r.link) : null,
    read: Number(r.read),
    created_at: String(r.created_at),
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await db.execute(`SELECT COUNT(*) AS cnt FROM admin_notifications WHERE read = 0`);
  return Number(result.rows[0]?.cnt ?? 0);
}

export async function markNotificationRead(id: number) {
  await db.execute({
    sql: `UPDATE admin_notifications SET read = 1 WHERE id = ?`,
    args: [id],
  });
  revalidatePath('/cs/admin/notifikace');
}

export async function markAllNotificationsRead() {
  await db.execute(`UPDATE admin_notifications SET read = 1 WHERE read = 0`);
  revalidatePath('/cs/admin/notifikace');
}
