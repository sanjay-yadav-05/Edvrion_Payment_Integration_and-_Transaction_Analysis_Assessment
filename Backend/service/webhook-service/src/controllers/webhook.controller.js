import WebhookLog from '../models/WebhookLog.js';
import Order from '../models/Order.js';
import OrderStatus from '../models/OrderStatus.js';
import { verifyHmacSignature } from '../utils/verify.js';
import * as kafkaProducer from '../kafka/producer.js';

/**
 * Expected provider payload shape — be defensive:
 * {
 *   "status": "SUCCESS",
 *   "order_info": {
 *      "order_id": "collect_id/txid",
 *      "order_amount": 100,
 *      "transaction_amount": 100,
 *      "gateway": "PhonePe",
 *      "bank_reference": "XYZ",
 *      "status": "success",
 *      "payment_time": "2025-04-23T08:14:21.945+00:00",
 *      ...
 *   }
 * }
 */

export async function handleWebhook(req, res, next) {
    try {
        const rawBody = Buffer.from(JSON.stringify(req.body));
        const headers = req.headers || {};
        // const sourceIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

        // Verify signature if required
        // const requireSig = (process.env.WEBHOOK_REQUIRE_SIGNATURE || 'true').toLowerCase() === 'true';
        // let verified = false;
        // if (requireSig) {
        //     const sigHeader = headers['x-pg-signature'] || headers['x-signature'] || headers['x-hub-signature'];
        //     verified = verifyHmacSignature(rawBody, sigHeader || '', process.env.WEBHOOK_SECRET || '');
        // } else {
        //     verified = true; // if not required, mark true
        // }

        // persist raw payload
        const log = await WebhookLog.create({
            provider: 'edviron-vanilla',
            raw_payload: req.body,
            raw_body: rawBody,
            headers,
            received_at: new Date(),
            // verified,
            // source_ip: sourceIp
        });

        // If not verified, still respond 200 (optionally alert), but do not process
        // if (!verified) {
        //     console.warn('Webhook signature verification failed for log id:', log._id.toString());
        //     // respond 200 to provider to avoid retries (depends on policy) — or return 4xx to force retry.
        //     return res.status(200).json({ ok: true, note: 'received but not verified' });
        // }

        // Extract order info
        const payload = req.body || {};
        const order_info = payload.order_info || payload.data || payload;
        // provider may send order_id as "collect_id" or "collect_request_id"
        let collect_request_id = order_info.order_id || order_info.collect_request_id || null;
        // if order_id has txid appended like "collectId/txid", extract left part
        if (collect_request_id && collect_request_id.includes('/')) {
            collect_request_id = collect_request_id.split('/')[0];
        }

        if (!collect_request_id) {
            console.warn('Webhook missing collect_request_id; logged as raw only', log._id.toString());
            return res.status(200).json({ ok: true, note: 'no collect_request_id found' });
        }

        const provStatusRaw = (order_info.status || payload.status || '').toString().toUpperCase();
        const mappedStatus = mapProviderToInternalStatus(provStatusRaw);

        // Idempotent upsert: find order by collect_request_id
        const order = await Order.findOne({ collect_request_id });
        // order.status = order_info.status || mappedStatus || order.status;
        // order.save(); // async, don't await
        let orderId = order ? order._id : null;

        // create or update OrderStatus
        const statusDoc = {
            collect_request_id,
            order_id: orderId,
            order_amount: Number(order_info.order_amount || order?.order_amount || 0),
            transaction_amount: order_info.transaction_amount || order_info.amount || null,
            payment_mode: order_info.payment_mode || order_info.gateway || null,
            payment_details: order_info.payment_details || null,
            bank_reference: order_info.bank_reference || order_info.bank_ref || null,
            payment_message: order_info.payment_message || order_info.message || null,
            status: mappedStatus,
            payment_time: order_info.payment_time ? new Date(order_info.payment_time) : new Date()
        };

        // upsert OrderStatus
        const updatedStatus = await OrderStatus.findOneAndUpdate(
            { collect_request_id },
            { $set: statusDoc },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );



        // if we know the order, update its status too
        // if (order) {
        //     order.status = mappedStatus;
        //     if (mappedStatus === 'PENDING') {
        //         // still pending → keep attempts history
        //         order.last_reconcile_at = new Date();
        //     } else {
        //         // terminal (SUCCESS / FAILED) → reset attempts
        //         order.reconcile_attempts = 0;
        //         order.last_reconcile_at = new Date();
        //     }
        //     await order.save();
        // }


        // Publish Kafka event
        const event = {
            type: 'payment.updated',
            data: {
                user_id: order ? order.user_id.toString() : null,
                order_id: orderId ? orderId.toString() : null,
                collect_request_id,
                status: mappedStatus,
                trustee_id: order?.trustee_id || null,
                student_info: order.student_info || {},
                school_id: order ? order.school_id : null,
                transaction_amount: statusDoc.transaction_amount,
                payment_mode: statusDoc.payment_mode,
                bank_reference: statusDoc.bank_reference,
                payment_time: statusDoc.payment_time,
                raw: order_info
            },
            ts: new Date().toISOString()
        };

        const topic = process.env.KAFKA_TOPIC_PAYMENT_UPDATED || 'payment.updated';
        await kafkaProducer.send({
            topic,
            messages: [{ key: collect_request_id, value: JSON.stringify(event) }]
        });

        // ack provider
        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error('Webhook processing error:', err);
        // respond 200 or 500 depending on desired retry semantics; we choose 200 to avoid provider retries for duplicate processing unless desired.
        return res.status(500).json({ ok: false });
    }
}

function mapProviderToInternalStatus(raw) {
    if (!raw) return 'PENDING';
    const s = raw.toUpperCase();
    if ([ 200 ,'200','SUCCESS', 'COMPLETED', 'PAID', 'CAPTURED'].includes(s)) return 'SUCCESS';
    if (['FAILED', 'FAILED_TO_CAPTURE', 'DENIED', 'CANCELLED', 'DECLINED'].includes(s)) return 'FAILED';
    return 'PENDING';
}
