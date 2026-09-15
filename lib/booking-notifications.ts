import { db } from './db';

export async function createBookingNotification(data: {
  type: string;
  title: string;
  message: string;
  bookingId?: number;
  link?: string;
}): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO booking_notifications (type, title, message, booking_id, link)
            VALUES (?, ?, ?, ?, ?)`,
      args: [data.type, data.title, data.message, data.bookingId ?? null, data.link ?? null],
    });
  } catch (error) {
    console.error('[booking-notifications] Failed to create:', error);
  }
}

export async function getUnreadCount(): Promise<number> {
  const result = await db.execute(
    'SELECT COUNT(*) as cnt FROM booking_notifications WHERE is_read = 0'
  );
  return Number(result.rows[0]?.cnt ?? 0);
}

export interface BookingNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  bookingId: number | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(limit = 50): Promise<BookingNotification[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM booking_notifications ORDER BY created_at DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((r) => ({
    id: Number(r.id),
    type: String(r.type),
    title: String(r.title),
    message: String(r.message),
    bookingId: r.booking_id ? Number(r.booking_id) : null,
    link: r.link ? String(r.link) : null,
    isRead: Number(r.is_read) === 1,
    createdAt: String(r.created_at),
  }));
}

export async function markAllRead(): Promise<void> {
  await db.execute('UPDATE booking_notifications SET is_read = 1 WHERE is_read = 0');
}
