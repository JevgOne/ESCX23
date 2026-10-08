import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { logoutAction } from '@/lib/auth-actions';

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

  return (
    <>
      <AdminTopbar title={`Fotky — ${String(girl.name)}`} />
      <p style={{ color: 'var(--color-text-dim)' }}>Test C: import z auth-actions (logoutAction)</p>
      <form action={logoutAction}>
        <button type="submit" className="admin-btn-secondary">Logout test (auth-actions)</button>
      </form>
    </>
  );
}
