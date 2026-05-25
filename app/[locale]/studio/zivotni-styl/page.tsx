import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { updateGirlLifestyle } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// TODO: smoker, drinks, orientation, education, profession columns not in girls schema yet

export default async function StudioZivotniStylPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { saved } = await searchParams;
  const user = await requireGirl();
  const girl = await getGirlById(user.girl_id!);

  const nationality = girl?.nationality ? String(girl.nationality) : '';

  return (
    <>
      <StudioTopbar title="Životní styl" />

      {saved === '1' && (
        <div className="studio-saved-banner">Uloženo!</div>
      )}

      <div className="studio-form-wrap">
        <form action={updateGirlLifestyle} className="admin-form">
          <fieldset>
            <legend>Původ</legend>
            <div className="admin-form-field" style={{ maxWidth: '280px' }}>
              <label htmlFor="nationality">Národnost</label>
              <input id="nationality" name="nationality" type="text" defaultValue={nationality} placeholder="např. Česká" />
            </div>
          </fieldset>

          <fieldset>
            <legend>Ostatní (připravujeme)</legend>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '8px 0' }}>
              Vzdělání, kouření, alkohol, orientace — tyto volby budou dostupné v další verzi Studia.
            </p>
          </fieldset>

          <div className="admin-submit-row">
            <button type="submit" className="admin-btn-submit">Uložit</button>
            <a href={`/${locale}/studio`} className="admin-btn-secondary">Zpět</a>
          </div>
        </form>
      </div>
    </>
  );
}
