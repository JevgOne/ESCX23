import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminGirlVidea({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const name = String(girl.name ?? '');
  const gId = Number(girl.id);

  return (
    <>
      <AdminTopbar title={`Videa: ${name}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/cs/admin/divky/${gId}/edit`} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
          ← Zpět na edit
        </a>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        padding: '32px 24px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
          Správa videí — připravujeme
        </div>
        <div style={{ fontSize: '13px' }}>
          Video upload bude dostupný v příštím sprintu.
        </div>
      </div>
    </>
  );
}
