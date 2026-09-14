import type Anthropic from '@anthropic-ai/sdk';

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'getAvailableGirls',
    description:
      'Vrati seznam divek ktere pracuji v dany den (nebo dnes). Vcetne smeny (od-do) a lokace.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Datum ve formatu YYYY-MM-DD. Pokud neuvedeno, pouzije se dnesek.',
        },
      },
      required: [],
    },
  },
  {
    name: 'getGirlProfile',
    description:
      'Kompletni profil divky — jmeno, vek, vyska, vaha, vlasy, oci, narodnost, jazyky, sluzby, popis, hodnoceni.',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky' },
        girlName: { type: 'string', description: 'Jmeno divky (case-insensitive match)' },
      },
      required: [],
    },
  },
  {
    name: 'searchGirls',
    description:
      'Hledani divek podle preferenci klienta. Vrati serazeny seznam nejlepsich shod.',
    input_schema: {
      type: 'object' as const,
      properties: {
        hairColor: { type: 'string', description: 'Barva vlasu: blond, bruneta, zrzka, cernovlaska' },
        language: { type: 'string', description: 'Jazyk: cs, en, de, uk, ru' },
        ageMin: { type: 'integer', description: 'Minimalni vek' },
        ageMax: { type: 'integer', description: 'Maximalni vek' },
        services: {
          type: 'array',
          items: { type: 'string' },
          description: 'Pozadovane sluzby',
        },
        availableDate: {
          type: 'string',
          description: 'Datum kdy musi byt dostupna (YYYY-MM-DD)',
        },
      },
      required: [],
    },
  },
  {
    name: 'checkAvailability',
    description:
      'Zkontroluje volne casove sloty divky pro dany den. Vrati seznam volnych 30min bloku.',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky' },
        date: { type: 'string', description: 'Datum YYYY-MM-DD' },
      },
      required: ['girlId', 'date'],
    },
  },
  {
    name: 'getWeekSchedule',
    description: 'Rozvrh divky na cely aktualny tyden (Po-Ne). Pro kazdy den: pracuje/nepracuje, od-do.',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky' },
      },
      required: ['girlId'],
    },
  },
  {
    name: 'getPricing',
    description: 'Cenik programu (30/45/60/90/120 min) vcetne denni a nocni ceny.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'createBooking',
    description:
      'Vytvori potvrzenou rezervaci. POUZE pro registrovane klienty s 3+ navstevami. Auto-confirmed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky' },
        date: { type: 'string', description: 'Datum YYYY-MM-DD' },
        startTime: { type: 'string', description: 'Cas zacatku HH:MM' },
        durationMinutes: { type: 'integer', description: 'Delka v minutach: 30, 45, 60, 90, nebo 120' },
      },
      required: ['girlId', 'date', 'startTime', 'durationMinutes'],
    },
  },
  {
    name: 'getClientBookings',
    description: 'Aktivni a nadchazejici rezervace klienta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        includeHistory: {
          type: 'boolean',
          description: 'Zahrnout i dokoncene/zrusene (poslednich 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'cancelBooking',
    description: 'Zrusi existujici rezervaci klienta. Jen CONFIRMED nebo PENDING bookings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        bookingId: { type: 'integer', description: 'ID rezervace' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'subscribeToGirl',
    description: 'Prihlasi klienta k notifikaci kdyz divka bude v novem rozvrhu (pondeli 0:05).',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky k sledovani' },
      },
      required: ['girlId'],
    },
  },
];
