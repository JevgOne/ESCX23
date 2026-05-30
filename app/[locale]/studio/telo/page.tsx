import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioTeloPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girl = await getGirlById(user.girl_id!);

  const g = {
    height: girl?.height != null ? `${girl.height} cm` : '—',
    weight: girl?.weight != null ? `${girl.weight} kg` : '—',
    bust: girl?.bust ? String(girl.bust) : '—',
    eyes: girl?.eyes ? String(girl.eyes) : '—',
    hair: girl?.hair ? String(girl.hair) : '—',
    tattoo: Number(girl?.tattoo_percentage ?? 0) > 0 ? 'Ano' : 'Ne',
    tattooDesc: girl?.tattoo_description ? String(girl.tattoo_description) : null,
    piercing: Boolean(girl?.piercing) ? 'Ano' : 'Ne',
  };

  return (
    <>
      <StudioTopbar title="Tělo" />

      <div className="studio-content">
        <div className="studio-readonly-note">
          Tyto údaje spravuje agentura. Pokud potřebuješ změnu, kontaktuj management.
        </div>

        <div className="studio-readonly-card">
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Výška</span>
            <span className="studio-readonly-value">{g.height}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Váha</span>
            <span className="studio-readonly-value">{g.weight}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Prsa</span>
            <span className="studio-readonly-value">{g.bust}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Oči</span>
            <span className="studio-readonly-value">{g.eyes}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Vlasy</span>
            <span className="studio-readonly-value">{g.hair}</span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Tetování</span>
            <span className="studio-readonly-value">
              {g.tattoo}{g.tattooDesc ? ` — ${g.tattooDesc}` : ''}
            </span>
          </div>
          <div className="studio-readonly-row">
            <span className="studio-readonly-label">Piercing</span>
            <span className="studio-readonly-value">{g.piercing}</span>
          </div>
        </div>
      </div>
    </>
  );
}
