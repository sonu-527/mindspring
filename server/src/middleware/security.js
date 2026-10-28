import crypto from 'node:crypto';

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
};

export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be a string with at least 8 characters');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString('hex');
  return `$scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt}$${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split('$');
  // Format: ['', 'scrypt', N, r, p, salt, hash]
  if (parts.length !== 7 || parts[1] !== 'scrypt') {
    return false;
  }

  const N = parseInt(parts[2], 10);
  const r = parseInt(parts[3], 10);
  const p = parseInt(parts[4], 10);
  const salt = parts[5];
  const originalKeyHex = parts[6];

  try {
    const derivedKey = crypto.scryptSync(password, salt, 64, { N, r, p, maxmem: 32 * 1024 * 1024 });
    const originalKey = Buffer.from(originalKeyHex, 'hex');
    if (derivedKey.length !== originalKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, originalKey);
  } catch (err) {
    return false;
  }
}

// Dummy constant-time computation to prevent user enumeration on login
const DUMMY_SALT = crypto.randomBytes(16).toString('hex');
export function dummyVerify() {
  try {
    crypto.scryptSync('dummy_password_timing_pad', DUMMY_SALT, 64, SCRYPT_PARAMS);
  } catch (e) {}
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}
