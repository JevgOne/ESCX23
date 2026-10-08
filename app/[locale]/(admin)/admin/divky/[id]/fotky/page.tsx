import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminGirlFotkyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
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
  } catch {}

  async function testAction() {
    'use server';
    console.log('inline action works');
  }

  return (
    <>
      <AdminTopbar title={`Fotky — ${String(girl.name)}`} />
      <p style={{ color: 'var(--color-text-dim)' }}>{photoCount} fotek — test verze B (inline action, no searchParams)</p>
      <form action={testAction}>
        <button type="submit" className="admin-btn-primary">Test</button>
      </form>
    </>
  );
}
