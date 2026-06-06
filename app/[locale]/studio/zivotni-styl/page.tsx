import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioZivotniStylPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girl = await getGirlById(user.girl_id!);

  const nationality = girl?.nationality ? String(girl.nationality) : '—';

  return (
    <>
      <StudioTopbar title="Životní styl" />

      <div className="studio-content">
        <div className="studio-readonly-note">
          Tyto údaje spravuje agentura. Pokud potřebuješ změnu, kontaktuj management.
        </div>

        <div className="studio-readonly-card">
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Národnost</span>
            <span className="studio-readonly-value">{nationality}</span>
          </div>
        </div>
      </div>
    </>
  );
}
