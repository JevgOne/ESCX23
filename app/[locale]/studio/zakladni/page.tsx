import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioZakladniPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girl = await getGirlById(user.girl_id!);

  const g = {
    name: girl ? String(girl.name ?? '') : '',
    age: girl ? Number(girl.age ?? 18) : 18,
    bio: girl?.bio ? String(girl.bio) : '—',
  };

  return (
    <>
      <StudioTopbar title="Základní info" />

      <div className="studio-content">
        <div className="studio-readonly-note">
          Tyto údaje spravuje agentura. Pokud potřebuješ změnu, kontaktuj management.
        </div>

        <div className="studio-readonly-card">
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Jméno</span>
            <span className="studio-readonly-value">{g.name}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Věk</span>
            <span className="studio-readonly-value">{g.age} let</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Bio</span>
            <span className="studio-readonly-value">{g.bio}</span>
          </div>
        </div>
      </div>
    </>
  );
}
