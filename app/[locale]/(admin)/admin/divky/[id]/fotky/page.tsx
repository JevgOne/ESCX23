import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function testAction() {
  'use server';
  console.log('test action called');
}

export default async function AdminGirlFotkyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  let photoCount = 0;
  try {
    const result = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM girl_photos WHERE girl_id = ?`,
      args: [Number(id)],
    });
    photoCount = Number(result.rows[0]?.cnt ?? 0);
  } catch (e) {
    console.error('[fotky] DB error:', e);
  }

  return (
    <>
      <AdminTopbar title={`Fotky — ${String(girl.name)}`} />
      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/divky/${id}`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na detail dívky
        </a>
      </div>
      {sp.error && <p style={{ color: '#f87171' }}>Error: {sp.error}</p>}
      <p style={{ color: 'var(--color-text-dim)' }}>{photoCount} fotek v DB</p>
      <form action={testAction}>
        <button type="submit" className="admin-btn-primary" style={{ marginTop: '12px' }}>
          Test action
        </button>
      </form>
    </>
  );
}
