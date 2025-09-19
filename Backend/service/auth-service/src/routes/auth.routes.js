import { Router } from 'express';
import { register, login, refreshToken, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

router.get('/me', requireAuth, me);

// Example role-protected demo endpoints:
router.get('/admin-only', requireAuth, requireRole('superadmin'), (req, res) => {
    res.json({ ok: true, secret: 'superadmin data' });
});

router.get('/school-dashboard', requireAuth, requireRole(['school_admin', 'superadmin']), (req, res) => {
    res.json({
        ok: true,
        message: 'Accessible to school_admin and superadmin',
        user: { sub: req.user.sub, role: req.user.role, school_id: req.user.school_id }
    });
});

export default router;
