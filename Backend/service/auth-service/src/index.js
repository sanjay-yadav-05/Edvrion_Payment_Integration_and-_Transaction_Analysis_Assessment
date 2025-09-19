import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';

const PORT = process.env.PORT || 3000;

async function start() {
    await connectDB();

    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(morgan('combined'));

    app.use('/api/auth', authRoutes);

    app.get('/health', (req, res) => res.json({ ok: true, service: 'auth-service' }));

    // global error handler
    app.use((err, req, res, next) => {
        console.error('Unhandled error', err);
        res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });

    const server = app.listen(PORT, () => {
        console.log(`auth-service listening on port ${PORT}`);
    });

    const shutdown = async () => {
        console.log('Shutting down auth-service...');
        server.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start().catch((err) => {
    console.error('Failed to start auth-service', err);
    process.exit(1);
});
