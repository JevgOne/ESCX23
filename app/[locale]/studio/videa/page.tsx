import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { getGirlVideos } from '@/lib/queries';
import { addStudioVideo, removeStudioVideo } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STYLES = `
.gv-wrap { max-width: 720px; }
.gv-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}
.gv-card h3 {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-coral);
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.gv-form-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.gv-input {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.gv-input:focus { border-color: rgba(232,131,106,0.5); }
.gv-input::placeholder { color: rgba(255,255,255,0.3); }
.gv-btn-add {
  background: linear-gradient(135deg, #f27d8d, #c84b8b);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.gv-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  margin-top: 8px;
}
.gv-msg {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}
.gv-msg-ok { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
.gv-msg-err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.28); color: #fca5a5; }
.gv-list { display: flex; flex-direction: column; gap: 12px; }
.gv-item {
  display: flex;
  gap: 14px;
  align-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 12px;
}
.gv-thumb {
  width: 160px;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #000;
}
.gv-thumb iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.gv-item-info {
  flex: 1;
  min-width: 0;
}
.gv-item-url {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  word-break: break-all;
}
.gv-item-date {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  margin-top: 4px;
}
.gv-btn-del {
  background: rgba(239,68,68,0.15);
  color: #ef4444;
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.gv-empty {
  text-align: center;
  padding: 32px;
  color: rgba(255,255,255,0.35);
  font-size: 14px;
}
@media (max-width: 600px) {
  .gv-item { flex-direction: column; align-items: stretch; }
  .gv-thumb { width: 100%; }
  .gv-form-row { flex-direction: column; }
}
`;

export default async function StudioVideaPage({
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
  const girlId = user.girl_id!;
  const videos = await getGirlVideos(girlId);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <StudioTopbar title="Moje videa" />

      <div className="gv-wrap">
        {sp.saved === '1' && (
          <div className="gv-msg gv-msg-ok">Video bylo uspesne pridano.</div>
        )}
        {sp.error === 'empty' && (
          <div className="gv-msg gv-msg-err">Zadej Vimeo URL.</div>
        )}
        {sp.error === 'invalid' && (
          <div className="gv-msg gv-msg-err">Neplatny Vimeo odkaz. Pouzij format https://vimeo.com/123456789</div>
        )}

        <div className="gv-card">
          <h3>Pridat Vimeo video</h3>
          <form action={addStudioVideo}>
            <div className="gv-form-row">
              <input
                className="gv-input"
                name="vimeo_url"
                type="text"
                required
                placeholder="https://vimeo.com/123456789"
              />
              <button type="submit" className="gv-btn-add">+ Pridat</button>
            </div>
            <div className="gv-hint">
              Vloz odkaz z Vimeo (napr. https://vimeo.com/123456789) nebo jen cislo videa
            </div>
          </form>
        </div>

        <div className="gv-card">
          <h3>Moje videa ({videos.length})</h3>
          {videos.length === 0 ? (
            <div className="gv-empty">Zatim zadna videa. Pridej Vimeo odkaz vyse.</div>
          ) : (
            <div className="gv-list">
              {videos.map((v) => (
                <div key={v.id} className="gv-item">
                  <div className="gv-thumb">
                    <iframe
                      src={`https://player.vimeo.com/video/${v.vimeo_id}?badge=0&autopause=0`}
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={`Video ${v.vimeo_id}`}
                    />
                  </div>
                  <div className="gv-item-info">
                    <div className="gv-item-url">{v.url}</div>
                    {v.created_at && (
                      <div className="gv-item-date">Pridano: {v.created_at}</div>
                    )}
                  </div>
                  <form action={removeStudioVideo}>
                    <input type="hidden" name="video_id" value={v.id} />
                    <button type="submit" className="gv-btn-del">Smazat</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
