import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { updatePersonalMessage } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioZpravaPage({
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
  const girl = await getGirlById(user.girl_id!);

  const currentMsg = girl?.personal_message ? String(girl.personal_message) : '';

  return (
    <>
      <StudioTopbar title="Osobní zpráva" />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Zpráva uložena!</div>
        )}

        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8, maxWidth: 520 }}>
          Napiš krátkou osobní zprávu pro klienty. Zobrazí se na tvém profilu jako citát.
        </p>
        <p style={{ color: 'var(--color-text-dim)', fontSize: 12, marginBottom: 20 }}>
          Max 160 znaků. Např: &quot;Miluju romantické večery a pánskou společnost.&quot;
        </p>

        {currentMsg && (
          <div className="studio-msg-preview">
            <div className="studio-msg-preview-label">Náhled na profilu:</div>
            <blockquote className="studio-msg-quote">
              &ldquo;{currentMsg}&rdquo;
            </blockquote>
          </div>
        )}

        <form action={updatePersonalMessage} className="studio-form-wrap" style={{ maxWidth: 520 }}>
          <textarea
            name="message"
            placeholder="Napiš svoji zprávu..."
            rows={3}
            maxLength={160}
            defaultValue={currentMsg}
            className="studio-input studio-textarea"
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="submit" className="btn btn-pink btn-sm">Uložit zprávu</button>
            {currentMsg && (
              <button type="submit" name="clear" value="1" className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--color-line-mid)', color: 'var(--color-text-muted)' }}>
                Smazat zprávu
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
