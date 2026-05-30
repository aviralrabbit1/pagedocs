import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM encryption for OAuth tokens stored at rest.
// Key is a 32-byte value, hex-encoded (64 chars) in TOKEN_ENC_KEY.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENC_KEY ?? '';
  if (hex.length !== 64) {
    throw new Error('TOKEN_ENC_KEY must be 64 hex chars (32 bytes).');
  }
  return Buffer.from(hex, 'hex');
}

/** Returns base64 of iv|authTag|ciphertext. */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptToken(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const enc = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
