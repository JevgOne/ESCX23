import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate } from '@/lib/telegram-bot';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Telegram webhook secret if configured
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (headerSecret !== webhookSecret) {
      console.error('[telegram] Secret mismatch:', { expected: webhookSecret?.slice(0, 8), got: headerSecret?.slice(0, 8) });
      return new NextResponse('Unauthorized', { status: 401 });
    }
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
