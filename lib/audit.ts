/**
 * Audit logging for booking system security events.
 *
 * Writes to `booking_audit_log` table (already exists in DB schema).
 * Never throws — audit failures are logged to console but never block requests.
 */

import { db } from './db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditParams {
  bookingId?: number;
  userId?: number;
  action: string;
  actorType?: 'user' | 'bot' | 'system' | 'cron';
  entityType?: string;
  entityId?: number;
  details?: Record<string, unknown>;
  severity?: 'info' | 'warn' | 'critical';
  ipHash?: string;
  userAgent?: string;
}

// ---------------------------------------------------------------------------
// Main logging function
// ---------------------------------------------------------------------------

/**
 * Log an audit event to booking_audit_log.
 * Never throws — errors go to console.error.
 * Usage: logAudit({...}).catch(() => {})  (fire-and-forget)
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const detailsJson = params.details ? JSON.stringify(params.details) : '{}';

    await db.execute({
      sql: `
        INSERT INTO booking_audit_log
          (booking_id, user_id, action, actor_type, entity_type, entity_id, details, ip_hash, user_agent, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        params.bookingId ?? null,
        params.userId ?? null,
        params.action,
        params.actorType ?? 'user',
        params.entityType ?? null,
        params.entityId ?? null,
        detailsJson,
        params.ipHash ?? null,
        params.userAgent ?? null,
        params.severity ?? 'info',
      ],
    });
  } catch (error) {
    console.error('[audit] Failed to write audit log:', error);
  }
}

// ---------------------------------------------------------------------------
// Helper functions for common actions
// ---------------------------------------------------------------------------

/** Log booking creation. */
export async function auditBookingCreate(
  userId: number,
  bookingId: number,
  details?: Record<string, unknown>,
): Promise<void> {
  return logAudit({
    userId,
    bookingId,
    action: 'booking.create',
    entityType: 'booking',
    entityId: bookingId,
    details,
  });
}

/** Log client PII decryption (who viewed what sensitive field). */
export async function auditClientDecrypt(
  userId: number,
  clientId: number,
  field: string,
): Promise<void> {
  return logAudit({
    userId,
    action: 'client.decrypt',
    entityType: 'client',
    entityId: clientId,
    severity: 'warn',
    details: { field },
  });
}

/** Log login attempt (success or failure). */
export async function auditLoginAttempt(
  email: string,
  success: boolean,
  ip?: string,
): Promise<void> {
  return logAudit({
    action: success ? 'login.success' : 'login.failed',
    actorType: 'user',
    severity: success ? 'info' : 'warn',
    ipHash: ip,
    details: { email },
  });
}

/** Log booking status change. */
export async function auditBookingStatusChange(
  userId: number,
  bookingId: number,
  fromStatus: string,
  toStatus: string,
): Promise<void> {
  return logAudit({
    userId,
    bookingId,
    action: `booking.${toStatus}`,
    entityType: 'booking',
    entityId: bookingId,
    details: { from: fromStatus, to: toStatus },
  });
}

/** Log client data modification. */
export async function auditClientUpdate(
  userId: number,
  clientId: number,
  changes: Record<string, unknown>,
): Promise<void> {
  return logAudit({
    userId,
    action: 'client.update',
    entityType: 'client',
    entityId: clientId,
    details: changes,
  });
}
