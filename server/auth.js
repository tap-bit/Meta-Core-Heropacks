const crypto = require('crypto');

function hashCode(code) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(code), salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyCode(code, stored) {
  if (!stored || typeof code !== 'string') return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(code, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashCode, verifyCode };
