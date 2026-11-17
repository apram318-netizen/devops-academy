/** Client-side vault crypto: passphrase → AES-GCM. Firebase never sees plaintext progress. */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PBKDF2_ITERS = 210_000;
const SALT_PREFIX = 'devops-academy-vault-v2:';

function b64encode(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function deriveVaultKey(passphrase: string, saltB64?: string): Promise<{ key: CryptoKey; saltB64: string }> {
  const salt = saltB64 ? b64decode(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase.trim()), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const prefix = encoder.encode(SALT_PREFIX);
  const mixed = new Uint8Array(prefix.length + salt.length);
  mixed.set(prefix, 0);
  mixed.set(salt, prefix.length);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: mixed, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return { key, saltB64: b64encode(salt) };
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<{ ivB64: string; ciphertextB64: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = encoder.encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return { ivB64: b64encode(iv), ciphertextB64: b64encode(new Uint8Array(cipher)) };
}

export async function decryptJson<T>(key: CryptoKey, ivB64: string, ciphertextB64: string): Promise<T> {
  const iv = b64decode(ivB64);
  const cipher = b64decode(ciphertextB64);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(decoder.decode(plain)) as T;
}
