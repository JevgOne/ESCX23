import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Hourly cron — auto-publish blog drafts whose published_at has passed.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await db.execute({
    sql: `UPDATE blog_posts
          SET status = 'published', updated_at = CURRENT_TIMESTAMP
          WHERE status = 'draft'
            AND published_at IS NOT NULL
            AND published_at <= datetime('now')`,
    args: [],
  });

  if (result.rowsAffected > 0) {
    revalidatePath('/cs/blog');
    revalidatePath('/en/blog');
    revalidatePath('/de/blog');
    revalidatePath('/uk/blog');
  }

  return NextResponse.json({
    success: true,
    published: result.rowsAffected,
  });
}
