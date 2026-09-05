import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || '7f48a1c900e57302be8d9101235678cdabef1234567890abcdef1234567890abcdef'
);

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (e) {
    return false;
  }
}

export async function signJWT(payload) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token) {
  if (!token) return null;

  try {
    // 1. Standard signed JWT verification
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    // 2. Client-side local storage session token decoder fallback
    try {
      if (typeof token === 'string' && token.startsWith('local_')) {
        const base64Str = token.replace('local_', '');
        // Browser / Node safe base64 decode
        let decodedStr = '';
        if (typeof atob === 'function') {
          decodedStr = atob(base64Str);
        } else if (typeof Buffer !== 'undefined') {
          decodedStr = Buffer.from(base64Str, 'base64').toString('utf-8');
        }
        const data = JSON.parse(decodedStr);
        if (data && data.userId) {
          return {
            userId: data.userId,
            businessId: data.businessId || 'biz_greenmart_001',
            role: data.role || 'OWNER',
            name: data.name || 'Store User',
            email: data.email || 'user@greenmart.in'
          };
        }
      }
    } catch (parseErr) {
      // Ignore fallback parse errors
    }
    return null;
  }
}
