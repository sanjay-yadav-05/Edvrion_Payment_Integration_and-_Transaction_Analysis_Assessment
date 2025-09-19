import jwt from 'jsonwebtoken';
import User from '../models/order.js'; // not loading users here, just demo

export async function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });

        const parts = auth.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });

        const token = parts[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'hideUnderTable', { algorithms: [process.env.JWT_ALGORITHM || 'HS256'] });
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // At minimum we expect payload to have sub and school_id
        req.user = {
            sub: decoded.sub,
            role: decoded.role,
            school_id: decoded.school_id,
            email: decoded.email
        };
        next();
    } catch (err) {
        next(err);
    }
}
