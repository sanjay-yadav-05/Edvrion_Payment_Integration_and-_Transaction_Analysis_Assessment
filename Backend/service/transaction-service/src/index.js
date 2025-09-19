import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import transactionsRoutes from './routes/transactions.routes.js';
import { startKafkaConsumer, startCreatedKafkaConsumer } from './services/kafkaConsumer.js';
import { sseKeepAlive } from './services/sseManager.js';

const PORT = process.env.PORT || 3004;

async function start() {
    await connectDB();
    await startKafkaConsumer(); // start consuming payment.updated events
    await startCreatedKafkaConsumer();
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(morgan('combined'));

    app.use('/api/transactions', transactionsRoutes);

    app.get('/health', (req, res) => res.json({ ok: true, service: 'transaction-service' }));

    app.use((err, req, res, next) => {
        console.error('Unhandled error (transaction-service):', err);
        res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });

    const server = app.listen(PORT, () => {
        console.log(`transaction-service listening on port ${PORT}`);
    });

    // SSE keep-alive (if manager requires periodic ping)
    sseKeepAlive(server);

    process.on('SIGINT', () => {
        console.log('Shutting down transaction-service...');
        server.close();
        process.exit(0);
    });
}

start().catch(err => {
    console.error('Failed to start transaction-service', err);
    process.exit(1);
});
