import { setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { photoUrl } from '@/lib/photoUrl';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}

const MOODS = [
  { value: 'wow', emoji: '🤩' },
  { value: 'hot', emoji: '🔥' },
  { value: 'magic', emoji: '✨' },
  { value: 'sweet', emoji: '🌹' },
  { value: 'fun', emoji: '💫' },
  { value: 'classy', emoji: '👑' },
];

interface Vibe { value: string; cs: string; en: string; de: string; uk: string }
const VIBES: Vibe[] = [
  { value: 'sexy', cs: 'Sexy', en: 'Sexy', de: 'Sexy', uk: 'Сексі' },
  { value: 'passionate', cs: 'Vášnivá', en: 'Passionate', de: 'Leidenschaftlich', uk: 'Пристрасна' },
  { value: 'gentle', cs: 'Něžná', en: 'Gentle', de: 'Sanft', uk: 'Ніжна' },
  { value: 'pro', cs: 'Profi', en: 'Pro', de: 'Profi', uk: 'Профі' },
  { value: 'funny', cs: 'Vtipná', en: 'Funny', de: 'Witzig', uk: 'Дотепна' },
  { value: 'discreet', cs: 'Diskrétní', en: 'Discreet', de: 'Diskret', uk: 'Дискретна' },
  { value: 'natural', cs: 'Přirozená', en: 'Natural', de: 'Natürlich', uk: 'Природна' },
  { value: 'open', cs: 'Otevřená', en: 'Open', de: 'Offen', uk: 'Відкрита' },
];

async function submitReview(formData: FormData) {
  'use server';
  const slug = String(formData.get('girl_slug') ?? '');
  const ratingOverall = Math.min(5, Math.max(1, Number(formData.get('rating') ?? 0)));
  const text = String(formData.get('text') ?? '').trim();
  const nickname = String(formData.get('nickname') ?? '').trim();
  const mood = String(formData.get('mood') ?? '').trim() || null;
  const recommends = formData.get('recommends') === 'no' ? 0 : 1;
  const vibesArr = formData.getAll('vibes').map(String).filter(Boolean).slice(0, 5);
  const vibesJson = vibesArr.length > 0 ? JSON.stringify(vibesArr) : null;

  if (!slug || !text || !nickname || ratingOverall < 1 || text.length < 10) {
    redirect(`/recenze/nova/${slug}?error=invalid`);
  }

  try {
    const girlRes = await db.execute({
      sql: `SELECT id FROM girls WHERE slug = ? LIMIT 1`,
      args: [slug],
    });
    if (girlRes.rows.length === 0) {
      redirect(`/recenze/nova/${slug}?error=girl_not_found`);
    }
    const girlId = Number(girlRes.rows[0].id);

    // Try full insert; fall back to minimal columns if extra columns don't exist
    try {
      await db.execute({
        sql: `INSERT INTO reviews (girl_id, rating, content, author_name, status, mood, vibe_tags, recommends)
              VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
        args: [girlId, ratingOverall, text, nickname, mood, vibesJson, recommends],
      });
    } catch (e) {
      console.error('[review] full insert failed, retry minimal', e);
      await db.execute({
        sql: `INSERT INTO reviews (girl_id, rating, content, author_name, status)
              VALUES (?, ?, ?, ?, 'pending')`,
        args: [girlId, ratingOverall, text, nickname],
      });
    }

    // Rating recalc happens when admin approves the review (admin-actions.ts)
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw err;
    console.error('[review] submit failed', err);
    redirect(`/recenze/nova/${slug}?error=server`);
  }

  redirect(`/recenze/nova/${slug}?sent=1`);
}

export default async function RecenzeNovaPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const girlRes = await db.execute({
    sql: `SELECT g.id, g.name, g.age, g.location,
            (SELECT url FROM girl_photos WHERE girl_id=g.id AND is_primary=1 LIMIT 1) as photo
          FROM girls g WHERE g.slug = ? LIMIT 1`,
    args: [slug],
  });
  if (girlRes.rows.length === 0) notFound();

  const girl = girlRes.rows[0] as Record<string, unknown>;
  const girlName = String(girl.name ?? '');
  const girlPhoto = girl.photo ? photoUrl(String(girl.photo)) : null;
  const sent = sp.sent === '1';
  const hasError = !!sp.error;

  const T =
    locale === 'cs' ? {
      eyebrow: 'Anonymní recenze pro',
      tagline: 'Rychle a diskrétně — stačí 20 vteřin',
      rating: 'Hodnocení',
      mood: 'Pocit',
      vibe: 'Pár slov o ní',
      vibeHint: '(volitelné)',
      text: 'Krátký dojem',
      textPh: 'Tvojí slovy — co tě překvapilo?',
      nickname: 'Podpis',
      nicknamePh: 'Jak se podepíšeš',
      submit: '✓ Odeslat',
      thanks: 'Děkujeme',
      sentMsg: 'Recenze čeká na schválení.',
      back: '← Zpět na profil',
      error: 'Doplň hodnocení, krátký text a podpis.',
      recommend: 'Doporučíš?',
      yes: 'Ano',
      no: 'Ne',
    } : locale === 'de' ? {
      eyebrow: 'Anonyme Bewertung für',
      tagline: 'Schnell und diskret — 20 Sekunden reicht',
      rating: 'Bewertung',
      mood: 'Gefühl',
      vibe: 'Ein paar Worte',
      vibeHint: '(optional)',
      text: 'Kurzer Eindruck',
      textPh: 'In deinen Worten — was hat dich überrascht?',
      nickname: 'Signatur',
      nicknamePh: 'Wie unterschreibst du',
      submit: '✓ Senden',
      thanks: 'Danke',
      sentMsg: 'Bewertung wartet auf Freigabe.',
      back: '← Zurück',
      error: 'Bewertung, Text und Signatur ausfüllen.',
      recommend: 'Empfehlen?',
      yes: 'Ja',
      no: 'Nein',
    } : locale === 'uk' ? {
      eyebrow: 'Анонімний відгук для',
      tagline: 'Швидко і дискретно — 20 секунд',
      rating: 'Оцінка',
      mood: 'Відчуття',
      vibe: 'Кілька слів',
      vibeHint: '(необов\'язково)',
      text: 'Короткий відгук',
      textPh: 'Своїми словами — що тебе здивувало?',
      nickname: 'Підпис',
      nicknamePh: 'Як підпишеш',
      submit: '✓ Надіслати',
      thanks: 'Дякуємо',
      sentMsg: 'Відгук очікує на схвалення.',
      back: '← Назад',
      error: 'Заповни оцінку, текст і підпис.',
      recommend: 'Рекомендуєш?',
      yes: 'Так',
      no: 'Ні',
    } : {
      eyebrow: 'Anonymous review for',
      tagline: 'Quick and discreet — 20 seconds is enough',
      rating: 'Rating',
      mood: 'Feeling',
      vibe: 'A few words',
      vibeHint: '(optional)',
      text: 'Short impression',
      textPh: 'In your words — what surprised you?',
      nickname: 'Signature',
      nicknamePh: 'How you sign',
      submit: '✓ Submit',
      thanks: 'Thanks',
      sentMsg: 'Review is awaiting approval.',
      back: '← Back to profile',
      error: 'Fill rating, text and signature.',
      recommend: 'Recommend?',
      yes: 'Yes',
      no: 'No',
    };

  if (sent) {
    return (
      <main className="qr-page">
        {girlPhoto && <div className="qr-bg" style={{ backgroundImage: `url(${girlPhoto})` }} />}
        <div className="qr-veil" />
        <div className="qr-shell">
          <div className="qr-success">
            <div className="qr-success-icon">✓</div>
            <h1 className="qr-success-h1">{T.thanks}</h1>
            <p className="qr-success-text">{T.sentMsg}</p>
            <Link href={`/${locale}/profil/${slug}`} className="qr-submit">
              {T.back}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="qr-page">
      {girlPhoto && <div className="qr-bg" style={{ backgroundImage: `url(${girlPhoto})` }} />}
      <div className="qr-veil" />

      <div className="qr-shell">
        <form action={submitReview} className="qr-card">
          <input type="hidden" name="girl_slug" value={slug} />

          {/* Header */}
          <div className="qr-head">
            {girlPhoto && (
              <div className="qr-avatar">
                <img src={girlPhoto} alt={girlName} />
              </div>
            )}
            <div className="qr-head-text">
              <div className="qr-eyebrow">{T.eyebrow}</div>
              <h1 className="qr-h1">{girlName}</h1>
              <div className="qr-tagline">{T.tagline}</div>
            </div>
          </div>

          {hasError && <div className="qr-error">⚠ {T.error}</div>}

          {/* Rating + Mood in one row */}
          <div className="qr-row-2">
            <div className="qr-field">
              <label className="qr-label">{T.rating} <span className="qr-req">*</span></label>
              <div className="qr-stars">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="qr-star">
                    <input type="radio" name="rating" value={n} required />
                    <span>★</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="qr-field">
              <label className="qr-label">{T.mood}</label>
              <div className="qr-moods">
                {MOODS.map((m) => (
                  <label key={m.value} className="qr-mood">
                    <input type="radio" name="mood" value={m.value} />
                    <span className="qr-mood-btn">{m.emoji}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Vibe chips */}
          <div className="qr-field">
            <label className="qr-label">{T.vibe} <span className="qr-label-hint">{T.vibeHint}</span></label>
            <div className="qr-vibes">
              {VIBES.map((v) => (
                <label key={v.value} className="qr-vibe">
                  <input type="checkbox" name="vibes" value={v.value} />
                  <span className="qr-vibe-chip">{v[locale as 'cs' | 'en' | 'de' | 'uk']}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className="qr-field">
            <label className="qr-label">{T.text} <span className="qr-req">*</span></label>
            <textarea
              name="text"
              required
              minLength={10}
              maxLength={2000}
              rows={3}
              placeholder={T.textPh}
              className="qr-textarea"
            />
          </div>

          {/* Bottom row: nickname + recommend + submit */}
          <div className="qr-bottom">
            <input
              name="nickname"
              type="text"
              required
              maxLength={50}
              placeholder={T.nicknamePh}
              className="qr-input"
              aria-label={T.nickname}
            />
            <div className="qr-rec">
              <label className="qr-rec-opt">
                <input type="radio" name="recommends" value="yes" defaultChecked />
                <span className="qr-rec-chip qr-rec-yes">👍</span>
              </label>
              <label className="qr-rec-opt">
                <input type="radio" name="recommends" value="no" />
                <span className="qr-rec-chip qr-rec-no">👎</span>
              </label>
            </div>
            <button type="submit" className="qr-submit">{T.submit}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
