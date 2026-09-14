/**
 * AES-256-GCM encryption/decryption + HMAC SHA-256 search hashing.
 *
 * Encrypt format: "iv:tag:ciphertext" (all base64)
 * - iv: 12 bytes (96-bit, GCM standard)
 * - tag: 16 bytes (128-bit auth tag)
 * - ciphertext: variable length
 *
 * Uses Node.js built-in crypto — zero external dependencies.
 */

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32; // 256 bits

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

function resolveKey(keyHex?: string): Buffer {
  const hex = keyHex
    ?? process.env.BOOKING_ENCRYPTION_KEY
    ?? process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error('No encryption key: set BOOKING_ENCRYPTION_KEY or ENCRYPTION_KEY env var');
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== KEY_BYTES) {
    throw new Error(`Encryption key must be ${KEY_BYTES * 2} hex chars (${KEY_BYTES} bytes), got ${hex.length}`);
  }
  return buf;
}

function resolveSalt(salt?: string): string {
  const s = salt
    ?? process.env.BOOKING_HMAC_SECRET
    ?? process.env.SEARCH_HASH_SALT;
  if (!s) throw new Error('No HMAC salt: set BOOKING_HMAC_SECRET or SEARCH_HASH_SALT env var');
  return s;
}

// ---------------------------------------------------------------------------
// encrypt / decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns "iv:tag:ciphertext" (base64-encoded parts).
 */
export function encrypt(plaintext: string, keyHex?: string): string {
  const key = resolveKey(keyHex);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt an "iv:tag:ciphertext" string back to plaintext.
 * Throws on invalid/tampered data.
 */
export function decrypt(encrypted: string, keyHex?: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format: expected "iv:tag:ciphertext" (base64)');
  }

  const [ivB64, tagB64, ciphertextB64] = parts;
  const key = resolveKey(keyHex);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  if (iv.length !== IV_BYTES) throw new Error(`Invalid IV length: ${iv.length}`);
  if (tag.length !== TAG_BYTES) throw new Error(`Invalid tag length: ${tag.length}`);

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

// ---------------------------------------------------------------------------
// Search hash (HMAC SHA-256)
// ---------------------------------------------------------------------------

/**
 * Normalize a phone number for consistent hashing:
 * strip spaces/dashes, ensure +420 prefix for Czech numbers.
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Czech numbers without prefix: 6xx or 7xx → +420
  if (/^\d{9}$/.test(cleaned) && (cleaned[0] === '6' || cleaned[0] === '7')) {
    cleaned = '+420' + cleaned;
  }
  // 00420 → +420
  if (cleaned.startsWith('00420')) {
    cleaned = '+' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Create an HMAC SHA-256 hash for searchable encrypted fields.
 * Deterministic: same input always produces same hash.
 * Phone numbers are normalized before hashing.
 */
export function hashForSearch(value: string, salt?: string): string {
  const s = resolveSalt(salt);
  return crypto.createHmac('sha256', s).update(value).digest('hex');
}

/**
 * HMAC SHA-256 specifically for phone lookup (normalizes phone first).
 * Use this for phone_hmac column in booking_clients.
 */
export function hmacSearch(value: string, salt?: string): string {
  const normalized = normalizePhone(value);
  return hashForSearch(normalized, salt);
}

// ---------------------------------------------------------------------------
// Key generation utility
// ---------------------------------------------------------------------------

/**
 * Generate a random 256-bit key as hex string.
 * Use this to create BOOKING_ENCRYPTION_KEY values:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function generateKey(): string {
  return crypto.randomBytes(KEY_BYTES).toString('hex');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a string looks like an encrypted value (3 base64 parts separated by colons). */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => p.length > 0);
}
