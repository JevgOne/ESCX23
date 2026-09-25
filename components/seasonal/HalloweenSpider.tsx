/**
 * Halloween spider hanging from header thread.
 * Server Component — uses centralized seasonal theme detection.
 */

import { getActiveTheme } from '@/lib/seasonal';

export default async function HalloweenSpider() {
  const theme = await getActiveTheme();
  if (theme !== 'halloween') return null;

  return (
    <div className="hw-spider" aria-hidden="true">
      <div className="hw-spider-thread" />
      <div className="hw-spider-body">🕷️</div>
    </div>
  );
}
