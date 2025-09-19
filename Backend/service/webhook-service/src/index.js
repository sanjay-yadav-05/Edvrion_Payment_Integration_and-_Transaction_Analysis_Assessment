import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import webhookRoutes from './routes/webhook.routes.js';
import kafkaProducer from './kafka/producer.js';
import { handleWebhook } from './controllers/webhook.controller.js';

const PORT = process.env.PORT || 3003;

async function start() {
    await connectDB();
    await kafkaProducer.connect();

    const app = express();

    // IMPORTANT: we need raw body for signature verification. Use express.json with verify
    app.use(express.json({
        limit: '1mb',
        verify: (req, res, buf) => {
            // store raw body buffer for signature verification
            req.rawBody = buf;
        }
    }));

    app.use(helmet());
    app.use(cors());
    app.use(morgan('combined'));

    app.use('/webhook', handleWebhook);

    app.get('/health', (req, res) => res.json({ ok: true, service: 'webhook-service' }));

    app.use((err, req, res, next) => {
        console.error('Unhandled error in webhook-service:', err);
        res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });

    const server = app.listen(PORT, () => {
        console.log(`webhook-service listening on port ${PORT}`);
    });

    // graceful shutdown
    const shutdown = async () => {
        console.log('Shutting down webhook-service...');
        server.close();
        await kafkaProducer.disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start().catch(err => {
    console.error('Failed to start webhook-service', err);
    process.exit(1);
});
