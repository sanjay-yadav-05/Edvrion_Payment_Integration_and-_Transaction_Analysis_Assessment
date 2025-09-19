import bcrypt from 'bcryptjs';
import { hashPassword, comparePassword } from '../utils/password.js';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
    try {
        const { email, password, name, role, student_id, school_id } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password required' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ error: 'email already registered' });

        const passwordHash = await hashPassword(password);
        const user = await User.create({ email, passwordHash, name, role, school_id, student_info :{id : student_id,name, email } });

        res.status(201).json({ id: user._id, email: user.email });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/login
 */
// export async function login(req, res, next) {
//     try {
//         console.log("hi")
//         const { email, password } = req.body;
//         if (!email || !password) return res.status(400).json({ error: 'email and password required' });

//         const user = await User.findOne({ email });
//         if (!user) return res.status(401).json({ error: 'invalid credentials' });

//         const ok = await comparePassword(password, user.passwordHash);
//         if (!ok) return res.status(401).json({ error: 'invalid credentials' });

//         const payload = { sub: user._id.toString(), role: user.role, school_id: user.school_id || null, email: user.email };

//         const accessToken = signAccessToken(payload);
//         const refreshToken = signRefreshToken(payload);

//         const decoded = verifyToken(refreshToken);
//         const expiresAt = new Date(decoded.exp * 1000);

//         user.refreshToken = { token: refreshToken, expiresAt } ;
//         await user.save();

//         res.json({ accessToken, refreshToken, user :{}});
//         // res.json({ accessToken, refreshToken, user, expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' });
//     } catch (err) {
//         next(err);
//     }
// }


export async function login(req, res, next) {
    try {
        console.log("hi")
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'invalid credentials' });

        const ok = await comparePassword(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'invalid credentials' });

        const payload = { sub: user._id.toString(), role: user.role, school_id: user.school_id || null, email: user.email };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        const decoded = verifyToken(refreshToken);
        const expiresAt = new Date(decoded.exp * 1000);

        user.refreshToken = { token: refreshToken, expiresAt } ;
        await user.save();

        // ----------------- The fix is here -----------------
        const userWithoutSensitiveData = {
            id: user._id,
            role: user.role,
            email: user.email,
            school_id: user.school_id,
            student_info: user.student_info,
            // Add any other non-sensitive fields you need
        };

        res.json({ accessToken, refreshToken, user: userWithoutSensitiveData });
        
        // The original code you had was:
        // res.json({ accessToken, refreshToken, user :{}});
        
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/refresh
 */
export async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

        let decoded;
        try {
            decoded = verifyToken(refreshToken);
        } catch (e) {
            return res.status(401).json({ error: 'invalid refresh token' });
        }

        const user = await User.findById(decoded.sub);
        if (!user) return res.status(401).json({ error: 'invalid token user' });

        const found = user.refreshTokens.find(rt => rt.token === refreshToken);
        if (!found) return res.status(401).json({ error: 'refresh token revoked' });

        if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
            user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
            await user.save();
            return res.status(401).json({ error: 'refresh token expired' });
        }

        const payload = { sub: user._id.toString(), role: user.role, school_id: user.school_id || null, email: user.email };
        const accessToken = signAccessToken(payload);

        res.json({ accessToken, expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

        let decoded;
        try {
            decoded = verifyToken(refreshToken);
        } catch (e) {
            decoded = null;
        }

        if (decoded && decoded.sub) {
            const user = await User.findById(decoded.sub);
            if (user) {
                user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
                await user.save();
            }
        }
        return res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/auth/me
 */
export async function me(req, res, next) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'not authenticated' });

        res.json({
            sub: user.sub,
            role: user.role,
            school_id: user.school_id,
            email: user.email || null
        });
    } catch (err) {
        next(err);
    }
}