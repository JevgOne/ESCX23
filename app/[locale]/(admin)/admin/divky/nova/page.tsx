import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createGirl } from '@/lib/admin-actions';
import { getApplicationById } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GF2_STYLES = `
.gf2-new-wrap { max-width: 720px; }
.gf2-new-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
}
.gf2-new-card h3 {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-coral);
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.gf2-new-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.gf2-new-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.gf2-new-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.gf2-new-field label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e8836a;
}
.gf2-new-field input,
.gf2-new-field select,
.gf2-new-field textarea {
  width: 100%;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
}
.gf2-new-field input:focus,
.gf2-new-field select:focus,
.gf2-new-field textarea:focus { border-color: rgba(232,131,106,0.5); }
.gf2-new-hint { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
.gf2-new-submit-row { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
.gf2-new-btn-submit {
  background: linear-gradient(135deg, #f27d8d, #c84b8b);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.gf2-new-btn-cancel {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  text-decoration: none;
  padding: 12px 16px;
}
.gf2-new-info {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  margin-bottom: 16px;
}
.gf2-new-prefill-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 13px;
  margin-bottom: 20px;
}
.gf2-new-prefill-banner strong { color: #22c55e; }
`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function AdminNovaDivkaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from_application?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const fromAppId = sp.from_application ? Number(sp.from_application) : 0;
  const app = fromAppId > 0 ? await getApplicationById(fromAppId) : null;

  const defaults = {
    name: app?.name ?? '',
    age: app?.age != null ? String(app.age) : '',
    slug: app ? slugify(app.name) : '',
    email: app?.email ?? '',
    phone: app?.phone ?? '',
    height: app?.height != null ? String(app.height) : '',
    weight: app?.weight != null ? String(app.weight) : '',
    bust: app?.bust != null ? String(app.bust) : '',
    bust_natural: app?.bust_natural != null ? String(app.bust_natural) : '1',
    waist: app?.waist != null ? String(app.waist) : '',
    hips: app?.hips != null ? String(app.hips) : '',
    hair: app?.hair ?? '',
    eyes: app?.eyes ?? '',
    tattoo_percentage: app?.tattoo === 1 ? '10' : '0',
    tattoo_description: app?.tattoo_description ?? '',
    piercing: app?.piercing === 1 ? '1' : '0',
    description_cs: app?.bio_cs ?? '',
    description_en: app?.bio_en ?? '',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GF2_STYLES }} />
      <AdminTopbar title={app ? `Nová dívka z aplikace #${app.id}` : 'Nová dívka'} />

      <div style={{ marginBottom: '16px' }}>
        <a href={app ? `/cs/admin/aplikace/${app.id}` : '/cs/admin/divky'} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
          ← {app ? 'Zpět na aplikaci' : 'Zpět na seznam'}
        </a>
      </div>

      <form action={createGirl} className="gf2-new-wrap">
        {app && <input type="hidden" name="from_application_id" value={app.id} />}

        {app && (
          <div className="gf2-new-prefill-banner">
            <strong>✓</strong>
            <span>
              Formulář předvyplněn z aplikace <strong>#{app.id}</strong> ({app.name}).
              Po vytvoření profilu bude aplikace označena jako schválená.
            </span>
          </div>
        )}

        {!app && (
          <div className="gf2-new-info">
            Vyplň základní údaje. Po vytvoření profilu budeš přesměrován/a na edit formulář kde doplníš zbytek.
          </div>
        )}

        <div className="gf2-new-card">
          <h3>Základní údaje</h3>
          <div className="gf2-new-row">
            <div className="gf2-new-field">
              <label htmlFor="name">Jméno *</label>
              <input id="name" name="name" type="text" required placeholder="Nika" defaultValue={defaults.name} autoComplete="off" />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="age">Věk * (min. 18)</label>
              <input id="age" name="age" type="number" required min={18} max={99} placeholder="24" defaultValue={defaults.age} />
            </div>
          </div>

          <div className="gf2-new-field">
            <label htmlFor="slug">Slug *</label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="nika"
              defaultValue={defaults.slug}
              style={{ fontFamily: 'monospace' }}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Pouze malá písmena, číslice a pomlčky (např. petra-nova)"
            />
            <div className="gf2-new-hint">URL-friendly, bez diakritiky, malá písmena (např. petra-nova)</div>
          </div>
        </div>

        <div className="gf2-new-card">
          <h3>Kontakt</h3>
          <div className="gf2-new-row">
            <div className="gf2-new-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="nika@example.com" defaultValue={defaults.email} />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="phone">Telefon</label>
              <input id="phone" name="phone" type="tel" placeholder="+420 XXX XXX XXX" defaultValue={defaults.phone} />
            </div>
          </div>
        </div>

        <div className="gf2-new-card">
          <h3>Tělo & vzhled</h3>
          <div className="gf2-new-row-3">
            <div className="gf2-new-field">
              <label htmlFor="height">Výška (cm)</label>
              <input id="height" name="height" type="number" min={140} max={200} placeholder="165" defaultValue={defaults.height} />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="weight">Váha (kg)</label>
              <input id="weight" name="weight" type="number" min={40} max={120} placeholder="55" defaultValue={defaults.weight} />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="bust">Prsa (1–6)</label>
              <input id="bust" name="bust" type="text" placeholder="2" defaultValue={defaults.bust} />
            </div>
          </div>
          <div className="gf2-new-row">
            <div className="gf2-new-field">
              <label htmlFor="bust_natural">Typ prsou</label>
              <select id="bust_natural" name="bust_natural" defaultValue={defaults.bust_natural}>
                <option value="1">Přírodní</option>
                <option value="0">Implantát</option>
              </select>
            </div>
            <div className="gf2-new-field">
              <label htmlFor="hair">Vlasy</label>
              <input id="hair" name="hair" type="text" placeholder="Hnědé" defaultValue={defaults.hair} />
            </div>
          </div>
          <div className="gf2-new-row">
            <div className="gf2-new-field">
              <label htmlFor="eyes">Oči</label>
              <input id="eyes" name="eyes" type="text" placeholder="Modré" defaultValue={defaults.eyes} />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="piercing">Piercing</label>
              <select id="piercing" name="piercing" defaultValue={defaults.piercing}>
                <option value="0">Ne</option>
                <option value="1">Ano</option>
              </select>
            </div>
          </div>
          <div className="gf2-new-row">
            <div className="gf2-new-field">
              <label htmlFor="tattoo_percentage">Tetování (% pokrytí)</label>
              <input id="tattoo_percentage" name="tattoo_percentage" type="number" min={0} max={100} placeholder="0" defaultValue={defaults.tattoo_percentage} />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="tattoo_description">Popis tetování</label>
              <input id="tattoo_description" name="tattoo_description" type="text" placeholder="Malé motýl na zápěstí" defaultValue={defaults.tattoo_description} />
            </div>
          </div>
        </div>

        {(defaults.description_cs || defaults.description_en) && (
          <div className="gf2-new-card">
            <h3>Bio</h3>
            <div className="gf2-new-field">
              <label htmlFor="description_cs">Popis česky</label>
              <textarea id="description_cs" name="description_cs" rows={4} defaultValue={defaults.description_cs} />
            </div>
            <div className="gf2-new-field">
              <label htmlFor="description_en">Popis anglicky</label>
              <textarea id="description_en" name="description_en" rows={4} defaultValue={defaults.description_en} />
            </div>
          </div>
        )}

        <div className="gf2-new-submit-row">
          <button type="submit" className="gf2-new-btn-submit">
            {app ? 'Vytvořit profil a schválit →' : 'Vytvořit profil →'}
          </button>
          <a href={app ? `/cs/admin/aplikace/${app.id}` : '/cs/admin/divky'} className="gf2-new-btn-cancel">Zrušit</a>
        </div>
      </form>
    </>
  );
}
