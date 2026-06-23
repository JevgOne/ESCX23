import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById, getGirlServices, getAllServices } from '@/lib/queries';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updateGirl, archiveGirl, deleteGirl } from '@/lib/admin-actions';
import { getBasicServices, getExtraServices } from '@/lib/services';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EYES_OPTIONS = ['Modré', 'Hnědé', 'Zelené', 'Šedé', 'Lískové', 'Černé'];
const HAIR_OPTIONS = ['Blond', 'Hnědé', 'Černé', 'Zrzavé', 'Rusé', 'Šedé'];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktivní' },
  { value: 'pending', label: 'Čeká na schválení' },
  { value: 'inactive', label: 'Dočasně nedostupná' },
  { value: 'archived', label: 'Archivovaná' },
];
const BADGE_OPTIONS = [
  { value: '', label: '— žádný —' },
  { value: 'new', label: 'NEW (nová)' },
  { value: 'hot', label: 'HOT' },
  { value: 'vip', label: 'VIP' },
  { value: 'top', label: 'TOP (top dívka)' },
  { value: 'top_reviews', label: 'TOP REVIEWS (nejlépe hodnocená)' },
  { value: 'recommended', label: 'DOPORUČUJEME' },
];
const PIERCING_OPTIONS = [
  { value: '0', label: 'Žádný' },
  { value: '1', label: 'Uši' },
  { value: '2', label: 'Více míst' },
  { value: '3', label: 'Tělo' },
];
const LANG_LIST = [
  { code: 'cs', flag: '🇨🇿', label: 'Čeština' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'uk', flag: '🇺🇦', label: 'Українська' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'pl', flag: '🇵🇱', label: 'Polski' },
  { code: 'sk', flag: '🇸🇰', label: 'Slovenčina' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];
const BIO_LANGS = [
  { code: 'cs', label: '🇨🇿 Čeština' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'uk', label: '🇺🇦 Українська' },
];
const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Základní',
  oral: 'Orální',
  special: 'Speciální',
  massage: 'Masáže',
  extras: 'Extra',
  types: 'Typy setkání',
};
const ALL_HASHTAGS = [
  'blondynky-praha', 'brunetky-praha', 'cernovlasky-praha', 'gfe-praha',
  'girlfriend-experience', 'prirodni-poprsi', 'mlade-holky', 'studentky-praha',
  'holky-praha', 'spolecnice-praha', 'ceske-holky', 'ruske-holky',
  'ukrajinske-holky', 'tetovani', 'piercing-holky', 'plne-rty',
  'dlouhe-nohy', 'fit-holky', 'stihla-postava', 'krivky',
  'velka-prsa', 'kratke-vlasy', 'dlouhe-vlasy', 'milf-praha',
  'modre-oci', 'exoticke-krasky', 'luxusni-sluzby', 'elegantni-holky',
  'sexy-holky', 'krasne-holky', 'hot-holky-praha', 'dokonale-telo',
  'prirodni-krasa',
];

const GF2_STYLES = `
/* ── gf2: Girl Form v2 — inline styles (Safari/Turbopack cache bypass) ── */
.gf2-wrap { display: flex; flex-direction: column; gap: 0; }
.gf2-section {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.gf2-section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.gf2-step-badge {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f27d8d, #c84b8b);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.gf2-section-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.03em;
}
.gf2-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.gf2-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.gf2-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.gf2-field:last-child { margin-bottom: 0; }
.gf2-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e8836a;
}
.gf2-hint { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
.gf2-field input[type="text"],
.gf2-field input[type="email"],
.gf2-field input[type="tel"],
.gf2-field input[type="number"],
.gf2-field select,
.gf2-field textarea {
  width: 100%;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 9px 12px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
}
.gf2-field input:focus,
.gf2-field select:focus,
.gf2-field textarea:focus { border-color: rgba(232,131,106,0.5); }
.gf2-field select option { background: #1a1a2e; color: #fff; }
.gf2-field textarea { resize: vertical; min-height: 80px; }
.gf2-mono { font-family: monospace !important; }

/* Lang tabs CSS pattern */
.gf2-tab-radio { display: none; }
.gf2-tab-bar { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.gf2-tab-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.15s;
}
.gf2-tab-pane { display: none; }

#gf2-bio-cs:checked ~ .gf2-tab-bar label[for="gf2-bio-cs"],
#gf2-bio-en:checked ~ .gf2-tab-bar label[for="gf2-bio-en"],
#gf2-bio-de:checked ~ .gf2-tab-bar label[for="gf2-bio-de"],
#gf2-bio-uk:checked ~ .gf2-tab-bar label[for="gf2-bio-uk"] {
  background: linear-gradient(135deg, rgba(242,125,141,0.3), rgba(200,75,139,0.3));
  color: #fff;
  border-color: rgba(242,125,141,0.4);
}
#gf2-bio-cs:checked ~ .gf2-tab-pane-bio-cs,
#gf2-bio-en:checked ~ .gf2-tab-pane-bio-en,
#gf2-bio-de:checked ~ .gf2-tab-pane-bio-de,
#gf2-bio-uk:checked ~ .gf2-tab-pane-bio-uk { display: block; }

#gf2-seo-cs:checked ~ .gf2-tab-bar label[for="gf2-seo-cs"],
#gf2-seo-en:checked ~ .gf2-tab-bar label[for="gf2-seo-en"],
#gf2-seo-de:checked ~ .gf2-tab-bar label[for="gf2-seo-de"],
#gf2-seo-uk:checked ~ .gf2-tab-bar label[for="gf2-seo-uk"] {
  background: linear-gradient(135deg, rgba(242,125,141,0.3), rgba(200,75,139,0.3));
  color: #fff;
  border-color: rgba(242,125,141,0.4);
}
#gf2-seo-cs:checked ~ .gf2-tab-pane-seo-cs,
#gf2-seo-en:checked ~ .gf2-tab-pane-seo-en,
#gf2-seo-de:checked ~ .gf2-tab-pane-seo-de,
#gf2-seo-uk:checked ~ .gf2-tab-pane-seo-uk { display: block; }

/* Chip checkboxes */
.gf2-chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.gf2-chip-label { cursor: pointer; }
.gf2-chip-label input[type="checkbox"] { display: none; }
.gf2-chip-span {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  transition: all 0.15s;
}
.gf2-chip-label input[type="checkbox"]:checked + .gf2-chip-span {
  background: linear-gradient(135deg, rgba(242,125,141,0.35), rgba(200,75,139,0.35));
  border-color: rgba(242,125,141,0.5);
  color: #fff;
}

/* Language checkboxes */
.gf2-lang-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.gf2-lang-label { cursor: pointer; }
.gf2-lang-label input[type="checkbox"] { display: none; }
.gf2-lang-span {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border-radius: 8px;
  font-size: 11px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  text-align: center;
  transition: all 0.15s;
}
.gf2-lang-span .gf2-lang-flag { font-size: 20px; }
.gf2-lang-label input[type="checkbox"]:checked + .gf2-lang-span {
  background: linear-gradient(135deg, rgba(242,125,141,0.25), rgba(200,75,139,0.25));
  border-color: rgba(242,125,141,0.4);
  color: #fff;
}

/* Service category */
.gf2-cat-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin: 14px 0 8px;
}
.gf2-cat-title:first-child { margin-top: 0; }

/* Tattoo slider */
.gf2-slider-row { display: flex; align-items: center; gap: 12px; }
.gf2-slider { flex: 1; accent-color: #f27d8d; }
.gf2-slider-num {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 6px 10px;
  color: #fff;
  font-size: 13px;
  width: 56px;
  text-align: center;
}

/* Checkboxes */
.gf2-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  padding: 6px 0;
}
.gf2-check-label input[type="checkbox"] { accent-color: #f27d8d; width: 15px; height: 15px; }
.gf2-checks-row { display: flex; flex-wrap: wrap; gap: 4px 24px; }

/* Submit row */
.gf2-submit-row { display: flex; gap: 12px; align-items: center; margin-top: 8px; margin-bottom: 32px; }
.gf2-btn-submit {
  background: linear-gradient(135deg, #f27d8d, #c84b8b);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 13px 32px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.gf2-btn-cancel {
  color: rgba(255,255,255,0.45);
  font-size: 13px;
  text-decoration: none;
  padding: 13px 16px;
}

/* Media links */
.gf2-media-links { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
.gf2-media-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  text-decoration: none;
  transition: all 0.15s;
}
.gf2-media-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

/* Danger zone */
.gf2-danger-zone {
  margin-top: 48px;
  padding: 20px;
  border: 1px solid rgba(220,50,50,0.4);
  border-radius: 12px;
}
.gf2-danger-title {
  font-size: 13px;
  font-weight: 600;
  color: #e05555;
  margin-bottom: 12px;
}
.gf2-danger-btn {
  background: transparent;
  border: 1px solid rgba(220,50,50,0.5);
  color: #e05555;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13px;
  cursor: pointer;
}
.gf2-danger-btn:hover { background: rgba(220,50,50,0.15); }
`;

export default async function AdminGirlEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const [existingServiceIds, allServices] = await Promise.all([
    getGirlServices(Number(id)),
    getAllServices(),
  ]);

  // Map lib/services.ts slug → DB integer ID (girl_services FK uses numeric id)
  const slugToDbId = new Map<string, number>();
  for (const s of allServices) {
    if (s.slug) slugToDbId.set(s.slug, Number(s.id));
  }
  const libBasic = getBasicServices();
  const libExtras = getExtraServices();

  const gr = girl as Record<string, unknown>;

  const hashtagSlugsSet = new Set<string>((() => {
    const raw = gr.hashtags ? String(gr.hashtags) : '';
    if (raw.startsWith('[')) {
      try { return JSON.parse(raw) as string[]; } catch { /* fall */ }
    }
    return raw.split(',').map((t) => t.trim()).filter(Boolean);
  })());

  const activeLangs = new Set<string>((() => {
    const raw = gr.languages ? String(gr.languages) : '';
    if (raw.startsWith('[')) {
      try { return JSON.parse(raw) as string[]; } catch { /* fall */ }
    }
    return raw.split(',').map((l) => l.trim()).filter(Boolean);
  })());

  const g = {
    id: Number(girl.id),
    name: String(girl.name ?? ''),
    slug: String(girl.slug ?? ''),
    age: Number(girl.age ?? 18),
    email: gr.email ? String(gr.email) : '',
    phone: gr.phone ? String(gr.phone) : '',
    telegram: gr.telegram ? String(gr.telegram) : '',
    nationality: gr.nationality ? String(gr.nationality) : '',
    location: gr.location ? String(gr.location) : '',
    status: String(girl.status ?? 'pending'),
    height: girl.height != null ? Number(girl.height) : '',
    weight: girl.weight != null ? Number(girl.weight) : '',
    bust: gr.bust != null ? String(gr.bust) : '',
    bust_natural: gr.bust_natural != null ? Number(gr.bust_natural) : 1,
    waist: gr.waist != null ? Number(gr.waist) : '',
    hips: gr.hips != null ? Number(gr.hips) : '',
    eyes: gr.eyes ? String(gr.eyes) : '',
    hair: gr.hair ? String(gr.hair) : '',
    tattoo_percentage: Number(gr.tattoo_percentage ?? 0),
    tattoo_description: gr.tattoo_description ? String(gr.tattoo_description) : '',
    piercing: Number(gr.piercing ?? 0),
    piercing_description: gr.piercing_description ? String(gr.piercing_description) : '',
    description_cs: gr.description_cs ? String(gr.description_cs) : '',
    description_en: gr.description_en ? String(gr.description_en) : '',
    description_de: gr.description_de ? String(gr.description_de) : '',
    description_uk: gr.description_uk ? String(gr.description_uk) : '',
    subtitle_cs: gr.subtitle_cs ? String(gr.subtitle_cs) : '',
    subtitle_en: gr.subtitle_en ? String(gr.subtitle_en) : '',
    subtitle_de: gr.subtitle_de ? String(gr.subtitle_de) : '',
    subtitle_uk: gr.subtitle_uk ? String(gr.subtitle_uk) : '',
    meta_title_cs: gr.meta_title_cs ? String(gr.meta_title_cs) : '',
    meta_title_en: gr.meta_title_en ? String(gr.meta_title_en) : '',
    meta_title_de: gr.meta_title_de ? String(gr.meta_title_de) : '',
    meta_title_uk: gr.meta_title_uk ? String(gr.meta_title_uk) : '',
    meta_description_cs: gr.meta_description_cs ? String(gr.meta_description_cs) : '',
    meta_description_en: gr.meta_description_en ? String(gr.meta_description_en) : '',
    meta_description_de: gr.meta_description_de ? String(gr.meta_description_de) : '',
    meta_description_uk: gr.meta_description_uk ? String(gr.meta_description_uk) : '',
    og_title_cs: gr.og_title_cs ? String(gr.og_title_cs) : '',
    og_title_en: gr.og_title_en ? String(gr.og_title_en) : '',
    og_title_de: gr.og_title_de ? String(gr.og_title_de) : '',
    og_title_uk: gr.og_title_uk ? String(gr.og_title_uk) : '',
    og_description_cs: gr.og_description_cs ? String(gr.og_description_cs) : '',
    og_description_en: gr.og_description_en ? String(gr.og_description_en) : '',
    og_description_de: gr.og_description_de ? String(gr.og_description_de) : '',
    og_description_uk: gr.og_description_uk ? String(gr.og_description_uk) : '',
    badge_type: gr.badge_type ? String(gr.badge_type) : '',
    ethnicity: gr.ethnicity ? String(gr.ethnicity) : '',
    vip: Boolean(gr.vip),
    is_featured: Boolean(gr.is_featured),
    is_top: Boolean(gr.is_top),
    is_new: Boolean(gr.is_new),
    verified: Boolean(gr.verified),
    online: Boolean(gr.online),
    calendar_embed_url: gr.calendar_embed_url ? String(gr.calendar_embed_url) : '',
  };

  const styleWardrobeRaw = gr.style_wardrobe ? String(gr.style_wardrobe) : null;
  let activeStyles = new Set<string>();
  let activeWardrobe = new Set<string>();
  if (styleWardrobeRaw) {
    try {
      const parsed = JSON.parse(styleWardrobeRaw);
      activeStyles = new Set(Array.isArray(parsed.style) ? parsed.style : []);
      activeWardrobe = new Set(Array.isArray(parsed.wardrobe) ? parsed.wardrobe : []);
    } catch { /* invalid JSON — ignore */ }
  }

  const STYLE_OPTIONS = [
    { id: 'elegant', label: 'Elegantní' },
    { id: 'casual', label: 'Casual / ležérní' },
    { id: 'sporty', label: 'Sportovní' },
    { id: 'glamour', label: 'Glamour / okázalý' },
    { id: 'minimalist', label: 'Minimalistický' },
    { id: 'romantic', label: 'Romantický / ženský' },
    { id: 'streetwear', label: 'Streetwear / moderní' },
    { id: 'business', label: 'Business / formální' },
    { id: 'bohemian', label: 'Bohémský / artsy' },
  ];
  const WARDROBE_OPTIONS = [
    { id: 'lingerie', label: 'Sexy lingerie' },
    { id: 'stockings', label: 'Punčochy & podvazky' },
    { id: 'high_heels', label: 'Vysoké podpatky' },
    { id: 'boots', label: 'Kozačky / overknee' },
    { id: 'latex', label: 'Latex / vinyl' },
    { id: 'leather', label: 'Kůže / kožené doplňky' },
    { id: 'corset', label: 'Korzet' },
    { id: 'bodystocking', label: 'Bodystocking / catsuit' },
    { id: 'costume', label: 'Kostým / role-play outfit' },
    { id: 'nurse', label: 'Zdravotní sestřička' },
    { id: 'schoolgirl', label: 'Školačka' },
    { id: 'maid', label: 'Pokojská' },
    { id: 'secretary', label: 'Sekretářka' },
    { id: 'swimwear', label: 'Plavky / bikiny' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GF2_STYLES }} />
      <AdminTopbar title={`Editace: ${g.name}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/cs/admin/divky/${g.id}`} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
          ← Zpět na profil
        </a>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.5)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#e05555', fontSize: '13px' }}>
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={updateGirl} className="gf2-wrap">
        <input type="hidden" name="id" value={g.id} />

        {/* SEKCE 1: Základní info */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">1</div>
            <div className="gf2-section-title">Základní info</div>
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="name">Jméno *</label>
              <input id="name" name="name" type="text" defaultValue={g.name} required />
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="age">Věk * (min. 18)</label>
              <input id="age" name="age" type="number" defaultValue={g.age} min={18} max={99} required />
            </div>
          </div>

          <div className="gf2-field">
            <label className="gf2-label">Slug</label>
            <input type="hidden" name="slug" value={g.slug} />
            <div style={{ padding: '9px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'monospace' }}>
              /{g.slug}
            </div>
            <div className="gf2-hint">Generuje se automaticky z jména</div>
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={g.status}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="nationality">Národnost</label>
              <input id="nationality" name="nationality" type="text" defaultValue={g.nationality} placeholder="Česká, Slovenka, Ukrajinka..." />
            </div>
          </div>

          {/* Pobočka se nastavuje v rozvrhu, ne na profilu dívky */}
        </div>

        {/* SEKCE 2: Kontakt */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">2</div>
            <div className="gf2-section-title">Kontakt</div>
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue={g.email} placeholder="nika@example.com" />
            </div>
            <div className="gf2-field">
              <label className="gf2-label">Telefon / WhatsApp / Telegram</label>
              <div style={{ padding: '9px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                +420 734 332 131 <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>(stejný pro všechny)</span>
              </div>
            </div>
          </div>

          <div className="gf2-field">
            <label className="gf2-label" htmlFor="calendar_embed_url">Google Calendar Embed URL</label>
            <input id="calendar_embed_url" name="calendar_embed_url" type="text" defaultValue={g.calendar_embed_url} placeholder="https://calendar.google.com/calendar/embed?src=..." className="gf2-mono" />
            <div className="gf2-hint">Veřejný embed odkaz na kalendář dívky (zobrazí se jí ve Studiu)</div>
          </div>
        </div>

        {/* SEKCE 3: Fyzické parametry */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">3</div>
            <div className="gf2-section-title">Fyzické parametry</div>
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="height">Výška (cm)</label>
              <input id="height" name="height" type="number" defaultValue={g.height} min={140} max={200} placeholder="170" />
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="weight">Váha (kg)</label>
              <input id="weight" name="weight" type="number" defaultValue={g.weight} min={40} max={120} placeholder="55" />
            </div>
          </div>

          <div className="gf2-row-3">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="bust">Prsa (cup)</label>
              <input id="bust" name="bust" type="text" defaultValue={g.bust} placeholder="např. C nebo D" />
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="waist">Pas (cm)</label>
              <input id="waist" name="waist" type="number" defaultValue={g.waist} min={50} max={120} placeholder="65" />
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="hips">Boky (cm)</label>
              <input id="hips" name="hips" type="number" defaultValue={g.hips} min={60} max={140} placeholder="92" />
            </div>
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="bust_natural">Typ prsou</label>
              <select id="bust_natural" name="bust_natural" defaultValue={String(g.bust_natural)}>
                <option value="1">Přírodní</option>
                <option value="0">Implantát</option>
              </select>
            </div>
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="hair">Vlasy</label>
              <select id="hair" name="hair" defaultValue={g.hair}>
                <option value="">— nevyplněno —</option>
                {HAIR_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="eyes">Oči</label>
              <select id="eyes" name="eyes" defaultValue={g.eyes}>
                <option value="">— nevyplněno —</option>
                {EYES_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SEKCE 4: Jazyky */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">4</div>
            <div className="gf2-section-title">Jazyky</div>
          </div>

          <div className="gf2-lang-grid">
            {LANG_LIST.map((l) => (
              <label key={l.code} className="gf2-lang-label">
                <input
                  type="checkbox"
                  name="lang_codes"
                  value={l.code}
                  defaultChecked={activeLangs.has(l.code)}
                />
                <span className="gf2-lang-span">
                  <span className="gf2-lang-flag">{l.flag}</span>
                  <span>{l.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* SEKCE 5: Tetování & Piercing */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">5</div>
            <div className="gf2-section-title">Tetování &amp; Piercing</div>
          </div>

          <div className="gf2-field">
            <label className="gf2-label" htmlFor="tattoo_percentage">Tetování (% pokrytí těla)</label>
            <input
              id="tattoo_percentage"
              type="number"
              name="tattoo_percentage"
              min={0}
              max={100}
              defaultValue={g.tattoo_percentage}
              placeholder="0"
            />
            <div className="gf2-hint">0 = žádné, 5 = diskrétní, 30 = viditelné, 70+ = výrazné/celé tělo</div>
          </div>

          <div className="gf2-field">
            <label className="gf2-label" htmlFor="tattoo_description">Popis tetování</label>
            <input id="tattoo_description" name="tattoo_description" type="text" defaultValue={g.tattoo_description} placeholder="např. malé tetování na zápěstí" />
          </div>

          <div className="gf2-row">
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="piercing">Piercing</label>
              <select id="piercing" name="piercing" defaultValue={String(g.piercing)}>
                {PIERCING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="gf2-field">
              <label className="gf2-label" htmlFor="piercing_description">Popis piercingu</label>
              <input id="piercing_description" name="piercing_description" type="text" defaultValue={g.piercing_description} placeholder="např. piercing v nose" />
            </div>
          </div>
        </div>

        {/* SEKCE 6: Styl & Šatník */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">6</div>
            <div className="gf2-section-title">Styl &amp; Šatník</div>
          </div>
          <div className="gf2-field">
            <label className="gf2-label">Běžný styl oblékání</label>
            <div className="gf2-chips-wrap">
              {STYLE_OPTIONS.map((s) => (
                <label key={s.id} className="gf2-chip-label">
                  <input type="checkbox" name="style_types" value={s.id} defaultChecked={activeStyles.has(s.id)} />
                  <span className="gf2-chip-span">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="gf2-field" style={{ marginTop: 16 }}>
            <label className="gf2-label">Sexy outfity na vyžádání</label>
            <div className="gf2-chips-wrap">
              {WARDROBE_OPTIONS.map((s) => (
                <label key={s.id} className="gf2-chip-label">
                  <input type="checkbox" name="wardrobe_items" value={s.id} defaultChecked={activeWardrobe.has(s.id)} />
                  <span className="gf2-chip-span">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SEKCE 7: Služby */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">7</div>
            <div className="gf2-section-title">Služby</div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            .ad-svc-label { display: block; margin: 14px 0 8px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 0.02em; }
            .ad-svc-hint { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0 0 10px; }
            .ad-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
            .ad-svc-fixed { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.28); border-radius: 8px; color: rgba(255,255,255,0.85); font-size: 13px; }
            .ad-svc-fixed-check { color: #22c55e; font-weight: 700; }
            .ad-svc-chk { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: rgba(255,255,255,0.78); font-size: 13px; cursor: pointer; transition: all 0.15s; }
            .ad-svc-chk:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.22); }
            .ad-svc-chk input { accent-color: #f27d8d; flex-shrink: 0; cursor: pointer; }
            .ad-svc-chk:has(input:checked) { background: rgba(242,125,141,0.14); border-color: rgba(242,125,141,0.55); color: #fff; }
          `}} />

          {/* Základní služby — auto-included, hidden inputs */}
          <div className="ad-svc-label">Základní služby (vždy zahrnuté v ceně)</div>
          <div className="ad-svc-grid">
            {libBasic.map((s) => {
              const dbId = slugToDbId.get(s.id);
              return (
                <div key={s.id} className="ad-svc-fixed">
                  <span className="ad-svc-fixed-check">✓</span>
                  <span>{s.translations.cs}</span>
                  {dbId && <input type="hidden" name="service_ids" value={dbId} />}
                </div>
              );
            })}
          </div>

          {/* Extra služby — checkboxy */}
          <div className="ad-svc-label" style={{ marginTop: 20 }}>Extra služby (které nabízí?)</div>
          <p className="ad-svc-hint">Zaškrtni vše, co dívka nabízí. Co označíš, se ukáže v jejím veřejném profilu.</p>
          <div className="ad-svc-grid">
            {libExtras.map((s) => {
              const dbId = slugToDbId.get(s.id);
              if (!dbId) return null;
              return (
                <label key={s.id} className="ad-svc-chk">
                  <input
                    type="checkbox"
                    name="service_ids"
                    value={dbId}
                    defaultChecked={existingServiceIds.includes(dbId)}
                  />
                  <span>{s.translations.cs}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* SEKCE 8: Hashtagy */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">8</div>
            <div className="gf2-section-title">Hashtagy</div>
          </div>

          <div className="gf2-chips-wrap">
            {ALL_HASHTAGS.map((slug) => (
              <label key={slug} className="gf2-chip-label">
                <input
                  type="checkbox"
                  name="hashtag_slugs"
                  value={slug}
                  defaultChecked={hashtagSlugsSet.has(slug)}
                />
                <span className="gf2-chip-span">#{slug}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SEKCE 9: Bio (multi-lang) */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">9</div>
            <div className="gf2-section-title">Bio (vícejazyčný)</div>
          </div>

          <input type="radio" name="gf2-bio-tab" id="gf2-bio-cs" className="gf2-tab-radio" defaultChecked />
          <input type="radio" name="gf2-bio-tab" id="gf2-bio-en" className="gf2-tab-radio" />
          <input type="radio" name="gf2-bio-tab" id="gf2-bio-de" className="gf2-tab-radio" />
          <input type="radio" name="gf2-bio-tab" id="gf2-bio-uk" className="gf2-tab-radio" />

          <div className="gf2-tab-bar">
            {BIO_LANGS.map((lng) => (
              <label key={lng.code} htmlFor={`gf2-bio-${lng.code}`} className="gf2-tab-btn">
                {lng.label}
              </label>
            ))}
          </div>

          {BIO_LANGS.map((lng) => (
            <div key={lng.code} className={`gf2-tab-pane gf2-tab-pane-bio-${lng.code}`}>
              <div className="gf2-field">
                <label className="gf2-label" htmlFor={`description_${lng.code}`}>
                  Bio ({lng.code.toUpperCase()})
                </label>
                <textarea
                  id={`description_${lng.code}`}
                  name={`description_${lng.code}`}
                  rows={7}
                  defaultValue={g[`description_${lng.code}` as keyof typeof g] as string}
                  placeholder={
                    lng.code === 'cs' ? 'Popis profilu v češtině...' :
                    lng.code === 'en' ? 'Profile description in English...' :
                    lng.code === 'de' ? 'Profilbeschreibung auf Deutsch...' :
                    'Опис профілю українською...'
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* SEKCE 10: SEO (multi-lang) */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">10</div>
            <div className="gf2-section-title">SEO (vícejazyčný)</div>
          </div>

          <input type="radio" name="gf2-seo-tab" id="gf2-seo-cs" className="gf2-tab-radio" defaultChecked />
          <input type="radio" name="gf2-seo-tab" id="gf2-seo-en" className="gf2-tab-radio" />
          <input type="radio" name="gf2-seo-tab" id="gf2-seo-de" className="gf2-tab-radio" />
          <input type="radio" name="gf2-seo-tab" id="gf2-seo-uk" className="gf2-tab-radio" />

          <div className="gf2-tab-bar">
            {BIO_LANGS.map((lng) => (
              <label key={lng.code} htmlFor={`gf2-seo-${lng.code}`} className="gf2-tab-btn">
                {lng.label}
              </label>
            ))}
          </div>

          {BIO_LANGS.map((lng) => (
            <div key={lng.code} className={`gf2-tab-pane gf2-tab-pane-seo-${lng.code}`}>
              <div className="gf2-field">
                <label className="gf2-label" htmlFor={`subtitle_${lng.code}`}>Podtitul ({lng.code.toUpperCase()})</label>
                <input
                  id={`subtitle_${lng.code}`}
                  name={`subtitle_${lng.code}`}
                  type="text"
                  defaultValue={g[`subtitle_${lng.code}` as keyof typeof g] as string}
                  placeholder="Krátký podtitul na profilu..."
                />
              </div>
              <div className="gf2-field">
                <label className="gf2-label" htmlFor={`meta_title_${lng.code}`}>Meta Title ({lng.code.toUpperCase()})</label>
                <input
                  id={`meta_title_${lng.code}`}
                  name={`meta_title_${lng.code}`}
                  type="text"
                  maxLength={60}
                  defaultValue={g[`meta_title_${lng.code}` as keyof typeof g] as string}
                />
                <div className="gf2-hint">max 60 znaků</div>
              </div>
              <div className="gf2-field">
                <label className="gf2-label" htmlFor={`meta_description_${lng.code}`}>Meta Description ({lng.code.toUpperCase()})</label>
                <textarea
                  id={`meta_description_${lng.code}`}
                  name={`meta_description_${lng.code}`}
                  rows={3}
                  maxLength={160}
                  defaultValue={g[`meta_description_${lng.code}` as keyof typeof g] as string}
                />
                <div className="gf2-hint">max 160 znaků</div>
              </div>
              <div className="gf2-field">
                <label className="gf2-label" htmlFor={`og_title_${lng.code}`}>OG Title ({lng.code.toUpperCase()})</label>
                <input
                  id={`og_title_${lng.code}`}
                  name={`og_title_${lng.code}`}
                  type="text"
                  defaultValue={g[`og_title_${lng.code}` as keyof typeof g] as string}
                  placeholder="Social share titulek"
                />
              </div>
              <div className="gf2-field">
                <label className="gf2-label" htmlFor={`og_description_${lng.code}`}>OG Description ({lng.code.toUpperCase()})</label>
                <textarea
                  id={`og_description_${lng.code}`}
                  name={`og_description_${lng.code}`}
                  rows={2}
                  defaultValue={g[`og_description_${lng.code}` as keyof typeof g] as string}
                  placeholder="Social share popis"
                />
              </div>
            </div>
          ))}
        </div>

        {/* SEKCE 11: Fotky (link) */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">11</div>
            <div className="gf2-section-title">Fotky</div>
          </div>
          <div className="gf2-media-links">
            <a href={`/cs/admin/divky/${g.id}/fotky`} className="gf2-media-btn">
              📸 Spravovat fotky →
            </a>
          </div>
        </div>

        {/* SEKCE 12: Videa (link) */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">12</div>
            <div className="gf2-section-title">Videa</div>
          </div>
          <div className="gf2-media-links">
            <a href={`/cs/admin/divky/${g.id}/videa`} className="gf2-media-btn">
              🎬 Spravovat videa →
            </a>
          </div>
        </div>

        {/* SEKCE 13: Zvýraznění */}
        <div className="gf2-section">
          <div className="gf2-section-head">
            <div className="gf2-step-badge">13</div>
            <div className="gf2-section-title">Zvýraznění profilu</div>
          </div>

          <div className="gf2-field" style={{ maxWidth: '240px' }}>
            <label className="gf2-label" htmlFor="badge_type">Badge na kartě</label>
            <select id="badge_type" name="badge_type" defaultValue={g.badge_type}>
              {BADGE_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <div className="gf2-hint">Zobrazí se jako štítek na fotce v seznamu dívek</div>
          </div>

          <div className="gf2-field" style={{ maxWidth: '240px' }}>
            <label className="gf2-label" htmlFor="ethnicity">Etnicita (badge)</label>
            <select id="ethnicity" name="ethnicity" defaultValue={g.ethnicity}>
              <option value="">— žádný —</option>
              <option value="asian">Asiatka</option>
              <option value="ebony">Ebony</option>
              <option value="mulatto">Mulatka</option>
              <option value="latina">Latina</option>
            </select>
            <div className="gf2-hint">Zobrazí se jako barevný badge vlevo dole na kartě</div>
          </div>

          <div className="gf2-checks-row">
            <label className="gf2-check-label">
              <input type="checkbox" name="is_featured" defaultChecked={g.is_featured} />
              Featured (zvýrazněná na homepage)
            </label>
            <label className="gf2-check-label">
              <input type="checkbox" name="is_top" defaultChecked={g.is_top} />
              Top dívka (řadí se první)
            </label>
            <label className="gf2-check-label">
              <input type="checkbox" name="is_new" defaultChecked={g.is_new} />
              Nová (badge NEW na kartě)
            </label>
            <label className="gf2-check-label">
              <input type="checkbox" name="vip" defaultChecked={g.vip} />
              VIP (jen pro VIP členy)
            </label>
          </div>
          {/* verified = vždy on (fotky ověřujeme my), online se neřeší manuálně */}
          <input type="hidden" name="verified" value="on" />
        </div>

        <div className="gf2-submit-row">
          <button type="submit" className="gf2-btn-submit">Uložit změny</button>
          <a href={`/cs/admin/divky/${g.id}`} className="gf2-btn-cancel">Zrušit</a>
        </div>
      </form>

      <div className="gf2-danger-zone">
        <div className="gf2-danger-title">Správa profilu</div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
          Archivovaná dívka nebude viditelná na webu, ale její data zůstanou zachována.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <form action={archiveGirl}>
            <input type="hidden" name="id" value={g.id} />
            <button type="submit" className="gf2-danger-btn">Archivovat dívku</button>
          </form>
          <form action={deleteGirl}>
            <input type="hidden" name="id" value={g.id} />
            <button type="submit" className="gf2-danger-btn" style={{ borderColor: 'rgba(220,50,50,0.8)', color: '#ff3333' }}>
              Smazat dívku
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
