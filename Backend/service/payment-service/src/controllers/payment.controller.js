import Order from '../models/order.js';
import OrderStatus from '../models/orderStatus.js';
import gateway from '../services/gateway.service.js';
import kafkaProducer from '../kafka/producer.js';

export async function createPayment(req, res, next) {
    try {
        const {user_id, student_info, school_id, amount, callback_url, custom_order_id, metadata } = req.body;
        if (!school_id || !amount || !callback_url) {
            return res.status(400).json({ error: 'school_id, amount and callback_url are required' });
        }

        const order = await Order.create({
            user_id,
            custom_order_id,
            school_id,
            trustee_id: req.body.trustee_id || null,
            student_info: student_info || {},
            order_amount: Number(amount),
            metadata,
            // reconcile_attempts: 0,
            // last_reconcile_at: null,
            status: 'PENDING'
        });

        const providerResp = await gateway.createCollectRequest({ school_id, amount, callback_url });
        console.log('providerResp:', JSON.stringify(providerResp, null, 2));
        const collectId = providerResp.collect_request_id;
        const collectUrl = providerResp.collect_request_url;

        order.collect_request_id = collectId;
        order.collect_url = collectUrl;
        await order.save();

        await OrderStatus.findOneAndUpdate(
            { collect_request_id: collectId },
            {  collect_request_id: collectId, order_id: order._id, order_amount: Number(amount), status: 'PENDING' },
            { upsert: true, new: true }
        );

        const event = {
            type: 'payment.created',
            data: {
                user_id: user_id || null,
                order_id: order._id.toString(),
                collect_request_id: collectId,
                school_id,
                student_info: req.body.student_info || {},
                order_amount: Number(amount),
                collect_url: collectUrl
            },
            ts: new Date().toISOString()
        };

        await kafkaProducer.send({
            topic: process.env.KAFKA_TOPIC_PAYMENT_CREATED || 'payment.created',
            messages: [{ key: collectId || order._id.toString(), value: JSON.stringify(event) }]
        });

        res.json({ order_id: order._id, collect_request_id: collectId, collect_request_url: collectUrl });
    } catch (err) {
        next(err);
    }
}

export async function checkStatus(req, res, next) {
    try {
        const { collect_request_id } = req.params;
        const school_id = req.query.school_id;
        if (!collect_request_id || !school_id) {
            return res.status(400).json({ error: 'collect_request_id and school_id required' });
        }

        const providerResp = await gateway.checkCollectRequest({ collect_request_id, school_id });
        const provStatus = (providerResp.status || '').toUpperCase() || 'PENDING';

        await OrderStatus.findOneAndUpdate(
            { collect_request_id },
            { status: provStatus, transaction_amount: providerResp.amount || null },
            { upsert: true }
        );

        res.json({ provider: providerResp });
    } catch (err) {
        next(err);
    }
}
