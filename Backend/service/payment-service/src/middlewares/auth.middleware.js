// simple JWT verification middleware
import jwt from 'jsonwebtoken';

const { verify } = jwt;

export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization header format' });
  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || process.env.JWT_PUBLIC_KEY;
    if (!secret) return res.status(500).json({ error: 'Auth not configured on service' });
    const payload = verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

