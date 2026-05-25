import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { uploadOgImage, deleteOgImage } from '@/lib/og-images';
import { OG_PAGE_KEYS } from '@/lib/og-keys';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminOgPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await db.execute(
    `SELECT page_key, url, uploaded_at FROM og_images`
  );
  const existing: Record<string, { url: string; uploaded_at: string }> = {};
  for (const r of result.rows) {
    existing[String(r.page_key)] = {
      url: String(r.url),
      uploaded_at: String(r.uploaded_at),
    };
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .og2-intro { color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.65; max-width: 720px; margin: 0 0 24px; }
        .og2-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px; }
        .og2-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .og2-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .og2-title { font-size: 15px; font-weight: 700; color: #fff; margin: 0; }
        .og2-key { font-size: 11px; color: rgba(255,255,255,0.4); background: rgba(0,0,0,0.3); padding: 2px 7px; border-radius: 5px; font-family: monospace; }
        .og2-preview { aspect-ratio: 1200 / 630; background: rgba(0,0,0,0.4); border: 1px dashed rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .og2-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .og2-empty { display: flex; flex-direction: column; align-items: center; gap: 4px; color: rgba(255,255,255,0.4); font-size: 12.5px; }
        .og2-empty small { font-size: 10.5px; color: rgba(255,255,255,0.3); }
        .og2-upload { display: flex; gap: 8px; align-items: center; position: relative; }
        .og2-file { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .og2-file-label { flex: 1; padding: 9px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.78); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }
        .og2-file-label:hover { background: rgba(255,255,255,0.08); }
        .og2-up-btn { padding: 9px 18px; background: linear-gradient(135deg, #f27d8d, #c84b8b); border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
        .og2-up-btn:hover { transform: translateY(-1px); }
        .og2-del-row { display: flex; align-items: center; gap: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
        .og2-del-btn { padding: 6px 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; color: #fca5a5; font-size: 12px; font-weight: 600; cursor: pointer; }
        .og2-uploaded { font-size: 11px; color: rgba(255,255,255,0.4); margin-left: auto; }
      `}} />
      <AdminTopbar title="OG Images (sociální náhled)" />

      <div className="og2-intro-wrap">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
          Nahraj vlastní obrázek pro každou stránku — zobrazí se při sdílení na WhatsApp, Telegram, Facebook, X atd.
          Doporučená velikost: <strong>1200 × 630 px</strong>, max 5 MB, formáty JPG / PNG / WebP.
          Pokud žádný obrázek nenahraješ, použije se automaticky generovaný náhled.
        </p>
      </div>

      <div className="og2-grid">
        {OG_PAGE_KEYS.map((page) => {
          const current = existing[page.key];
          return (
            <div key={page.key} className="og2-card">
              <div className="og2-head">
                <h3 className="og2-title">{page.label}</h3>
                <code className="og2-key">{page.key}</code>
              </div>

              <div className="og2-preview">
                {current ? (
                  <img src={current.url} alt={page.label} />
                ) : (
                  <div className="og2-empty">
                    <span>Žádný vlastní obrázek</span>
                    <small>používá se auto-generated</small>
                  </div>
                )}
              </div>

              <form action={uploadOgImage} encType="multipart/form-data" className="og2-upload">
                <input type="hidden" name="page_key" value={page.key} />
                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="og2-file"
                  id={`file-${page.key}`}
                />
                <label htmlFor={`file-${page.key}`} className="og2-file-label">
                  📤 Vybrat soubor
                </label>
                <button type="submit" className="og2-up-btn">
                  Nahrát
                </button>
              </form>

              {current && (
                <form action={deleteOgImage} className="og2-del-row">
                  <input type="hidden" name="page_key" value={page.key} />
                  <button type="submit" className="og2-del-btn">
                    🗑 Smazat
                  </button>
                  <span className="og2-uploaded">
                    Nahráno {new Date(current.uploaded_at).toLocaleString('cs-CZ')}
                  </span>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
