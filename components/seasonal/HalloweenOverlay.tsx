/**
 * Halloween seasonal integration — renders only when Halloween theme is active.
 * DO NOT MODIFY — lead edits this file directly based on user feedback.
 * Server Component — zero JS shipped to client.
 */

import { getActiveTheme } from '@/lib/seasonal';

const HALLOWEEN_CSS = `
body[data-season="halloween"] {
  background-color: #0c0708;
}

body[data-season="halloween"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 39;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(10,3,6,0.12) 55%, rgba(5,1,3,0.3) 85%, rgba(2,0,1,0.45) 100%),
    linear-gradient(to top, rgba(15,5,2,0.25) 0%, transparent 25%);
}

body[data-season="halloween"] header.header {
  border-bottom: 1px solid rgba(255,140,0,0.2);
  background: rgba(12,10,14,0.94);
}

body[data-season="halloween"] footer {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255,120,0,0.06), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(180,60,0,0.05), transparent 50%),
    linear-gradient(180deg, var(--color-bg-soft, #14080f) 0%, #0a0509 100%);
}
body[data-season="halloween"] footer::before {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255,140,0,0.3) 30%,
    rgba(255,100,0,0.4) 50%,
    rgba(255,140,0,0.3) 70%,
    transparent 100%);
}

body[data-season="halloween"] .footer-trust {
  background: linear-gradient(135deg, rgba(255,130,0,0.04) 0%, rgba(200,80,0,0.03) 50%, rgba(130,50,0,0.02) 100%);
  border-color: rgba(255,140,0,0.12);
}

body[data-season="halloween"] .girl-card:hover {
  border-color: rgba(255,130,0,0.5);
  box-shadow: 0 4px 20px rgba(255,100,0,0.12), 0 0 40px rgba(255,80,0,0.06);
}

@keyframes hw-fly-1 {
  0%   { transform: translate(105vw, 38vh) scaleX(-1); }
  50%  { transform: translate(40vw, 48vh) scaleX(-1); }
  100% { transform: translate(-15vw, 40vh) scaleX(-1); }
}
@keyframes hw-fly-2 {
  0%   { transform: translate(-15vw, 52vh); }
  50%  { transform: translate(55vw, 44vh); }
  100% { transform: translate(110vw, 50vh); }
}

@keyframes hw-glow-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 12px rgba(255,130,0,0.5)) drop-shadow(0 0 25px rgba(255,100,0,0.2));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255,150,20,0.7)) drop-shadow(0 0 45px rgba(255,110,0,0.3));
  }
}

@keyframes hw-candle-flicker {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(255,180,50,0.4)) drop-shadow(0 0 15px rgba(255,140,0,0.15));
  }
  33% {
    filter: drop-shadow(0 0 14px rgba(255,190,60,0.6)) drop-shadow(0 0 28px rgba(255,150,10,0.3));
  }
  66% {
    filter: drop-shadow(0 0 10px rgba(255,170,40,0.45)) drop-shadow(0 0 20px rgba(255,130,0,0.2));
  }
}

@keyframes hw-smoke-rise {
  0%, 100% { opacity: 0.6; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-8px); }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .hw-pumpkin {
    width: 80px !important;
    height: 80px !important;
    bottom: 75px !important;
    right: 8px !important;
  }
  .hw-candle-1 {
    width: 28px !important;
    height: 65px !important;
    left: 8px !important;
    bottom: 75px !important;
  }
  .hw-candle-2 {
    width: 20px !important;
    height: 42px !important;
    left: 42px !important;
    bottom: 75px !important;
  }
  .hw-candle-3 {
    display: none !important;
  }
  .hw-bat { font-size: 18px !important; }
}
`;

export default async function HalloweenOverlay() {
  const theme = await getActiveTheme();
  if (theme !== 'halloween') return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HALLOWEEN_CSS }} />

      {/* BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, transparent 5%, rgba(255,120,0,0.08) 25%, rgba(255,80,0,0.12) 50%, rgba(255,120,0,0.08) 75%, transparent 95%)',
        borderBottom: '1px solid rgba(255,140,0,0.15)',
        padding: '7px 24px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#e87400',
        letterSpacing: 2,
      }}>
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x1F383;</span>
        {' '}Happy Halloween{' '}
        <span style={{ fontSize: 16, verticalAlign: 'middle' }}>&#x1F383;</span>
      </div>

      {/* FIXED DECORATIONS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40 }} aria-hidden="true">

        {/* Big pumpkin PNG — bottom-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hw-pumpkin"
          src="/seasonal/pumpkin.png"
          alt=""
          width={140}
          height={140}
          style={{
            position: 'absolute',
            bottom: 6,
            right: 14,
            width: 140,
            height: 140,
            pointerEvents: 'none',
            animation: 'hw-glow-pulse 4s ease-in-out infinite',
          }}
        />

        {/* ── Left scene: candles ── */}
        {/* Tall candle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hw-candle-1" src="/seasonal/candle.png" alt="" width={45} height={110}
          style={{ position: 'absolute', bottom: 8, left: 20, width: 45, height: 110, pointerEvents: 'none', animation: 'hw-candle-flicker 3s ease-in-out infinite' }}
        />
        {/* Medium candle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hw-candle-2" src="/seasonal/candle.png" alt="" width={35} height={75}
          style={{ position: 'absolute', bottom: 8, left: 112, width: 35, height: 75, pointerEvents: 'none', opacity: 0.8, animation: 'hw-candle-flicker 3s ease-in-out infinite 1.5s' }}
        />
        {/* Small candle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hw-candle-3" src="/seasonal/candle.png" alt="" width={25} height={50}
          style={{ position: 'absolute', bottom: 8, left: 152, width: 25, height: 50, pointerEvents: 'none', opacity: 0.6, animation: 'hw-candle-flicker 3s ease-in-out infinite 0.7s' }}
        />

        {/* Bats */}
        <div style={{
          position: 'absolute',
          fontSize: 32,
          lineHeight: 1,
          opacity: 0.5,
          pointerEvents: 'none',
          animation: 'hw-fly-1 28s linear infinite 3s',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
        }} className="hw-bat">
          &#x1F987;
        </div>
        <div className="hw-bat" style={{
          position: 'absolute',
          fontSize: 26,
          lineHeight: 1,
          opacity: 0.4,
          pointerEvents: 'none',
          animation: 'hw-fly-2 32s linear infinite 12s',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
        }}>
          &#x1F987;
        </div>

      </div>
    </>
  );
}
