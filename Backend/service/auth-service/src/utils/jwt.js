import jwt from 'jsonwebtoken';

const ALGO = process.env.JWT_ALGORITHM || 'HS256';
const ISSUER = process.env.JWT_ISSUER || 'edviron-auth';
const AUD = process.env.JWT_AUDIENCE || 'edviron-services';
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function getSigningKey() {
  if (ALGO.startsWith('RS')) {
    const key = process.env.JWT_PRIVATE_KEY;
    if (!key) throw new Error('JWT_PRIVATE_KEY required for RS algorithms');
    return key;
  } else {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    return secret;
  }
}

function getVerifyKey() {
  if (ALGO.startsWith('RS')) {
    const key = process.env.JWT_PUBLIC_KEY;
    if (!key) throw new Error('JWT_PUBLIC_KEY required for RS algorithms');
    return key;
  } else {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    return secret;
  }
}

export function signAccessToken(payload) {
  const signKey = getSigningKey();
  const opts = {
    algorithm: ALGO,
    issuer: ISSUER,
    audience: AUD,
    expiresIn: ACCESS_EXPIRES
  };
  return jwt.sign(payload, signKey, opts);
}

export function signRefreshToken(payload) {
  const signKey = getSigningKey();
  const opts = {
    algorithm: ALGO,
    issuer: ISSUER,
    audience: AUD,
    expiresIn: REFRESH_EXPIRES
  };
  return jwt.sign(payload, signKey, opts);
}

export function verifyToken(token) {
  const verifyKey = getVerifyKey();
  return jwt.verify(token, verifyKey, { algorithms: [ALGO], issuer: ISSUER, audience: AUD });
}
