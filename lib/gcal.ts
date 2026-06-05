import { db } from './db';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];
const TIMEZONE = 'Europe/Prague';

function getClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? '';
}

function getClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET ?? '';
}

function getRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/gcal/callback';
}

// --- OAuth helpers ---

export function getGCalAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GCalTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GCalTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<GCalTokens>;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

// --- Token management ---

export async function getValidAccessTokenByGirl(girlId: number): Promise<string | null> {
  const result = await db.execute({
    sql: `SELECT access_token, refresh_token, expires_at FROM google_calendar_tokens WHERE girl_id = ?`,
    args: [girlId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const expiresAt = new Date(String(row.expires_at));
  const bufferMs = 5 * 60 * 1000; // 5 min buffer

  if (expiresAt.getTime() > Date.now() + bufferMs) {
    return String(row.access_token);
  }

  // Token expired or expiring soon — refresh
  try {
    const refreshed = await refreshAccessToken(String(row.refresh_token));
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await db.execute({
      sql: `UPDATE google_calendar_tokens
            SET access_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE girl_id = ?`,
      args: [refreshed.access_token, newExpiresAt, girlId],
    });

    return refreshed.access_token;
  } catch {
    // Refresh token revoked — caller should show reconnect UI
    return null;
  }
}

// --- Calendar event reading ---

export interface GCalEvent {
  id: string;
  summary: string;
  start: string;    // ISO datetime or date
  end: string;      // ISO datetime or date
  allDay: boolean;
  location?: string;
  status: string;   // confirmed / tentative / cancelled
}

export async function getUpcomingEvents(
  accessToken: string,
  calendarId: string = 'primary',
  days: number = 14,
): Promise<GCalEvent[]> {
  const now = new Date();
  const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    timeZone: TIMEZONE,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    throw new Error(`Calendar API error: ${res.status}`);
  }

  const data = await res.json() as { items?: Array<Record<string, unknown>> };
  const items = data.items ?? [];

  return items
    .filter((item) => item.status !== 'cancelled')
    .map((item) => {
      const startObj = item.start as Record<string, string> | undefined;
      const endObj = item.end as Record<string, string> | undefined;
      const allDay = Boolean(startObj?.date);

      return {
        id: String(item.id),
        summary: String(item.summary ?? '(bez názvu)'),
        start: allDay ? String(startObj!.date) : String(startObj?.dateTime ?? ''),
        end: allDay ? String(endObj!.date) : String(endObj?.dateTime ?? ''),
        allDay,
        location: item.location ? String(item.location) : undefined,
        status: String(item.status ?? 'confirmed'),
      };
    });
}
