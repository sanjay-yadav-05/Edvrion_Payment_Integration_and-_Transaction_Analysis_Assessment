import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });

        const parts = auth.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });

        const token = parts[1];
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await User.findById(decoded.sub).select('email role school_id');
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.user = {
            sub: decoded.sub,
            role: user.role,
            school_id: user.school_id,
            email: user.email
        };

        next();
    } catch (err) {
        next(err);
    }
}
