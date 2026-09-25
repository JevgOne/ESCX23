/**
 * Valentine's Day seasonal integration — renders only when valentine theme is active.
 * Falling hearts, roses, romantic pink/red atmosphere.
 * Server Component — zero JS shipped to client.
 */

import { getActiveTheme } from '@/lib/seasonal';

const VALENTINE_CSS = `
/* ── Page — deep romantic dark ── */
body[data-season="valentine"] {
  background-color: #0c0610;
}

/* ── Vignette — warm pink edges ── */
body[data-season="valentine"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 39;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(12,4,10,0.12) 55%, rgba(8,2,6,0.3) 85%, rgba(4,1,3,0.45) 100%),
    linear-gradient(to top, rgba(20,5,15,0.2) 0%, transparent 20%);
}

/* ── Header — pink accent line ── */
body[data-season="valentine"] header.header {
  border-bottom: none;
  background: rgba(12,6,14,0.95);
}
body[data-season="valentine"] header.header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 1;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(220,60,100,0.3) 15%,
    rgba(220,60,100,0.6) 30%,
    rgba(255,100,140,0.8) 50%,
    rgba(220,60,100,0.6) 70%,
    rgba(220,60,100,0.3) 85%,
    transparent 100%);
  animation: val-header-glow 3s ease-in-out infinite;
}

@keyframes val-header-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ── Footer — romantic tones ── */
body[data-season="valentine"] footer {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(220,60,100,0.04), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(180,40,80,0.03), transparent 50%),
    linear-gradient(180deg, var(--color-bg-soft, #0c0614) 0%, #060410 100%);
}
body[data-season="valentine"] footer::before {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(220,60,100,0.2) 30%,
    rgba(255,100,140,0.3) 50%,
    rgba(220,60,100,0.2) 70%,
    transparent 100%);
}

body[data-season="valentine"] .footer-trust {
  background: linear-gradient(135deg, rgba(220,60,100,0.03) 0%, rgba(180,40,80,0.02) 50%, rgba(220,60,100,0.02) 100%);
  border-color: rgba(220,60,100,0.1);
}

/* ── Girl cards — pink hover ── */
body[data-season="valentine"] .girl-card:hover {
  border-color: rgba(220,60,100,0.4);
  box-shadow: 0 4px 20px rgba(220,60,100,0.1), 0 0 40px rgba(255,100,140,0.05);
}

/* ── Falling hearts ── */
@keyframes val-heart-fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(105vh) rotate(45deg); opacity: 0; }
}
@keyframes val-heart-drift {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.9; }
  50% { transform: translateY(50vh) translateX(-18px) rotate(-20deg); }
  90% { opacity: 0.7; }
  100% { transform: translateY(105vh) translateX(12px) rotate(30deg); opacity: 0; }
}
@keyframes val-heart-sway {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(50vh) translateX(22px) rotate(15deg); }
  90% { opacity: 0.6; }
  100% { transform: translateY(105vh) translateX(-10px) rotate(-25deg); opacity: 0; }
}

/* ── Rose glow ── */
@keyframes val-rose-glow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(220,60,100,0.3)) drop-shadow(0 0 20px rgba(255,100,140,0.15));
  }
  50% {
    filter: drop-shadow(0 0 18px rgba(220,60,100,0.5)) drop-shadow(0 0 35px rgba(255,100,140,0.25));
  }
}

/* ── Rose sway ── */
@keyframes val-rose-sway {
  0%, 70% { transform: rotate(0deg); }
  75% { transform: rotate(-6deg); }
  80% { transform: rotate(4deg); }
  85% { transform: rotate(-3deg); }
  90% { transform: rotate(1deg); }
  95%, 100% { transform: rotate(0deg); }
}

/* ── Heart pulse ── */
@keyframes val-heart-pulse {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.2); }
  30% { transform: scale(1); }
  45% { transform: scale(1.15); }
  60% { transform: scale(1); }
}

/* ── Sparkle ── */
@keyframes val-sparkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .val-rose { font-size: 60px !important; bottom: 90px !important; right: 8px !important; }
  .val-heart-big { font-size: 50px !important; bottom: 90px !important; left: 8px !important; }
  .val-heart { font-size: 10px !important; }
  .val-sparkle-deco { font-size: 12px !important; }
}
`;

const BANNER_TEXT: Record<string, string> = {
  cs: 'Šťastný Valentýn',
  en: 'Happy Valentine\'s Day',
  de: 'Frohen Valentinstag',
  uk: 'З Днем Валентина',
};

export default async function ValentineOverlay({ locale = 'cs' }: { locale?: string }) {
  const theme = await getActiveTheme();
  if (theme !== 'valentine') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: VALENTINE_CSS }} />

      {/* BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, transparent 5%, rgba(220,60,100,0.06) 20%, rgba(255,100,140,0.08) 40%, rgba(220,60,100,0.06) 60%, rgba(255,100,140,0.08) 80%, transparent 95%)',
        borderBottom: '1px solid rgba(220,60,100,0.15)',
        padding: '7px 24px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#dc3c64',
        letterSpacing: 2,
      }}>
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x1F495;</span>
        {' '}{BANNER_TEXT[locale] || BANNER_TEXT.en}{' '}
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x1F495;</span>
      </div>

      {/* FIXED DECORATIONS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40 }} aria-hidden="true">

        {/* ── Rose — bottom-right ── */}
        <div className="val-rose" style={{
          position: 'absolute',
          bottom: 6,
          right: 14,
          fontSize: 80,
          lineHeight: 1,
          pointerEvents: 'none',
          animation: 'val-rose-glow 4s ease-in-out infinite, val-rose-sway 7s ease-in-out infinite',
        }}>&#x1F339;</div>

        {/* ── Pulsing heart — bottom-left ── */}
        <div className="val-heart-big" style={{
          position: 'absolute',
          bottom: 6,
          left: 18,
          fontSize: 70,
          lineHeight: 1,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 12px rgba(220,60,100,0.4))',
          animation: 'val-heart-pulse 2s ease-in-out infinite',
        }}>&#x2764;&#xFE0F;</div>

        {/* ── Falling hearts ── */}
        {[
          { left: '5%',  size: 18, dur: 11, delay: 0,   anim: 'val-heart-fall',  color: 'rgba(220,60,100,0.7)' },
          { left: '14%', size: 14, dur: 15, delay: 2,   anim: 'val-heart-drift', color: 'rgba(255,100,140,0.6)' },
          { left: '22%', size: 16, dur: 12, delay: 0.8, anim: 'val-heart-sway',  color: 'rgba(220,60,100,0.65)' },
          { left: '32%', size: 12, dur: 17, delay: 4,   anim: 'val-heart-fall',  color: 'rgba(255,140,160,0.7)' },
          { left: '42%', size: 16, dur: 13, delay: 1.5, anim: 'val-heart-drift', color: 'rgba(220,60,100,0.6)' },
          { left: '52%', size: 18, dur: 11, delay: 3,   anim: 'val-heart-sway',  color: 'rgba(255,100,140,0.7)' },
          { left: '62%', size: 12, dur: 16, delay: 5,   anim: 'val-heart-fall',  color: 'rgba(220,60,100,0.55)' },
          { left: '72%', size: 16, dur: 12, delay: 2.5, anim: 'val-heart-drift', color: 'rgba(255,140,160,0.65)' },
          { left: '80%', size: 14, dur: 14, delay: 1,   anim: 'val-heart-sway',  color: 'rgba(220,60,100,0.7)' },
          { left: '90%', size: 18, dur: 13, delay: 6,   anim: 'val-heart-fall',  color: 'rgba(255,100,140,0.6)' },
          { left: '10%', size: 10, dur: 18, delay: 8,   anim: 'val-heart-drift', color: 'rgba(220,60,100,0.5)' },
          { left: '55%', size: 10, dur: 19, delay: 7,   anim: 'val-heart-sway',  color: 'rgba(255,140,160,0.5)' },
        ].map((h, i) => (
          <div key={`h-${i}`} className="val-heart" style={{
            position: 'absolute',
            left: h.left,
            top: 0,
            fontSize: h.size,
            lineHeight: 1,
            opacity: 0,
            pointerEvents: 'none',
            animation: `${h.anim} ${h.dur}s linear infinite ${h.delay}s`,
            color: h.color,
          }}>&#x2764;</div>
        ))}

        {/* ── Sparkles ── */}
        {[
          { left: '18%', top: '22%', size: 14, delay: 0 },
          { left: '65%', top: '30%', size: 12, delay: 1 },
          { left: '45%', top: '18%', size: 10, delay: 0.5 },
          { left: '82%', top: '40%', size: 11, delay: 1.5 },
          { left: '8%',  top: '50%', size: 10, delay: 0.8 },
        ].map((s, i) => (
          <div key={`sp-${i}`} className="val-sparkle-deco" style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            fontSize: s.size,
            lineHeight: 1,
            pointerEvents: 'none',
            animation: `val-sparkle 2.5s ease-in-out infinite ${s.delay}s`,
            color: 'rgba(255,140,160,0.6)',
          }}>&#x1F496;</div>
        ))}

      </div>
    </>
  );
}
