import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate } from '@/lib/telegram-bot';

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (WEBHOOK_SECRET) {
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== WEBHOOK_SECRET) {
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
