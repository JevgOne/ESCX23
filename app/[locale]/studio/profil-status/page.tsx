import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlById } from '@/lib/queries';
import { updateGirlStatus } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudioProfilStatusPage({
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

  const dbStatus = girl ? String(girl.status ?? 'pending') : 'inactive';
  const currentStatus = dbStatus === 'active' ? 'live' : dbStatus === 'inactive' ? 'paused' : 'paused';

  return (
    <>
      <StudioTopbar title="Status profilu" />

      {saved === '1' && (
        <div className="studio-saved-banner">Uloženo!</div>
      )}

      <div className="studio-form-wrap">
        <form action={updateGirlStatus} className="admin-form">
          <fieldset>
            <legend>Viditelnost profilu</legend>

            <div className="studio-status-options">
              <label className={`studio-status-option ${currentStatus === 'live' ? 'selected' : ''}`}>
                <input type="radio" name="profile_status" value="live" defaultChecked={currentStatus === 'live'} />
                <span className="studio-status-icon">🟢</span>
                <span className="studio-status-info">
                  <span className="studio-status-title">LIVE</span>
                  <span className="studio-status-desc">Profil je veřejně viditelný</span>
                </span>
              </label>

              <label className={`studio-status-option ${currentStatus === 'paused' ? 'selected' : ''}`}>
                <input type="radio" name="profile_status" value="paused" defaultChecked={currentStatus === 'paused'} />
                <span className="studio-status-icon">⏸</span>
                <span className="studio-status-info">
                  <span className="studio-status-title">PAUSED</span>
                  <span className="studio-status-desc">Profil skrytý, data zachována</span>
                </span>
              </label>

              <label className="studio-status-option">
                <input type="radio" name="profile_status" value="vip_only" />
                <span className="studio-status-icon">👑</span>
                <span className="studio-status-info">
                  <span className="studio-status-title">VIP only</span>
                  <span className="studio-status-desc">Vidí jen členové (připravujeme)</span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="admin-submit-row">
            <button type="submit" className="admin-btn-submit">Uložit status</button>
            <a href={`/${locale}/studio`} className="admin-btn-secondary">Zpět</a>
          </div>
        </form>
      </div>
    </>
  );
}
