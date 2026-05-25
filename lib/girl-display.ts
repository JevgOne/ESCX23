export type TattooLevel = 'none' | 'discreet' | 'visible' | 'significant' | 'full';
export type PiercingLevel = 'none' | 'ears' | 'multiple' | 'body';

const TATTOO_RANGE: Record<TattooLevel, { min: number; max: number }> = {
  none:        { min: 0,  max: 0   },
  discreet:    { min: 1,  max: 5   },
  visible:     { min: 6,  max: 30  },
  significant: { min: 31, max: 70  },
  full:        { min: 71, max: 100 },
};

export function detectTattooLevel(
  tattoo: number | boolean | null | undefined,
  description: string | null | undefined
): TattooLevel {
  if (tattoo === null || tattoo === undefined || tattoo === false) return 'none';

  const numVal = Number(tattoo);

  if (numVal > 5) {
    if (numVal <= 30) return 'visible';
    if (numVal <= 70) return 'significant';
    return 'full';
  }

  if (numVal === 0) {
    const desc = (description ?? '').toLowerCase();
    if (!desc) return 'none';
    if (/cel(é|e|y).*t(e|ě)l|full.*body|sleeve.*full|extensive/i.test(desc)) return 'full';
    if (/sleeve|leg|thigh|chest|velk(é|y|e)|znacn|significant/i.test(desc)) return 'significant';
    if (/arm|back|forearm|visible|viditeln|středn/i.test(desc)) return 'visible';
    return 'none';
  }

  const desc = (description ?? '').toLowerCase();
  if (numVal >= 1 && numVal <= 5) {
    if (!desc) return 'discreet';
    if (/cel(é|e|y).*t(e|ě)l|full.*body|sleeve.*full|extensive/i.test(desc)) return 'full';
    if (/sleeve|leg|thigh|chest|velk(é|y|e)|znacn|significant/i.test(desc)) return 'significant';
    if (/arm|back|forearm|visible|viditeln|středn/i.test(desc)) return 'visible';
    return 'discreet';
  }

  return 'discreet';
}

export function tattooPercent(level: TattooLevel): { min: number; max: number } {
  return TATTOO_RANGE[level];
}

export function detectPiercingLevel(
  piercing: number | boolean | null | undefined
): PiercingLevel {
  if (!piercing || piercing === 0) return 'none';
  return 'ears';
}
