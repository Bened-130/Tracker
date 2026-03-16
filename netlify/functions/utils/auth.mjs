import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-min-32-chacters';

export function verifyToken(authHeader) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}