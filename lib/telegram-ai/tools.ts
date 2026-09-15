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
  {
    name: 'registerNewClient',
    description:
      'Registruje noveho klienta ktery chce poprve rezervovat. ' +
      'Pouzij POUZE kdyz klient AKTIVNE chce bookovat a neni registrovany. ' +
      'Automaticky propoji jeho Telegram s novou klientskou kartou.',
    input_schema: {
      type: 'object' as const,
      properties: {
        nickname: {
          type: 'string',
          description: 'Jmeno/prezdivka klienta (ptat se nebo pouzit Telegram display name)',
        },
      },
      required: ['nickname'],
    },
  },
  {
    name: 'sendGirlPhoto',
    description:
      'Posle klientovi fotku divky do Telegramu. Pouzij kdyz popisujes divku, ' +
      'nebo kdyz klient chce videt jak vypada. Posle hlavni profilovou fotku.',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky' },
        caption: { type: 'string', description: 'Volitelny popisek pod fotkou (HTML)' },
      },
      required: ['girlId'],
    },
  },
  {
    name: 'startBookingFlow',
    description:
      'Spusti strukturovany booking flow s inline tlacitky (BEZ dalsich AI volani). ' +
      'Pouzij kdyz VIS kterou divku klient chce A na jaky den. ' +
      'NEPOUZIVEJ kdyz klient jeste nevi koho chce — pak pomahej prirozene. ' +
      'Bot sam nabidne casove sloty, delky programu a potvrzeni pres tlacitka. ' +
      'Po zavolani uz NEODPOVIDEJ textem — flow pokracuje automaticky.',
    input_schema: {
      type: 'object' as const,
      properties: {
        girlId: { type: 'integer', description: 'ID divky' },
        date: { type: 'string', description: 'Datum YYYY-MM-DD' },
      },
      required: ['girlId', 'date'],
    },
  },
];
