import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { updateGirlBasic } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioZakladniPage({
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

  const g = {
    name: girl ? String(girl.name ?? '') : '',
    age: girl ? Number(girl.age ?? 18) : 18,
    bio: girl?.bio ? String(girl.bio) : '',
  };

  return (
    <>
      <StudioTopbar title="Základní info" />

      {saved === '1' && (
        <div className="studio-saved-banner">Uloženo!</div>
      )}

      <div className="studio-form-wrap">
        <form action={updateGirlBasic} className="admin-form">
          <fieldset>
            <legend>Identita</legend>
            <div className="admin-form-field">
              <label htmlFor="name">Jméno (zobrazované)</label>
              <input id="name" name="name" type="text" defaultValue={g.name} required />
            </div>
            <div className="admin-form-field" style={{ maxWidth: '160px' }}>
              <label htmlFor="age">Věk</label>
              <input id="age" name="age" type="number" defaultValue={g.age} min={18} max={99} required />
            </div>
          </fieldset>

          <fieldset>
            <legend>Bio</legend>
            <div className="admin-form-field">
              <label htmlFor="bio">Bio (max 500 znaků)</label>
              <textarea id="bio" name="bio" rows={6} maxLength={500} defaultValue={g.bio} />
            </div>
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
