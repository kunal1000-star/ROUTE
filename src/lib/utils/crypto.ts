import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const b64 = process.env.PROVIDER_KEYS_ENCRYPTION_KEY;
  if (!b64) throw new Error('Missing PROVIDER_KEYS_ENCRYPTION_KEY');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('PROVIDER_KEYS_ENCRYPTION_KEY must decode to 32 bytes');
  return key;
}

export function encryptSecret(plain: string): { ciphertext: Buffer; iv: Buffer } {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: Buffer.concat([enc, tag]), iv };
}

export function decryptSecret(ciphertext: Buffer, iv: Buffer): string {
  const key = getKey();
  const enc = ciphertext.subarray(0, ciphertext.length - 16);
  const tag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}
