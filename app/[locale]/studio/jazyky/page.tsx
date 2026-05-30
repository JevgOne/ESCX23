import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { updateGirlLanguages } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LANGUAGES = [
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'en', label: 'Angličtina', flag: '🇬🇧' },
  { code: 'de', label: 'Němčina', flag: '🇩🇪' },
  { code: 'uk', label: 'Ukrajinština', flag: '🇺🇦' },
  { code: 'ru', label: 'Ruština', flag: '🇷🇺' },
  { code: 'sk', label: 'Slovenština', flag: '🇸🇰' },
  { code: 'es', label: 'Španělština', flag: '🇪🇸' },
  { code: 'fr', label: 'Francouzština', flag: '🇫🇷' },
  { code: 'it', label: 'Italština', flag: '🇮🇹' },
  { code: 'pt', label: 'Portugalština', flag: '🇵🇹' },
  { code: 'pl', label: 'Polština', flag: '🇵🇱' },
  { code: 'ro', label: 'Rumunština', flag: '🇷🇴' },
  { code: 'hu', label: 'Maďarština', flag: '🇭🇺' },
];

export default async function StudioJazykyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;
  const girl = await getGirlById(girlId);

  let currentLangs: string[] = [];
  if (girl) {
    const raw = (girl as Record<string, unknown>).languages;
    if (raw) {
      const s = String(raw).trim();
      try { currentLangs = s.startsWith('[') ? JSON.parse(s) : s.split(',').map((l: string) => l.trim()); } catch { /* */ }
    }
  }

  const activeLangs = new Set(currentLangs);

  return (
    <>
      <StudioTopbar title="Jazyky" />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Jazyky uloženy!</div>
        )}

        <form action={updateGirlLanguages} className="studio-form-wrap">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
            Vyber jazyky, kterými mluvíš. Klienti uvidí jazyky na tvém profilu.
          </p>
          <div className="studio-services-grid">
            {LANGUAGES.map((lang) => (
              <label key={lang.code} className={`studio-service-chip${activeLangs.has(lang.code) ? ' active' : ''}`}>
                <input
                  type="checkbox"
                  name="languages"
                  value={lang.code}
                  defaultChecked={activeLangs.has(lang.code)}
                />
                <span className="studio-service-name">{lang.flag} {lang.label}</span>
              </label>
            ))}
          </div>

          <button type="submit" className="btn btn-pink" style={{ marginTop: 24 }}>
            Uložit jazyky
          </button>
        </form>
      </div>
    </>
  );
}
