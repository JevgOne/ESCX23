/**
 * Easter seasonal integration — renders only when easter theme is active.
 * Bunny, easter eggs, falling petals, spring pastel atmosphere.
 * Server Component — zero JS shipped to client.
 */

import { getActiveTheme } from '@/lib/seasonal';

const EASTER_CSS = `
/* ── Page — soft dark with spring hint ── */
body[data-season="easter"] {
  background-color: #080a10;
}

/* ── Vignette — soft lavender edges ── */
body[data-season="easter"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 39;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(8,6,14,0.12) 55%, rgba(4,3,10,0.3) 85%, rgba(2,1,6,0.45) 100%),
    linear-gradient(to top, rgba(10,15,8,0.15) 0%, transparent 20%);
}

/* ── Header — pastel accent line ── */
body[data-season="easter"] header.header {
  border-bottom: none;
  background: rgba(10,10,16,0.95);
}
body[data-season="easter"] header.header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 1;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(180,140,220,0.3) 15%,
    rgba(140,200,140,0.5) 30%,
    rgba(255,200,120,0.6) 50%,
    rgba(140,200,140,0.5) 70%,
    rgba(180,140,220,0.3) 85%,
    transparent 100%);
  animation: easter-header-glow 3s ease-in-out infinite;
}

@keyframes easter-header-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ── Footer — spring tones ── */
body[data-season="easter"] footer {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(140,200,140,0.04), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(180,140,220,0.03), transparent 50%),
    linear-gradient(180deg, var(--color-bg-soft, #0a0c14) 0%, #060810 100%);
}
body[data-season="easter"] footer::before {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(140,200,140,0.2) 30%,
    rgba(255,200,120,0.25) 50%,
    rgba(140,200,140,0.2) 70%,
    transparent 100%);
}

body[data-season="easter"] .footer-trust {
  background: linear-gradient(135deg, rgba(140,200,140,0.03) 0%, rgba(180,140,220,0.02) 50%, rgba(255,200,120,0.02) 100%);
  border-color: rgba(140,200,140,0.1);
}

/* ── Girl cards — pastel hover ── */
body[data-season="easter"] .girl-card:hover {
  border-color: rgba(180,140,220,0.35);
  box-shadow: 0 4px 20px rgba(140,200,140,0.08), 0 0 40px rgba(180,140,220,0.04);
}

/* ── Falling petals ── */
@keyframes easter-petal-fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(105vh) rotate(180deg); opacity: 0; }
}
@keyframes easter-petal-drift {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.9; }
  50% { transform: translateY(50vh) translateX(-20px) rotate(90deg); }
  90% { opacity: 0.7; }
  100% { transform: translateY(105vh) translateX(12px) rotate(270deg); opacity: 0; }
}
@keyframes easter-petal-sway {
  0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(50vh) translateX(18px) rotate(-90deg); }
  90% { opacity: 0.6; }
  100% { transform: translateY(105vh) translateX(-8px) rotate(-180deg); opacity: 0; }
}

/* ── Bunny hop ── */
@keyframes easter-bunny-hop {
  0%, 70% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-12px) rotate(-3deg); }
  80% { transform: translateY(0) rotate(2deg); }
  85% { transform: translateY(-8px) rotate(-2deg); }
  90% { transform: translateY(0) rotate(1deg); }
  95%, 100% { transform: translateY(0) rotate(0deg); }
}

/* ── Egg wobble ── */
@keyframes easter-egg-wobble {
  0%, 80% { transform: scale(1) rotate(0deg); }
  84% { transform: scale(1.1) rotate(-8deg); }
  88% { transform: scale(0.95) rotate(5deg); }
  92% { transform: scale(1.05) rotate(-3deg); }
  96%, 100% { transform: scale(1) rotate(0deg); }
}

/* ── Egg glow ── */
@keyframes easter-egg-glow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(180,140,220,0.3)) drop-shadow(0 0 16px rgba(140,200,140,0.15));
  }
  50% {
    filter: drop-shadow(0 0 14px rgba(180,140,220,0.5)) drop-shadow(0 0 28px rgba(140,200,140,0.25));
  }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .easter-bunny { font-size: 60px !important; bottom: 90px !important; right: 8px !important; }
  .easter-egg { font-size: 50px !important; bottom: 90px !important; left: 8px !important; }
  .easter-petal { font-size: 10px !important; }
}
`;

const BANNER_TEXT: Record<string, string> = {
  cs: 'Veselé Velikonoce',
  en: 'Happy Easter',
  de: 'Frohe Ostern',
  uk: 'Щасливого Великодня',
};

export default async function EasterOverlay({ locale = 'cs' }: { locale?: string }) {
  const theme = await getActiveTheme();
  if (theme !== 'easter') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EASTER_CSS }} />

      {/* BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, transparent 5%, rgba(140,200,140,0.06) 20%, rgba(255,200,120,0.07) 40%, rgba(180,140,220,0.06) 60%, rgba(140,200,140,0.06) 80%, transparent 95%)',
        borderBottom: '1px solid rgba(140,200,140,0.15)',
        padding: '7px 24px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#b88cd8',
        letterSpacing: 2,
      }}>
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x1F430;</span>
        {' '}{BANNER_TEXT[locale] || BANNER_TEXT.en}{' '}
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x1F430;</span>
      </div>

      {/* FIXED DECORATIONS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40 }} aria-hidden="true">

        {/* ── Bunny — bottom-right ── */}
        <div className="easter-bunny" style={{
          position: 'absolute',
          bottom: 6,
          right: 14,
          fontSize: 80,
          lineHeight: 1,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 10px rgba(180,140,220,0.3))',
          animation: 'easter-bunny-hop 5s ease-in-out infinite',
        }}>&#x1F430;</div>

        {/* ── Easter egg — bottom-left ── */}
        <div className="easter-egg" style={{
          position: 'absolute',
          bottom: 6,
          left: 18,
          fontSize: 65,
          lineHeight: 1,
          pointerEvents: 'none',
          animation: 'easter-egg-glow 4s ease-in-out infinite, easter-egg-wobble 6s ease-in-out infinite',
        }}>&#x1F95A;</div>

        {/* ── Falling petals & flowers ── */}
        {[
          { left: '5%',  size: 18, dur: 12, delay: 0,   anim: 'easter-petal-fall',  char: '&#x1F338;' },
          { left: '14%', size: 14, dur: 16, delay: 2,   anim: 'easter-petal-drift', char: '&#x1F33C;' },
          { left: '23%', size: 16, dur: 13, delay: 0.8, anim: 'easter-petal-sway',  char: '&#x1F338;' },
          { left: '33%', size: 12, dur: 18, delay: 4,   anim: 'easter-petal-fall',  char: '&#x1F33C;' },
          { left: '43%', size: 16, dur: 14, delay: 1.5, anim: 'easter-petal-drift', char: '&#x1F338;' },
          { left: '53%', size: 18, dur: 12, delay: 3,   anim: 'easter-petal-sway',  char: '&#x1F33C;' },
          { left: '63%', size: 12, dur: 17, delay: 5,   anim: 'easter-petal-fall',  char: '&#x1F338;' },
          { left: '73%', size: 16, dur: 13, delay: 2.5, anim: 'easter-petal-drift', char: '&#x1F33C;' },
          { left: '83%', size: 14, dur: 15, delay: 1,   anim: 'easter-petal-sway',  char: '&#x1F338;' },
          { left: '92%', size: 18, dur: 14, delay: 6,   anim: 'easter-petal-fall',  char: '&#x1F33C;' },
          { left: '9%',  size: 10, dur: 19, delay: 8,   anim: 'easter-petal-drift', char: '&#x1F338;' },
          { left: '48%', size: 10, dur: 20, delay: 7,   anim: 'easter-petal-sway',  char: '&#x1F33C;' },
        ].map((p, i) => (
          <div key={`p-${i}`} className="easter-petal" style={{
            position: 'absolute',
            left: p.left,
            top: 0,
            fontSize: p.size,
            lineHeight: 1,
            opacity: 0,
            pointerEvents: 'none',
            animation: `${p.anim} ${p.dur}s linear infinite ${p.delay}s`,
          }} dangerouslySetInnerHTML={{ __html: p.char }} />
        ))}

      </div>
    </>
  );
}
