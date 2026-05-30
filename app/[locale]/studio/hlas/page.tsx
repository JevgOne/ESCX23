import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { uploadVoiceMessage } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ERRORS: Record<string, string> = {
  nofile: 'Nebyl vybrán žádný soubor.',
  format: 'Nepodporovaný formát. Povol: MP3, WAV, OGG, M4A.',
  size: 'Soubor je příliš velký (max 5 MB).',
};

export default async function StudioHlasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girl = await getGirlById(user.girl_id!);
  const voiceUrl = girl?.voice_url ? String(girl.voice_url) : null;

  return (
    <>
      <StudioTopbar title="Hlasová zpráva" />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Hlasová zpráva uložena!</div>
        )}
        {sp.error && ERRORS[sp.error] && (
          <div className="studio-alert studio-alert-err">{ERRORS[sp.error]}</div>
        )}

        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8, maxWidth: 520 }}>
          Nahraj krátkou hlasovou zprávu pro klienty (max 15 sekund, max 5 MB).
          Zobrazí se jako přehrávač na tvém profilu.
        </p>
        <p style={{ color: 'var(--color-text-dim)', fontSize: 12, marginBottom: 24 }}>
          Tip: Pozdrav, řekni pár slov o sobě. Klient uslyší tvůj hlas a hned ví jestli mu sedneš.
        </p>

        {voiceUrl && (
          <div className="studio-voice-preview">
            <div className="studio-msg-preview-label">Aktuální nahrávka:</div>
            <audio controls preload="metadata" className="studio-voice-audio">
              <source src={voiceUrl} />
            </audio>
            <form action={uploadVoiceMessage} style={{ marginTop: 10 }}>
              <input type="hidden" name="delete" value="1" />
              <button type="submit" className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--color-line-mid)', color: 'var(--color-text-muted)', fontSize: 12 }}>
                Smazat nahrávku
              </button>
            </form>
          </div>
        )}

        <form action={uploadVoiceMessage} className="studio-voice-upload" encType="multipart/form-data">
          <label className="studio-label">{voiceUrl ? 'Nahrát novou' : 'Nahrát hlasovou zprávu'}</label>
          <input
            type="file"
            name="voice"
            accept=".mp3,.wav,.ogg,.webm,.m4a,.aac,audio/*"
            required
            className="studio-file-input"
          />
          <button type="submit" className="btn btn-pink btn-sm" style={{ marginTop: 12 }}>
            Nahrát
          </button>
        </form>
      </div>
    </>
  );
}
