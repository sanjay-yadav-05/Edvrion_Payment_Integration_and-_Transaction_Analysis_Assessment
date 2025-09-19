export function requireRole(roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const userRole = req.user.role;
            if (!userRole) {
                return res.status(403).json({ error: 'Forbidden: role not assigned' });
            }

            if (!allowed.includes(userRole)) {
                return res.status(403).json({ error: 'Forbidden: insufficient role' });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
}
