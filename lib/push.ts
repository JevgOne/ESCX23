// @ts-expect-error — web-push has no type declarations
import webPush from 'web-push';
import { db } from './db';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(
    'mailto:info@lovelygirls.cz',
    VAPID_PUBLIC,
    VAPID_PRIVATE,
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  const subs = await db.execute({
    sql: 'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    args: [userId],
  });

  for (const sub of subs.rows) {
    try {
      await webPush.sendNotification(
        {
          endpoint: String(sub.endpoint),
          keys: {
            p256dh: String(sub.p256dh),
            auth: String(sub.auth),
          },
        },
        JSON.stringify(payload),
      );
    } catch (err: unknown) {
      // 410 Gone = subscription expired, remove it
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        await db.execute({
          sql: 'DELETE FROM push_subscriptions WHERE id = ?',
          args: [Number(sub.id)],
        });
      }
    }
  }
}

export async function sendPushToGirl(girlId: number, payload: PushPayload) {
  const user = await db.execute({
    sql: "SELECT id FROM users WHERE girl_id = ? AND role = 'girl' LIMIT 1",
    args: [girlId],
  });
  if (user.rows.length === 0) return;
  await sendPushToUser(Number(user.rows[0].id), payload);
}
