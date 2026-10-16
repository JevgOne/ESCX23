/**
 * STUDIOFLOW — Loyalty points & discount system
 *
 * Points per booking duration:
 *   30 min = 800 bodů
 *   45 min = 900 bodů
 *   60 min = 1000 bodů
 *   120 min = 1800 bodů
 *
 * Loyalty discounts (every 5th completed visit):
 *   regular (5+ visits): 250 Kč off
 *   vip (10+ visits, 0 no-show): 500 Kč off
 *
 * Trust level auto-progression:
 *   new      → 0 completed visits
 *   verified → 2+ completed visits
 *   regular  → 5+ completed visits, spolehlivý
 *   vip      → 10+ completed visits, 0 no-show
 */

// ── Points ──────────────────────────────────────────────────────────

const POINTS_MAP: Record<number, number> = {
  30: 800,
  45: 900,
  60: 1000,
  90: 1400,
  120: 1800,
};

/** Get points for a booking based on duration in minutes. */
export function getPointsForDuration(durationMinutes: number): number {
  return POINTS_MAP[durationMinutes] ?? Math.round(durationMinutes * (1000 / 60));
}

// ── Trust level ─────────────────────────────────────────────────────

export type TrustLevel = 'new' | 'verified' | 'regular' | 'vip';

/** Calculate what trust level a client should have based on stats. */
export function calculateTrustLevel(
  completedVisits: number,
  noShowCount: number,
): TrustLevel {
  if (completedVisits >= 10 && noShowCount === 0) return 'vip';
  if (completedVisits >= 5) return 'regular';
  if (completedVisits >= 2) return 'verified';
  return 'new';
}

// ── Loyalty discount ────────────────────────────────────────────────

export interface LoyaltyDiscount {
  /** Whether this visit qualifies for a loyalty discount */
  eligible: boolean;
  /** Discount amount in CZK */
  amount: number;
  /** Which visit number this is (5, 10, 15, ...) */
  visitNumber: number;
}

/**
 * Check if a completed visit triggers a loyalty discount.
 * Discount applies on every 5th visit (5, 10, 15, 20, ...).
 *   - regular: 250 Kč
 *   - vip: 500 Kč
 */
export function checkLoyaltyDiscount(
  completedVisitsAfter: number,
  trustLevel: TrustLevel,
): LoyaltyDiscount {
  const isEveryFifth = completedVisitsAfter > 0 && completedVisitsAfter % 5 === 0;

  if (!isEveryFifth) {
    return { eligible: false, amount: 0, visitNumber: completedVisitsAfter };
  }

  if (trustLevel === 'vip') {
    return { eligible: true, amount: 500, visitNumber: completedVisitsAfter };
  }
  if (trustLevel === 'regular') {
    return { eligible: true, amount: 250, visitNumber: completedVisitsAfter };
  }

  // new/verified clients don't get loyalty discounts yet
  return { eligible: false, amount: 0, visitNumber: completedVisitsAfter };
}

/**
 * How many visits until the next loyalty discount.
 */
export function visitsUntilNextDiscount(completedVisits: number): number {
  return 5 - (completedVisits % 5);
}
