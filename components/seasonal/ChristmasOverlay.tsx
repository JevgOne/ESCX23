/**
 * Christmas seasonal integration — renders only when Christmas theme is active.
 * Falling snow, twinkling lights, tree, presents, red/gold atmosphere.
 * Server Component — zero JS shipped to client.
 */

import { getActiveTheme } from '@/lib/seasonal';

const CHRISTMAS_CSS = `
/* ── Page — cool dark blue atmosphere ── */
body[data-season="christmas"] {
  background-color: #080b12;
}

/* ── Vignette — cool blue edges ── */
body[data-season="christmas"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 39;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(5,8,20,0.12) 55%, rgba(2,4,12,0.3) 85%, rgba(1,2,8,0.45) 100%),
    linear-gradient(to top, rgba(5,10,25,0.2) 0%, transparent 20%);
}

/* ── Header — red/gold accent + string lights ── */
body[data-season="christmas"] header.header {
  border-bottom: none;
  background: rgba(10,12,18,0.95);
}
body[data-season="christmas"] header.header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 8px;
  z-index: 1;
  background:
    radial-gradient(circle 4px at 5% 50%, #ff3333 45%, transparent 50%),
    radial-gradient(circle 4px at 12% 50%, #33cc33 45%, transparent 50%),
    radial-gradient(circle 4px at 19% 50%, #ffcc00 45%, transparent 50%),
    radial-gradient(circle 4px at 26% 50%, #3388ff 45%, transparent 50%),
    radial-gradient(circle 4px at 33% 50%, #ff33aa 45%, transparent 50%),
    radial-gradient(circle 4px at 40% 50%, #ff3333 45%, transparent 50%),
    radial-gradient(circle 4px at 47% 50%, #33cc33 45%, transparent 50%),
    radial-gradient(circle 4px at 54% 50%, #ffcc00 45%, transparent 50%),
    radial-gradient(circle 4px at 61% 50%, #3388ff 45%, transparent 50%),
    radial-gradient(circle 4px at 68% 50%, #ff33aa 45%, transparent 50%),
    radial-gradient(circle 4px at 75% 50%, #ff3333 45%, transparent 50%),
    radial-gradient(circle 4px at 82% 50%, #33cc33 45%, transparent 50%),
    radial-gradient(circle 4px at 89% 50%, #ffcc00 45%, transparent 50%),
    radial-gradient(circle 4px at 96% 50%, #3388ff 45%, transparent 50%);
  filter: blur(0.3px);
  animation: xmas-lights-glow 3s ease-in-out infinite;
}

@keyframes xmas-lights-glow {
  0%, 100% { filter: blur(0.3px) drop-shadow(0 0 3px rgba(255,100,100,0.4)); }
  50% { filter: blur(0.3px) drop-shadow(0 0 6px rgba(255,200,50,0.6)); }
}

/* ── Footer — deep red/green tones ── */
body[data-season="christmas"] footer {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(180,30,30,0.05), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(20,80,40,0.04), transparent 50%),
    linear-gradient(180deg, var(--color-bg-soft, #0a0d14) 0%, #060810 100%);
}
body[data-season="christmas"] footer::before {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200,50,50,0.25) 30%,
    rgba(220,180,50,0.3) 50%,
    rgba(200,50,50,0.25) 70%,
    transparent 100%);
}

body[data-season="christmas"] .footer-trust {
  background: linear-gradient(135deg, rgba(180,30,30,0.04) 0%, rgba(20,80,40,0.03) 50%, rgba(200,170,50,0.02) 100%);
  border-color: rgba(200,50,50,0.12);
}

/* ── Girl cards — warm gold hover ── */
body[data-season="christmas"] .girl-card:hover {
  border-color: rgba(220,180,50,0.4);
  box-shadow: 0 4px 20px rgba(200,50,50,0.1), 0 0 40px rgba(220,180,50,0.06);
}

/* ── Snowfall keyframes ── */
@keyframes xmas-snow-fall {
  0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(105vh) translateX(30px); opacity: 0; }
}
@keyframes xmas-snow-fall-drift {
  0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(50vh) translateX(-20px); }
  90% { opacity: 0.8; }
  100% { transform: translateY(105vh) translateX(15px); opacity: 0; }
}
@keyframes xmas-snow-fall-slow {
  0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
  10% { opacity: 0.6; }
  50% { transform: translateY(50vh) translateX(25px); }
  90% { opacity: 0.6; }
  100% { transform: translateY(105vh) translateX(-10px); opacity: 0; }
}

/* ── Tree glow ── */
@keyframes xmas-tree-glow {
  0%, 100% {
    filter: drop-shadow(0 0 15px rgba(220,180,50,0.3)) drop-shadow(0 0 30px rgba(200,50,50,0.15));
  }
  50% {
    filter: drop-shadow(0 0 25px rgba(220,180,50,0.5)) drop-shadow(0 0 50px rgba(200,50,50,0.25));
  }
}

/* ── Star twinkle ── */
@keyframes xmas-twinkle {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .xmas-tree { font-size: 70px !important; bottom: 90px !important; right: 6px !important; }
  .xmas-present { font-size: 28px !important; bottom: 90px !important; }
  .xmas-star { font-size: 18px !important; bottom: 155px !important; right: 24px !important; }
  .xmas-snow { font-size: 12px !important; }
}
`;

export default async function ChristmasOverlay() {
  const theme = await getActiveTheme();
  if (theme !== 'christmas') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CHRISTMAS_CSS }} />

      {/* BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, transparent 5%, rgba(200,50,50,0.08) 20%, rgba(220,180,50,0.06) 40%, rgba(200,50,50,0.08) 60%, rgba(220,180,50,0.06) 80%, transparent 95%)',
        borderBottom: '1px solid rgba(200,50,50,0.15)',
        padding: '7px 24px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#d4a833',
        letterSpacing: 2,
      }}>
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x2B50;</span>
        {' '}Merry Christmas{' '}
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x2B50;</span>
      </div>

      {/* FIXED DECORATIONS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40 }} aria-hidden="true">

        {/* ── Christmas tree — bottom-right ── */}
        <div className="xmas-tree" style={{
          position: 'absolute',
          bottom: 6,
          right: 14,
          fontSize: 100,
          lineHeight: 1,
          pointerEvents: 'none',
          animation: 'xmas-tree-glow 5s ease-in-out infinite',
        }}>&#x1F384;</div>

        {/* ── Star on top of tree ── */}
        <div className="xmas-star" style={{
          position: 'absolute',
          bottom: 112,
          right: 46,
          fontSize: 22,
          lineHeight: 1,
          pointerEvents: 'none',
          animation: 'xmas-twinkle 2s ease-in-out infinite',
          filter: 'drop-shadow(0 0 8px rgba(255,220,80,0.8))',
        }}>&#x2B50;</div>

        {/* ── Presents — bottom-left ── */}
        <div className="xmas-present" style={{
          position: 'absolute',
          bottom: 8,
          left: 18,
          fontSize: 42,
          lineHeight: 1,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 6px rgba(200,50,50,0.3))',
        }}>&#x1F381;</div>

        {/* ── Falling snowflakes ── */}
        {[
          { left: '8%',  size: 16, dur: 12, delay: 0,   anim: 'xmas-snow-fall' },
          { left: '18%', size: 10, dur: 18, delay: 3,   anim: 'xmas-snow-fall-drift' },
          { left: '30%', size: 14, dur: 15, delay: 1,   anim: 'xmas-snow-fall-slow' },
          { left: '42%', size: 8,  dur: 20, delay: 7,   anim: 'xmas-snow-fall' },
          { left: '55%', size: 12, dur: 14, delay: 4,   anim: 'xmas-snow-fall-drift' },
          { left: '65%', size: 16, dur: 16, delay: 2,   anim: 'xmas-snow-fall-slow' },
          { left: '78%', size: 10, dur: 19, delay: 8,   anim: 'xmas-snow-fall' },
          { left: '88%', size: 14, dur: 13, delay: 5,   anim: 'xmas-snow-fall-drift' },
          { left: '95%', size: 8,  dur: 22, delay: 10,  anim: 'xmas-snow-fall-slow' },
          { left: '12%', size: 6,  dur: 25, delay: 12,  anim: 'xmas-snow-fall' },
          { left: '48%', size: 6,  dur: 21, delay: 6,   anim: 'xmas-snow-fall-drift' },
          { left: '72%', size: 8,  dur: 17, delay: 9,   anim: 'xmas-snow-fall-slow' },
        ].map((s, i) => (
          <div key={i} className="xmas-snow" style={{
            position: 'absolute',
            left: s.left,
            top: 0,
            fontSize: s.size,
            lineHeight: 1,
            opacity: 0,
            pointerEvents: 'none',
            animation: `${s.anim} ${s.dur}s linear infinite ${s.delay}s`,
            color: 'rgba(220,230,255,0.8)',
          }}>&#x2744;</div>
        ))}

      </div>
    </>
  );
}
