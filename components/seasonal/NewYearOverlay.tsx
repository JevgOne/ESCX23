/**
 * New Year's Eve seasonal integration — renders only when newyear theme is active.
 * Fireworks, champagne, confetti, gold/silver atmosphere.
 * Server Component — zero JS shipped to client.
 */

import { getActiveTheme } from '@/lib/seasonal';

const NEWYEAR_CSS = `
/* ── Page — deep midnight blue ── */
body[data-season="newyear"] {
  background-color: #060818;
}

/* ── Vignette — midnight edges ── */
body[data-season="newyear"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 39;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(4,4,20,0.12) 55%, rgba(2,2,14,0.3) 85%, rgba(1,1,8,0.45) 100%),
    linear-gradient(to top, rgba(8,6,25,0.2) 0%, transparent 20%);
}

/* ── Header — gold accent line ── */
body[data-season="newyear"] header.header {
  border-bottom: none;
  background: rgba(8,8,20,0.95);
}
body[data-season="newyear"] header.header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 1;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255,215,0,0.3) 15%,
    rgba(255,215,0,0.6) 30%,
    rgba(255,240,150,0.8) 50%,
    rgba(255,215,0,0.6) 70%,
    rgba(255,215,0,0.3) 85%,
    transparent 100%);
  animation: ny-header-shimmer 3s ease-in-out infinite;
}

@keyframes ny-header-shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ── Footer — midnight gold ── */
body[data-season="newyear"] footer {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255,215,0,0.04), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(192,192,255,0.03), transparent 50%),
    linear-gradient(180deg, var(--color-bg-soft, #08081a) 0%, #040410 100%);
}
body[data-season="newyear"] footer::before {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255,215,0,0.2) 30%,
    rgba(255,240,180,0.3) 50%,
    rgba(255,215,0,0.2) 70%,
    transparent 100%);
}

body[data-season="newyear"] .footer-trust {
  background: linear-gradient(135deg, rgba(255,215,0,0.03) 0%, rgba(192,192,255,0.02) 50%, rgba(255,215,0,0.02) 100%);
  border-color: rgba(255,215,0,0.1);
}

/* ── Girl cards — gold hover ── */
body[data-season="newyear"] .girl-card:hover {
  border-color: rgba(255,215,0,0.35);
  box-shadow: 0 4px 20px rgba(255,215,0,0.08), 0 0 40px rgba(192,192,255,0.04);
}

/* ── Confetti fall ── */
@keyframes ny-confetti-fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
}
@keyframes ny-confetti-drift {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.9; }
  50% { transform: translateY(50vh) translateX(-15px) rotate(360deg); }
  90% { opacity: 0.7; }
  100% { transform: translateY(105vh) translateX(10px) rotate(720deg); opacity: 0; }
}
@keyframes ny-confetti-sway {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(50vh) translateX(20px) rotate(360deg); }
  90% { opacity: 0.6; }
  100% { transform: translateY(105vh) translateX(-8px) rotate(540deg); opacity: 0; }
}

/* ── Champagne glow ── */
@keyframes ny-champagne-glow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(255,215,0,0.3)) drop-shadow(0 0 20px rgba(255,240,180,0.15));
  }
  50% {
    filter: drop-shadow(0 0 18px rgba(255,215,0,0.5)) drop-shadow(0 0 35px rgba(255,240,180,0.25));
  }
}

/* ── Confetti popper pop ── */
@keyframes ny-popper-pop {
  0%, 85% { transform: scale(1) rotate(0deg); }
  90% { transform: scale(1.3) rotate(-8deg); }
  95% { transform: scale(0.9) rotate(4deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* ── Champagne clink ── */
@keyframes ny-clink {
  0%, 70% { transform: rotate(0deg); }
  75% { transform: rotate(-12deg); }
  80% { transform: rotate(8deg); }
  85% { transform: rotate(-5deg); }
  90% { transform: rotate(3deg); }
  95%, 100% { transform: rotate(0deg); }
}

/* ── Sparkle twinkle ── */
@keyframes ny-sparkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .ny-champagne { font-size: 60px !important; bottom: 90px !important; right: 8px !important; }
  .ny-popper { font-size: 50px !important; bottom: 90px !important; left: 8px !important; }
  .ny-confetti { font-size: 10px !important; }
  .ny-sparkle-deco { font-size: 14px !important; }
}
`;

export default async function NewYearOverlay() {
  const theme = await getActiveTheme();
  if (theme !== 'newyear') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NEWYEAR_CSS }} />

      {/* BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, transparent 5%, rgba(255,215,0,0.06) 20%, rgba(255,240,180,0.08) 40%, rgba(192,192,255,0.06) 60%, rgba(255,215,0,0.06) 80%, transparent 95%)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        padding: '7px 24px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#d4a833',
        letterSpacing: 2,
      }}>
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x2728;</span>
        {' '}Happy New Year{' '}
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x2728;</span>
      </div>

      {/* FIXED DECORATIONS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40 }} aria-hidden="true">

        {/* ── Champagne — bottom-right ── */}
        <div className="ny-champagne" style={{
          position: 'absolute',
          bottom: 6,
          right: 14,
          fontSize: 80,
          lineHeight: 1,
          pointerEvents: 'none',
          animation: 'ny-champagne-glow 4s ease-in-out infinite, ny-clink 5s ease-in-out infinite',
        }}>&#x1F942;</div>

        {/* ── Confetti popper — bottom-left ── */}
        <div className="ny-popper" style={{
          position: 'absolute',
          bottom: 6,
          left: 18,
          fontSize: 70,
          lineHeight: 1,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.3))',
          animation: 'ny-popper-pop 6s ease-in-out infinite',
        }}>&#x1F389;</div>

        {/* ── Falling confetti — gold/silver dots ── */}
        {[
          { left: '4%',  size: 20, dur: 10, delay: 0,   anim: 'ny-confetti-fall',  color: 'rgba(255,215,0,0.9)' },
          { left: '12%', size: 16, dur: 13, delay: 1.5, anim: 'ny-confetti-drift', color: 'rgba(192,192,255,0.85)' },
          { left: '20%', size: 18, dur: 11, delay: 0.5, anim: 'ny-confetti-sway',  color: 'rgba(255,215,0,0.85)' },
          { left: '28%', size: 14, dur: 14, delay: 3,   anim: 'ny-confetti-fall',  color: 'rgba(255,240,180,0.9)' },
          { left: '36%', size: 16, dur: 12, delay: 2,   anim: 'ny-confetti-drift', color: 'rgba(192,192,255,0.8)' },
          { left: '44%', size: 20, dur: 11, delay: 4,   anim: 'ny-confetti-sway',  color: 'rgba(255,215,0,0.9)' },
          { left: '52%', size: 14, dur: 13, delay: 1,   anim: 'ny-confetti-fall',  color: 'rgba(255,240,180,0.85)' },
          { left: '60%', size: 18, dur: 12, delay: 3.5, anim: 'ny-confetti-drift', color: 'rgba(255,215,0,0.85)' },
          { left: '68%', size: 16, dur: 14, delay: 0.8, anim: 'ny-confetti-sway',  color: 'rgba(192,192,255,0.9)' },
          { left: '76%', size: 20, dur: 11, delay: 5,   anim: 'ny-confetti-fall',  color: 'rgba(255,215,0,0.9)' },
          { left: '84%', size: 14, dur: 13, delay: 2.5, anim: 'ny-confetti-drift', color: 'rgba(255,240,180,0.85)' },
          { left: '92%', size: 16, dur: 12, delay: 6,   anim: 'ny-confetti-sway',  color: 'rgba(192,192,255,0.8)' },
          { left: '8%',  size: 12, dur: 15, delay: 7,   anim: 'ny-confetti-fall',  color: 'rgba(255,215,0,0.8)' },
          { left: '48%', size: 12, dur: 16, delay: 8,   anim: 'ny-confetti-drift', color: 'rgba(255,240,180,0.8)' },
          { left: '72%', size: 12, dur: 14, delay: 9,   anim: 'ny-confetti-sway',  color: 'rgba(255,215,0,0.8)' },
        ].map((c, i) => (
          <div key={`cf-${i}`} className="ny-confetti" style={{
            position: 'absolute',
            left: c.left,
            top: 0,
            fontSize: c.size,
            lineHeight: 1,
            opacity: 0,
            pointerEvents: 'none',
            animation: `${c.anim} ${c.dur}s linear infinite ${c.delay}s`,
            color: c.color,
          }}>&#x2728;</div>
        ))}

        {/* ── Static sparkles — scattered ── */}
        {[
          { left: '20%', top: '25%', size: 16, delay: 0 },
          { left: '70%', top: '35%', size: 14, delay: 1.2 },
          { left: '50%', top: '20%', size: 12, delay: 0.6 },
          { left: '85%', top: '45%', size: 10, delay: 1.8 },
          { left: '10%', top: '55%', size: 11, delay: 0.3 },
        ].map((s, i) => (
          <div key={`sp-${i}`} className="ny-sparkle-deco" style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            fontSize: s.size,
            lineHeight: 1,
            pointerEvents: 'none',
            animation: `ny-sparkle 2.5s ease-in-out infinite ${s.delay}s`,
            color: 'rgba(255,240,180,0.6)',
          }}>&#x2B50;</div>
        ))}

      </div>
    </>
  );
}
