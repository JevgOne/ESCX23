import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById, getGirlVideos } from '@/lib/queries';
import { addGirlVideo, removeGirlVideo } from '@/lib/admin-actions';
import AdminTopbar from '@/components/admin/AdminTopbar';

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
`;

export default async function AdminGirlVidea({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const girl = await getGirlById(Number(id));
  if (!girl) notFound();

  const name = String(girl.name ?? '');
  const gId = Number(girl.id);
  const videos = await getGirlVideos(gId);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <AdminTopbar title={`Videa: ${name}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/cs/admin/divky/${gId}/edit`} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
          ← Zpět na edit
        </a>
      </div>

      <div className="gv-wrap">
        <div className="gv-card">
          <h3>Přidat Vimeo video</h3>
          <form action={addGirlVideo}>
            <input type="hidden" name="girl_id" value={gId} />
            <div className="gv-form-row">
              <input
                className="gv-input"
                name="vimeo_url"
                type="text"
                required
                placeholder="https://vimeo.com/123456789"
              />
              <button type="submit" className="gv-btn-add">+ Přidat</button>
            </div>
            <div className="gv-hint">
              Vlož Vimeo URL (např. https://vimeo.com/123456789) nebo jen ID videa
            </div>
          </form>
        </div>

        <div className="gv-card">
          <h3>Videa ({videos.length})</h3>
          {videos.length === 0 ? (
            <div className="gv-empty">
              Zatím žádná videa. Přidej Vimeo odkaz výše.
            </div>
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
                      <div className="gv-item-date">Přidáno: {v.created_at}</div>
                    )}
                  </div>
                  <form action={removeGirlVideo}>
                    <input type="hidden" name="video_id" value={v.id} />
                    <input type="hidden" name="girl_id" value={gId} />
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
