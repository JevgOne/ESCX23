import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { updateGirlBody } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EYES_OPTIONS = ['Hnědé', 'Modré', 'Zelené', 'Šedé', 'Lískové', 'Černé'];
const HAIR_OPTIONS = ['Hnědé', 'Blond', 'Černé', 'Červené', 'Rusé', 'Šedé'];

export default async function StudioTeloPage({
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
    height: girl?.height != null ? Number(girl.height) : '',
    weight: girl?.weight != null ? Number(girl.weight) : '',
    bust: girl?.bust ? String(girl.bust) : '',
    eyes: girl?.eyes ? String(girl.eyes) : '',
    hair: girl?.hair ? String(girl.hair) : '',
    tattoo: Number(girl?.tattoo_percentage ?? 0) > 0,
    tattoo_description: girl?.tattoo_description ? String(girl.tattoo_description) : '',
    piercing: Boolean(girl?.piercing),
  };

  return (
    <>
      <StudioTopbar title="Tělo" />

      {saved === '1' && (
        <div className="studio-saved-banner">Uloženo!</div>
      )}

      <div className="studio-form-wrap">
        <form action={updateGirlBody} className="admin-form">
          <fieldset>
            <legend>Míry</legend>
            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="height">Výška (cm)</label>
                <input id="height" name="height" type="number" defaultValue={g.height} min={140} max={200} />
              </div>
              <div className="admin-form-field">
                <label htmlFor="weight">Váha (kg)</label>
                <input id="weight" name="weight" type="number" defaultValue={g.weight} min={40} max={120} />
              </div>
            </div>
            <div className="admin-form-field" style={{ maxWidth: '200px' }}>
              <label htmlFor="bust">Prsa / Postava</label>
              <input id="bust" name="bust" type="text" defaultValue={g.bust} placeholder="např. 2 nebo 85B" />
            </div>
          </fieldset>

          <fieldset>
            <legend>Vzhled</legend>
            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="eyes">Oči</label>
                <select id="eyes" name="eyes" defaultValue={g.eyes}>
                  <option value="">— nevyplněno —</option>
                  {EYES_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="hair">Vlasy</label>
                <select id="hair" name="hair" defaultValue={g.hair}>
                  <option value="">— nevyplněno —</option>
                  {HAIR_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-field">
                <label className="admin-checkbox-label">
                  <input type="checkbox" name="tattoo" defaultChecked={g.tattoo} />
                  Tetování
                </label>
              </div>
              <div className="admin-form-field">
                <label className="admin-checkbox-label">
                  <input type="checkbox" name="piercing" defaultChecked={g.piercing} />
                  Piercing
                </label>
              </div>
            </div>
            <div className="admin-form-field">
              <label htmlFor="tattoo_description">Popis tetování</label>
              <input id="tattoo_description" name="tattoo_description" type="text" defaultValue={g.tattoo_description} />
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
