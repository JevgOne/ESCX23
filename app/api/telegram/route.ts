import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate } from '@/lib/telegram-bot';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Telegram webhook secret (mandatory in production)
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[telegram] TELEGRAM_WEBHOOK_SECRET not configured');
    return new NextResponse('Server misconfigured', { status: 500 });
  }
  const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
  if (headerSecret !== webhookSecret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const update = await request.json();
    await handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram] Error processing update:', error);
    return NextResponse.json({ ok: true });
  }
}
