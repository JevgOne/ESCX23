import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUserLinkToken } from '@/lib/telegram';
import StudioSettingsClient from './client';

export const dynamic = 'force-dynamic';

export default async function StudioSettingsPage() {
  const user = await requireGirl();

  // Generate Telegram link token
  const linkToken = generateUserLinkToken(user.id);
  const telegramLink = `https://t.me/lovelygirls_studio_bot?start=userlink_${user.id}_${linkToken}`;

  // Check if Telegram is already linked
  const tgResult = await db.execute({
    sql: 'SELECT telegram_chat_id FROM users WHERE id = ?',
    args: [user.id],
  });
  const hasTelegram = !!tgResult.rows[0]?.telegram_chat_id;

  return (
    <StudioSettingsClient
      telegramLink={telegramLink}
      hasTelegram={hasTelegram}
    />
  );
}
