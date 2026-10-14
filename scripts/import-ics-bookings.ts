/**
 * Import bookings from Google Calendar ICS files into bookings_v2.
 * Run: npx tsx scripts/import-ics-bookings.ts
 *
 * Reads ICS files from ~/Desktop/lovely10girls@gmail/
 * Imports only FUTURE bookings (date >= today).
 * Skips duplicates (girl_id + date + start_time).
 * Creates booking_clients for unknown client nicknames.
 */

import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ICS_DIR = path.join(process.env.HOME ?? '/Users/zen', 'Desktop/lovely10girls@gmail');
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Girl name mapping: filename prefix / SUMMARY prefix → girls.id
// "Caty"/"Katy"/"Daty" in Caty's calendar → Katy (id 31)
const GIRL_FILE_MAP: Record<string, number> = {
  'Caty': 31,     // Katy
  'Kim': 0,       // Not in DB — skip
  'Natalie': 26,
  'Nika': 25,
  'Sara': 20,
  'Viktoria': 0,  // Not in DB — skip
};

// SUMMARY girl name prefixes → girls.id (for the main calendar or mixed calendars)
const GIRL_NAME_MAP: Record<string, number> = {
  'Katy': 31, 'Caty': 31, 'Daty': 31,
  'Nika': 25,
  'Natalie': 26,
  'Sara': 20,
  'Emily': 28,
  'Elizabeth': 21, 'Eliška': 44,
  'Luna': 22,
  'Rebeca': 27,
  'Anetta': 41, 'Anetka': 41,
  'Dana': 42,
  'Lyra': 43,
  'Victoria': 0, 'Viktorie': 0, 'Vik': 0,  // Not in DB
  'Kim': 0,
};

// Pricing by duration (from pricing_plans)
const PRICE_MAP: Record<number, number> = {
  30: 2000, 45: 2200, 60: 2500, 90: 4000, 120: 4500,
};

// ---------------------------------------------------------------------------
// ICS parser
// ---------------------------------------------------------------------------

interface IcsEvent {
  dtstart: string; // YYYYMMDDTHHMMSSZ
  dtend: string;
  summary: string;
  status: string;
  uid: string;
}

function parseIcsEvents(icsContent: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  const blocks = icsContent.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const lines = block.split('\n').map((l) => l.trim());

    let dtstart = '', dtend = '', summary = '', status = '', uid = '';
    for (const line of lines) {
      if (line.startsWith('DTSTART:')) dtstart = line.slice(8);
      else if (line.startsWith('DTEND:')) dtend = line.slice(6);
      else if (line.startsWith('SUMMARY:')) summary = line.slice(8);
      else if (line.startsWith('STATUS:')) status = line.slice(7);
      else if (line.startsWith('UID:')) uid = line.slice(4);
    }

    if (dtstart && dtend && summary) {
      events.push({ dtstart, dtend, summary, status, uid });
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// UTC → Europe/Prague conversion
// ---------------------------------------------------------------------------

function utcToPrague(dtStr: string): { date: string; time: string } {
  // dtStr = "20261008T154500Z"
  const year = parseInt(dtStr.slice(0, 4));
  const month = parseInt(dtStr.slice(4, 6)) - 1;
  const day = parseInt(dtStr.slice(6, 8));
  const hour = parseInt(dtStr.slice(9, 11));
  const min = parseInt(dtStr.slice(11, 13));

  const utc = new Date(Date.UTC(year, month, day, hour, min, 0));
  const pragueStr = utc.toLocaleString('en-GB', { timeZone: 'Europe/Prague', hour12: false });
  // "08/10/2026, 17:45:00"
  const [datePart, timePart] = pragueStr.split(', ');
  const [d, m, y] = datePart.split('/');
  const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const time = timePart.slice(0, 5); // HH:MM

  return { date, time };
}

// ---------------------------------------------------------------------------
// Client lookup/create
// ---------------------------------------------------------------------------

async function findOrCreateClient(nickname: string): Promise<number> {
  const existing = await db.execute({
    sql: 'SELECT id FROM booking_clients WHERE nickname = ? LIMIT 1',
    args: [nickname],
  });
  if (existing.rows.length > 0) return Number(existing.rows[0].id);

  const maxRes = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'ICS-', '') AS INTEGER)) AS mx FROM booking_clients WHERE client_number LIKE 'ICS-%'",
  );
  const maxNum = Number(maxRes.rows[0]?.mx ?? 0);
  const clientNumber = `ICS-${maxNum + 1}`;

  const ins = await db.execute({
    sql: `INSERT INTO booking_clients (client_number, nickname, source, trust_level, total_visits, created_at, updated_at)
          VALUES (?, ?, 'phone', 'verified', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [clientNumber, nickname],
  });
  return Number(ins.lastInsertRowid);
}

// ---------------------------------------------------------------------------
// Extract client nickname from SUMMARY
// ---------------------------------------------------------------------------

function extractClientNickname(summary: string, girlIdFromFile: number): string {
  // SUMMARY format: "GirlName ClientNickname" or just "ClientNickname"
  const parts = summary.trim().split(/\s+/);
  if (parts.length <= 1) return summary.trim();

  // Check if first word is a girl name
  const firstWord = parts[0];
  if (GIRL_NAME_MAP[firstWord] !== undefined) {
    return parts.slice(1).join(' ').trim();
  }

  // If we know the girl from the file, the whole summary might be just the client
  if (girlIdFromFile > 0) return summary.trim();

  return summary.trim();
}

// ---------------------------------------------------------------------------
// Resolve girl from SUMMARY (for main calendar)
// ---------------------------------------------------------------------------

function resolveGirlFromSummary(summary: string): number {
  const parts = summary.trim().split(/\s+/);
  if (parts.length === 0) return 0;
  return GIRL_NAME_MAP[parts[0]] ?? 0;
}

// ---------------------------------------------------------------------------
// Main import
// ---------------------------------------------------------------------------

async function main() {
  // Wait for DB init
  await new Promise((r) => setTimeout(r, 2000));

  const files = fs.readdirSync(ICS_DIR).filter((f) => f.endsWith('.ics'));
  console.log(`Found ${files.length} ICS files`);

  let imported = 0;
  let skippedPast = 0;
  let skippedDup = 0;
  let skippedNoGirl = 0;
  let skippedCancelled = 0;
  const errors: string[] = [];

  for (const file of files) {
    const filePath = path.join(ICS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const events = parseIcsEvents(content);

    // Determine girl from filename
    const fileGirlName = file.split('_')[0];
    const fileGirlId = GIRL_FILE_MAP[fileGirlName] ?? 0;
    const isMainCalendar = file.startsWith('lovely10girls');

    console.log(`\n--- ${fileGirlName} (${file.slice(0, 30)}...) — ${events.length} events, girlId=${fileGirlId}`);

    if (fileGirlId === 0 && !isMainCalendar) {
      console.log(`  SKIP: girl not in DB`);
      skippedNoGirl += events.length;
      continue;
    }

    for (const ev of events) {
      // Skip cancelled
      if (ev.status === 'CANCELLED') {
        skippedCancelled++;
        continue;
      }

      // Parse times
      const start = utcToPrague(ev.dtstart);
      const end = utcToPrague(ev.dtend);

      // Skip past bookings
      if (start.date < TODAY) {
        skippedPast++;
        continue;
      }

      // Resolve girl
      let girlId = fileGirlId;
      if (isMainCalendar || girlId === 0) {
        girlId = resolveGirlFromSummary(ev.summary);
      }
      if (girlId === 0) {
        skippedNoGirl++;
        continue;
      }

      // Extract client nickname
      const clientNickname = extractClientNickname(ev.summary, girlId);
      if (!clientNickname || clientNickname.length === 0) {
        skippedNoGirl++;
        continue;
      }

      // Check for duplicates
      const dup = await db.execute({
        sql: `SELECT id FROM bookings_v2 WHERE girl_id = ? AND date = ? AND start_time = ?
              AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired') LIMIT 1`,
        args: [girlId, start.date, start.time],
      });
      if (dup.rows.length > 0) {
        skippedDup++;
        continue;
      }

      // Calculate duration and price
      const [sh, sm] = start.time.split(':').map(Number);
      const [eh, em] = end.time.split(':').map(Number);
      const durationMin = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMin <= 0 || durationMin > 180) {
        errors.push(`Bad duration ${durationMin}min: ${ev.summary} on ${start.date}`);
        continue;
      }

      // Find closest standard duration for price
      const standardDurations = [30, 45, 60, 90, 120];
      const closestDur = standardDurations.reduce((a, b) =>
        Math.abs(b - durationMin) < Math.abs(a - durationMin) ? b : a,
      );
      const price = PRICE_MAP[closestDur] ?? 2500;

      // Create or find client
      const clientId = await findOrCreateClient(clientNickname);

      // Insert booking
      try {
        await db.execute({
          sql: `INSERT INTO bookings_v2 (
                  client_id, girl_id, date, start_time, end_time, duration_minutes,
                  price, points_earned, status, channel, source, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'phone', 'ics_import', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [clientId, girlId, start.date, start.time, end.time, durationMin, price, price],
        });
        imported++;
        console.log(`  + ${start.date} ${start.time}-${end.time} (${durationMin}min) ${clientNickname}`);
      } catch (err) {
        errors.push(`Insert error: ${ev.summary} — ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  console.log('\n===========================');
  console.log(`IMPORTED:  ${imported}`);
  console.log(`Skipped past:      ${skippedPast}`);
  console.log(`Skipped duplicate:  ${skippedDup}`);
  console.log(`Skipped no girl:    ${skippedNoGirl}`);
  console.log(`Skipped cancelled:  ${skippedCancelled}`);
  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) console.log(`  ! ${e}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
