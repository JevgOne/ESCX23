import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { getApplicationById, type ApplicationRow } from '@/lib/queries';
import { rejectApplication, reopenApplication, updateApplicationNotes, createGirlFromApplication } from '@/lib/admin-actions';
import { getExtraServices } from '@/lib/services';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABEL: Record<string, { bg: string; fg: string; label: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.18)', fg: '#f59e0b', label: 'Čekající na schválení' },
  approved: { bg: 'rgba(34,197,94,0.18)',  fg: '#22c55e', label: 'Schváleno' },
  rejected: { bg: 'rgba(239,68,68,0.18)',  fg: '#ef4444', label: 'Zamítnuto' },
};

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminAplikaceDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const appId = Number(id);
  if (!appId) notFound();

  const app = await getApplicationById(appId);
  if (!app) notFound();

  const status = STATUS_LABEL[app.status] ?? STATUS_LABEL.pending;
  const slugs = app.services ? app.services.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const extraServices = getExtraServices();
  const selectedServices = slugs
    .map((slug) => extraServices.find((s) => s.id === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <AdminTopbar title={`Aplikace: ${app.name}`} />

      <style dangerouslySetInnerHTML={{ __html: `
        .apd-wrap { max-width: 960px; }
        .apd-back { color: rgba(255,255,255,0.5); font-size: 13px; text-decoration: none; }
        .apd-back:hover { color: #fff; }
        .apd-status-row {
          display: flex; align-items: center; gap: 16px;
          margin: 12px 0 28px;
        }
        .apd-status-pill {
          display: inline-block; padding: 6px 14px;
          border-radius: 999px; font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .apd-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 22px 24px;
          margin-bottom: 20px;
        }
        .apd-card h3 {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--color-coral);
          margin: 0 0 16px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .apd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .apd-field { display: flex; flex-direction: column; gap: 4px; }
        .apd-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          color: rgba(255,255,255,0.45); text-transform: uppercase;
        }
        .apd-value { font-size: 14px; color: var(--color-text); }
        .apd-value.empty { color: rgba(255,255,255,0.25); font-style: italic; }
        .apd-bio { white-space: pre-wrap; line-height: 1.55; }
        .apd-services { display: flex; flex-wrap: wrap; gap: 8px; }
        .apd-service-chip {
          padding: 6px 12px;
          background: rgba(242,125,141,0.12);
          border: 1px solid rgba(242,125,141,0.35);
          border-radius: 8px;
          font-size: 13px;
          color: #fff;
        }
        .apd-actions {
          display: flex; gap: 12px; flex-wrap: wrap;
          padding: 22px 24px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
        }
        .apd-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 18px;
          font-size: 13px; font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          border: none;
          transition: all 0.15s;
        }
        .apd-btn-approve {
          background: linear-gradient(135deg, #22c55e, #15803d);
          color: #fff;
        }
        .apd-btn-approve:hover { opacity: 0.9; transform: translateY(-1px); }
        .apd-btn-reject {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.35);
        }
        .apd-btn-reject:hover { background: rgba(239,68,68,0.25); }
        .apd-btn-reopen {
          background: rgba(255,255,255,0.05);
          color: var(--color-text);
          border: 1px solid rgba(255,255,255,0.15);
        }
        .apd-btn-reopen:hover { background: rgba(255,255,255,0.1); }
        .apd-btn-view-girl {
          background: rgba(242,125,141,0.15);
          color: #f27d8d;
          border: 1px solid rgba(242,125,141,0.4);
        }
        .apd-reject-form {
          margin-top: 14px;
          padding: 14px 16px;
          background: rgba(239,68,68,0.05);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px;
        }
        .apd-reject-form textarea {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .apd-notes-form textarea {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .apd-notes-form button {
          padding: 8px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }
        .apd-rejection-reason {
          padding: 12px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          font-size: 13px;
          color: #fca5a5;
          margin-top: 8px;
        }
      `}} />

      <div className="apd-wrap">
        <a href="/cs/admin/aplikace" className="apd-back">← Zpět na seznam</a>

        <div className="apd-status-row">
          <span
            className="apd-status-pill"
            style={{ background: status.bg, color: status.fg }}
          >
            {status.label}
          </span>
          {app.created_at && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
              Přijato {relativeTime(app.created_at)}
            </span>
          )}
        </div>

        {app.status === 'rejected' && app.rejection_reason && (
          <div className="apd-rejection-reason">
            <strong>Důvod zamítnutí:</strong> {app.rejection_reason}
          </div>
        )}

        {app.status === 'approved' && app.converted_to_girl_id && (
          <div style={{ marginBottom: 20 }}>
            <a href={`/cs/admin/divky/${app.converted_to_girl_id}/edit`} className="apd-btn apd-btn-view-girl">
              ✓ Vytvořený profil dívky #{app.converted_to_girl_id} →
            </a>
          </div>
        )}

        <FieldsCard app={app} />
        <BioCard app={app} />
        <ServicesCard slugs={selectedServices.map((s) => ({ id: s.id, name: s.translations[locale as 'cs'|'en'|'de'|'uk'] ?? s.translations.cs }))} />
        <AvailabilityCard app={app} />
        <NotesCard app={app} />
        <ActionsCard app={app} />
      </div>
    </>
  );
}

function field(label: string, value: string | number | null | undefined, fmt?: (v: string | number) => string) {
  const hasValue = value !== null && value !== undefined && value !== '';
  return (
    <div className="apd-field">
      <span className="apd-label">{label}</span>
      <span className={`apd-value${hasValue ? '' : ' empty'}`}>
        {hasValue ? (fmt ? fmt(value as string | number) : String(value)) : '— nevyplněno —'}
      </span>
    </div>
  );
}

function FieldsCard({ app }: { app: ApplicationRow }) {
  const bustNaturalLabel = app.bust_natural === 1 ? 'Přírodní'
    : app.bust_natural === 0 ? 'Implantát'
    : null;

  return (
    <div className="apd-card">
      <h3>Údaje od žadatelky</h3>
      <div className="apd-grid">
        {field('Jméno', app.name)}
        {field('Věk', app.age)}
        {field('Výška', app.height, (v) => `${v} cm`)}
        {field('Váha', app.weight, (v) => `${v} kg`)}
        {field('Prsa', app.bust)}
        {field('Typ prsou', bustNaturalLabel)}
        {field('Vlasy', app.hair)}
        {field('Oči', app.eyes)}
        {field('Tetování', app.tattoo === 1 ? `Ano${app.tattoo_description ? ` — ${app.tattoo_description}` : ''}` : 'Ne')}
        {field('Piercing', app.piercing === 1 ? 'Ano' : 'Ne')}
        {field('Telefon', app.phone)}
        {field('Email', app.email)}
        {field('Telegram', app.telegram)}
        {field('Jazyky', app.languages)}
        {field('Zkušenosti', app.experience)}
      </div>
    </div>
  );
}

function BioCard({ app }: { app: ApplicationRow }) {
  if (!app.bio_cs && !app.bio_en) return null;
  return (
    <div className="apd-card">
      <h3>Bio</h3>
      {app.bio_cs && (
        <div style={{ marginBottom: app.bio_en ? '18px' : 0 }}>
          <span className="apd-label">Česky</span>
          <p className="apd-value apd-bio" style={{ marginTop: 6 }}>{app.bio_cs}</p>
        </div>
      )}
      {app.bio_en && (
        <div>
          <span className="apd-label">Anglicky</span>
          <p className="apd-value apd-bio" style={{ marginTop: 6 }}>{app.bio_en}</p>
        </div>
      )}
    </div>
  );
}

function ServicesCard({ slugs }: { slugs: Array<{ id: string; name: string }> }) {
  if (slugs.length === 0) return null;
  return (
    <div className="apd-card">
      <h3>Extra služby ({slugs.length})</h3>
      <div className="apd-services">
        {slugs.map((s) => (
          <span key={s.id} className="apd-service-chip">{s.name}</span>
        ))}
      </div>
    </div>
  );
}

function AvailabilityCard({ app }: { app: ApplicationRow }) {
  if (!app.availability) return null;
  return (
    <div className="apd-card">
      <h3>Dostupnost</h3>
      <p className="apd-value apd-bio">{app.availability}</p>
    </div>
  );
}

function NotesCard({ app }: { app: ApplicationRow }) {
  return (
    <div className="apd-card">
      <h3>Interní poznámky (jen pro admin)</h3>
      <form action={updateApplicationNotes} className="apd-notes-form">
        <input type="hidden" name="id" value={app.id} />
        <textarea
          name="notes"
          rows={3}
          placeholder="Tvoje poznámky k aplikaci..."
          defaultValue={app.notes ?? ''}
        />
        <button type="submit">Uložit poznámky</button>
      </form>
    </div>
  );
}

function ActionsCard({ app }: { app: ApplicationRow }) {
  if (app.status === 'approved') {
    return (
      <div className="apd-actions">
        <form action={reopenApplication}>
          <input type="hidden" name="id" value={app.id} />
          <button type="submit" className="apd-btn apd-btn-reopen">
            ↺ Vrátit do čekajících
          </button>
        </form>
      </div>
    );
  }
  if (app.status === 'rejected') {
    return (
      <div className="apd-actions">
        <form action={reopenApplication}>
          <input type="hidden" name="id" value={app.id} />
          <button type="submit" className="apd-btn apd-btn-reopen">
            ↺ Vrátit do čekajících
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="apd-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <form action={createGirlFromApplication} style={{ display: 'inline-flex' }}>
          <input type="hidden" name="application_id" value={app.id} />
          <button type="submit" className="apd-btn apd-btn-approve">
            ✓ Přidat jako dívku
          </button>
        </form>
        <details style={{ flex: 1, minWidth: 0 }}>
          <summary className="apd-btn apd-btn-reject" style={{ listStyle: 'none' }}>
            ✕ Zamítnout
          </summary>
          <form action={rejectApplication} className="apd-reject-form">
            <input type="hidden" name="id" value={app.id} />
            <label className="apd-label" htmlFor="rejection_reason" style={{ display: 'block', marginBottom: 6 }}>
              Důvod (nepovinné, žadatelka ho nevidí)
            </label>
            <textarea
              id="rejection_reason"
              name="rejection_reason"
              rows={3}
              placeholder="Např. nesplňuje minimální věk, špatné fotky..."
            />
            <button type="submit" className="apd-btn apd-btn-reject">
              Potvrdit zamítnutí
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
