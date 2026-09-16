import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getGirlById } from '@/lib/queries';
import { db } from '@/lib/db';
import { photoUrl } from '@/lib/photoUrl';
import { generateLinkToken } from '@/lib/telegram';
import { updateGirlCredentials } from '@/lib/admin-actions';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminGirlDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const girlId = Number(id);
  const girl = await getGirlById(girlId);
  if (!girl) notFound();

  const name = String(girl.name);
  const slug = String(girl.slug);
  const age = Number(girl.age);
  const status = String(girl.status);

  // Fetch primary photo from girl_photos table
  const photoResult = await db.execute({
    sql: `SELECT url FROM girl_photos WHERE girl_id = ? AND is_primary = 1 LIMIT 1`,
    args: [girlId],
  });
  const primaryPhoto = photoResult.rows[0]?.url
    ? photoUrl(String(photoResult.rows[0].url), 200)
    : (girl.og_image ? String(girl.og_image) : null);

  // Google Calendar status
  const calendarUrl = girl.calendar_embed_url ? String(girl.calendar_embed_url) : null;
  const location = girl.location ? String(girl.location) : null;
  const height = girl.height ? Number(girl.height) : null;
  const weight = girl.weight ? Number(girl.weight) : null;
  const bust = girl.bust ? Number(girl.bust) : null;
  const rating = girl.rating ? Number(girl.rating) : null;
  const reviewsCount = Number(girl.reviews_count ?? 0);
  const bookingsCount = Number(girl.bookings_count ?? 0);
  const createdAt = girl.created_at ? String(girl.created_at) : null;
  const updatedAt = girl.updated_at ? String(girl.updated_at) : null;
  const isNew = Boolean(girl.is_new);
  const isTop = Boolean(girl.is_top);
  const isFeatured = Boolean(girl.is_featured);
  const verified = Boolean(girl.verified);

  // Telegram link status
  const telegramLink = await db.execute({
    sql: `SELECT chat_id, is_active, linked_at, username FROM telegram_links WHERE girl_id = ? LIMIT 1`,
    args: [girlId],
  });
  const tgRow = telegramLink.rows[0];
  const tgLinked = tgRow && Number(tgRow.is_active) === 1 && tgRow.chat_id && String(tgRow.chat_id) !== '';
  const tgChatId = tgLinked ? String(tgRow.chat_id) : null;
  const tgLinkedAt = tgRow?.linked_at ? String(tgRow.linked_at) : null;
  const tgUsername = tgRow?.username ? String(tgRow.username) : null;

  // Deterministic deep-link URL (HMAC token — always the same for the same girlId)
  const tgToken = generateLinkToken(girlId);
  const tgActivationUrl = `https://t.me/studioflow3_bot?start=GIRL_${tgToken}`;

  // User account (login credentials)
  const userResult = await db.execute({
    sql: `SELECT id, email, display_name, telegram_chat_id FROM users WHERE girl_id = ? AND is_active = 1 LIMIT 1`,
    args: [girlId],
  });
  const userRow = userResult.rows[0];
  const userEmail = userRow?.email ? String(userRow.email) : null;

  const fields = [
    { label: 'ID', value: String(girl.id) },
    { label: 'Slug', value: slug },
    { label: 'Status', value: status },
    { label: 'Vek', value: `${age} let` },
    { label: 'Lokalita', value: location ?? '\u2014' },
    { label: 'Vyska', value: height ? `${height} cm` : '\u2014' },
    { label: 'Vaha', value: weight ? `${weight} kg` : '\u2014' },
    { label: 'Postava', value: bust ? `${bust}` : '\u2014' },
    { label: 'Hodnoceni', value: rating ? rating.toFixed(1) : '\u2014' },
    { label: 'Pocet recenzi', value: String(reviewsCount) },
    { label: 'Pocet rezervaci', value: String(bookingsCount) },
    { label: 'Nova', value: isNew ? 'Ano' : 'Ne' },
    { label: 'Top', value: isTop ? 'Ano' : 'Ne' },
    { label: 'Featured', value: isFeatured ? 'Ano' : 'Ne' },
    { label: 'Verified', value: verified ? 'Ano' : 'Ne' },
    { label: 'Google Kalendar', value: calendarUrl ? 'Nastaven' : 'Nenastaveno' },
    { label: 'Vytvoreno', value: createdAt ? new Date(createdAt).toLocaleString('cs-CZ') : '\u2014' },
    { label: 'Upraveno', value: updatedAt ? new Date(updatedAt).toLocaleString('cs-CZ') : '\u2014' },
  ];

  const cardStyle = { background: 'var(--color-bg-card)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px', marginBottom: '20px' };
  const sectionTitle = { fontSize: '12px', color: 'var(--color-coral)', fontWeight: 600 as const, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' };
  const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' as const };

  return (
    <>
      <AdminTopbar title={name} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/divky`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          \u2190 Zpet na seznam divek
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px', alignItems: 'start' }}>
        <div>
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={name}
              style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', aspectRatio: '3/4' }}
            />
          ) : (
            <div style={{
              width: '100%',
              aspectRatio: '3/4',
              background: 'var(--color-bg-elev)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '13px',
            }}>
              Bez fotky
            </div>
          )}
        </div>

        <div>
          {/* Telegram propojeni */}
          <div style={cardStyle}>
            <div style={sectionTitle}>
              Telegram
            </div>
            {tgLinked ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>Propojeno</span>
                  {tgUsername && (
                    <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
                      @{tgUsername}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                  Chat ID: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{tgChatId}</code>
                </div>
                {tgLinkedAt && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                    Propojeno: {new Date(tgLinkedAt).toLocaleString('cs-CZ')}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '8px' }}>
                  Divka dostava notifikace o novych rezervacich pres Telegram.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                  Nepropojeno — divka nedostava Telegram notifikace.
                </div>
                <div style={{
                  background: 'var(--color-bg-elev)',
                  border: '1px solid var(--color-line)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
                    Poslete tento odkaz divce (WA/SMS):
                  </div>
                  <code style={{
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    background: 'var(--color-bg)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    display: 'block',
                  }}>
                    {tgActivationUrl}
                  </code>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
                  Po kliknuti se divce v Telegramu propoji ucet a zacne dostavat notifikace.
                </div>
              </div>
            )}
          </div>

          {/* Prihlasovaci udaje */}
          <div style={cardStyle}>
            <div style={sectionTitle}>
              Prihlasovaci udaje (Studio)
            </div>
            <form action={updateGirlCredentials}>
              <input type="hidden" name="girl_id" value={girlId} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-coral)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={userEmail ?? ''}
                    placeholder={`${slug}@studio.lovelygirls.cz`}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-coral)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
                    Nove heslo
                  </label>
                  <input
                    type="text"
                    name="password"
                    placeholder={userRow ? 'Ponechte prazdne pro zachovani' : 'Studio2026!'}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                    {userRow ? 'Vyplnte pouze pokud chcete zmenit heslo' : 'Novy ucet — vychozi heslo Studio2026!'}
                  </div>
                </div>
                <button type="submit" className="admin-btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {userRow ? 'Ulozit' : 'Vytvorit ucet'}
                </button>
              </div>
            </form>
          </div>

          {/* Data profilu */}
          <div style={cardStyle}>
            <div style={sectionTitle}>
              Data profilu
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px' }}>
              {fields.map(({ label, value }) => (
                <>
                  <dt key={`dt-${label}`} style={{ fontSize: '12px', color: 'var(--color-text-dim)', fontWeight: 500 }}>{label}</dt>
                  <dd key={`dd-${label}`} style={{ fontSize: '13px', color: 'var(--color-text)' }}>{value}</dd>
                </>
              ))}
            </dl>
          </div>

          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '20px' }}>
            <div style={sectionTitle}>
              Akce
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href={`/${locale}/admin/divky/${girlId}/edit`} className="admin-btn-primary">Editovat profil</a>
              <a href={`/${locale}/admin/divky/${girlId}/dostupnost`} className="admin-btn-primary">Rozvrh dostupnosti</a>
              <a href={`/${locale}/admin/divky/${girlId}/fotky`} className="admin-btn-primary">Fotky</a>
              <a href={`/${locale}/profil/${slug}`} target="_blank" className="admin-btn-secondary">
                Zobrazit profil \u2197
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
