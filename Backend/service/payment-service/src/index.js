import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import connectDB  from './config/db.js';
import paymentRoutes from './routes/payment.routes.js';
import kafkaProducer from './kafka/producer.js';

const PORT = process.env.PORT || 3001;

async function start() {
    await connectDB();
    await kafkaProducer.connect();

    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(morgan('combined'));

    app.use('/api/payments', paymentRoutes);

    app.get('/health', (req, res) => res.json({ ok: true, service: 'payment-service' }));

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });

    const server = app.listen(PORT, () => {
        console.log(`payment-service listening on port ${PORT}`);
    });

    const shutdown = async () => {
        console.log('Shutting down payment-service...');
        server.close();
        await kafkaProducer.disconnect();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start().catch(err => {
    console.error('Failed to start service', err);
    process.exit(1);
});
