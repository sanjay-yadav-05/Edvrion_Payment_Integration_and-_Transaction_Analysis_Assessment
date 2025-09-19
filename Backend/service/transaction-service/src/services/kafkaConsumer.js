// import { Kafka } from 'kafkajs';
// import TransactionView from '../models/TransactionView.js';
// import Order from '../models/order.js';
// import OrderStatus from '../models/OrderStatus.js';
// import { notifySseUpdate } from './sseManager.js';
// import User from '../models/user.js';

// const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
// const clientId = process.env.KAFKA_CLIENT_ID || 'transaction-service';
// const topic = process.env.KAFKA_TOPIC_PAYMENT_UPDATED || 'payment.updated';

// const kafka = new Kafka({ clientId, brokers });
// const consumer = kafka.consumer({ groupId: 'transaction-service-group' });

// export async function startKafkaConsumer() {
//     await consumer.connect();
//     await consumer.subscribe({ topic, fromBeginning: false });
//     console.log('Kafka consumer subscribed to', topic);

//     await consumer.run({
//         eachMessage: async ({ topic, partition, message }) => {
//             try {
//                 const payload = JSON.parse(message.value.toString());
//                 const data = payload.data || {};
//                 console.log(data);
//                 // attempt to find the linked order
//                 let order = null;
//                 if (data.order_id) {
//                     order = await Order.findById(data.order_id).lean();
//                 } else if (data.collect_request_id) {
//                     order = await Order.findOne({ collect_request_id: data.collect_request_id }).lean();
//                 }

//                 // upsert TransactionView
//                 const filter = { collect_request_id: data.collect_request_id || null };
//                 const update = {
//                     collect_request_id: data.collect_request_id || null,
//                     order_id: order?._id || null,
//                     custom_order_id: order?.custom_order_id || null,
//                     school_id: order?.school_id || data.school_id || null,
//                     student_info: order?.student_info || data.student_info || null,
//                     gateway_name: order?.gateway_name || data.gateway || null,
//                     order_amount: data.order_amount || order?.order_amount || null,
//                     transaction_amount: data.transaction_amount || null,
//                     status: data.status || 'PENDING',
//                     payment_mode: data.payment_mode || null,
//                     payment_time: data.payment_time ? new Date(data.payment_time) : null,
//                     metadata: order?.metadata || {}
//                 };
//                 update.last_updated = new Date();

//                 const transaction = await TransactionView.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });

//                 // Optionally update orders/order_status in DB for strong consistency
//                 if (order) {
//                     await Order.findByIdAndUpdate(order._id, { status: update.status });
//                 }

//                 if (data.collect_request_id) {
//                     await OrderStatus.findOneAndUpdate(
//                         { collect_request_id: data.collect_request_id },
//                         {
//                             $set: {
//                                 transaction_amount: data.transaction_amount,
//                                 payment_mode: data.payment_mode,
//                                 bank_reference: data.bank_reference,
//                                 payment_message: data.payment_message,
//                                 status: data.status,
//                                 payment_time: data.payment_time ? new Date(data.payment_time) : null,
//                                 processed_at: new Date()
//                             }
//                         },
//                         { upsert: true }
//                     );
//                 }
//                 console.log('Upserted TransactionView:', transaction);
//                 console.log(order)
//                 // await User.findByIdAndUpdate(
//                 //     transaction.user_id,
//                 //     { $push: { TransactionViews: transaction._id } },
//                 //     { new: true } // optional: to get the updated user document
//                 // );
//                 // notify SSE clients
//                 await notifySseUpdate(update);

//             } catch (err) {
//                 console.error('Error processing kafka message in transaction-service:', err);
//             }
//         }
//     });
// }

// export async function stopKafkaConsumer() {
//     await consumer.disconnect();
// }





import { Kafka } from 'kafkajs';
import TransactionView from '../models/TransactionView.js';
import Order from '../models/order.js';
import OrderStatus from '../models/OrderStatus.js';
import { notifySseUpdate } from './sseManager.js';
import User from '../models/user.js';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'transaction-service';
const topic = process.env.KAFKA_TOPIC_PAYMENT_UPDATED || 'payment.updated';

const kafka = new Kafka({ clientId, brokers });
const consumer = kafka.consumer({ groupId: 'transaction-service-group' });

export async function startKafkaConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log('Kafka consumer subscribed to', topic);

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const payload = JSON.parse(message.value.toString());
                const data = payload.data || {};
                console.log(data);
                // attempt to find the linked order
                let order = null;
                if (data.order_id) {
                    order = await Order.findById(data.order_id).lean();
                } else if (data.collect_request_id) {
                    order = await Order.findOne({ collect_request_id: data.collect_request_id }).lean();
                }

                // upsert TransactionView
                const filter = { collect_request_id: data.collect_request_id || null };
                const update = {
                    collect_request_id: data.collect_request_id || null,
                    order_id: order?._id || null,
                    custom_order_id: order?.custom_order_id || null,
                    school_id: order?.school_id || data.school_id || null,
                    student_info: order?.student_info || data.student_info || null,
                    gateway_name: order?.gateway_name || data.gateway || null,
                    order_amount: data.order_amount || order?.order_amount || null,
                    transaction_amount: data.transaction_amount || null,
                    status: data.status || 'PENDING',
                    payment_mode: data.payment_mode || null,
                    payment_time: data.payment_time ? new Date(data.payment_time) : null,
                    metadata: order?.metadata || {}
                };
                update.last_updated = new Date();

                const transaction = await TransactionView.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });

                // Optionally update orders/order_status in DB for strong consistency
                if (order) {
                    await Order.findByIdAndUpdate(order._id, { status: update.status });
                }

                if (data.collect_request_id) {
                    await OrderStatus.findOneAndUpdate(
                        { collect_request_id: data.collect_request_id },
                        {
                            $set: {
                                transaction_amount: data.transaction_amount,
                                // payment_mode: data.payment_mode,
                                // bank_reference: data.bank_reference,
                                // payment_message: data.payment_message,
                                status: data.status,
                                payment_time: data.payment_time ? new Date(data.payment_time) : null,
                                processed_at: new Date()
                            }
                        },
                        { upsert: true }
                    );
                }
                console.log('Upserted TransactionView:', transaction);
                console.log(order);
                await User.findByIdAndUpdate(
                    order.user_id,
                    { $push: { TransactionViews: transaction._id } },
                    { new: true } // optional: to get the updated user document
                );
                // notify SSE clients
                await notifySseUpdate(update);

            } catch (err) {
                console.error('Error processing kafka message in transaction-service:', err);
            }
        }
    });
}

export async function stopKafkaConsumer() {
    await consumer.disconnect();
}

// New consumer for the 'payment.created' topic
const createdTopic = process.env.KAFKA_TOPIC_PAYMENT_CREATED || 'payment.created';
const createdConsumer = kafka.consumer({ groupId: 'transaction-service-group-created' });

export async function startCreatedKafkaConsumer() {
    await createdConsumer.connect();
    await createdConsumer.subscribe({ topic: createdTopic, fromBeginning: false });
    console.log('Kafka consumer subscribed to', createdTopic);

    await createdConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const payload = JSON.parse(message.value.toString());
                const data = payload.data || {};
                console.log(data);

                // Find the linked order
                let order = null;
                if (data.order_id) {
                    order = await Order.findById(data.order_id ).lean();
                } else if (data.collect_request_id) {
                    order = await Order.findOne({ collect_request_id: data.collect_request_id }).lean();
                }

                if (!order) {
                    console.error(`Order not found for collect_request_id: ${data.collect_request_id}`);
                    return;
                }

                // Create TransactionView
                const filter = { collect_request_id: data.collect_request_id || null };
                const update = {
                    collect_request_id: data.collect_request_id || null,
                    order_id: order._id || null,
                    custom_order_id: order.custom_order_id || null,
                    school_id: order.school_id || data.school_id || null,
                    student_info: order.student_info || data.student_info || null,
                    gateway_name: order.gateway_name || data.gateway || null,
                    order_amount: order.order_amount || null,
                    transaction_amount: data.transaction_amount || null,
                    status: data.status || 'PENDING',
                    payment_mode: data.payment_mode || null,
                    payment_time: data.payment_time ? new Date(data.payment_time) : null,
                    metadata: order.metadata || {}
                };
                update.last_updated = new Date();

                const transaction = await TransactionView.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });

                // Update the Order and OrderStatus documents
                
                await OrderStatus.findOneAndUpdate(
                    { collect_request_id: data.collect_request_id },
                    { $set: { status: update.status, processed_at: new Date() } },
                    { upsert: true }
                    );
                    
                await Order.findByIdAndUpdate(order._id, { status: update.status });

                // Push transaction ID to the user's TransactionViews array
                await User.findByIdAndUpdate(
                    order.user_id,
                    { $push: { TransactionViews: transaction._id } },
                    { new: true }
                );

                console.log('Created and linked new TransactionView:', transaction);
                await notifySseUpdate(update);

            } catch (err) {
                console.error('Error processing kafka message in transaction-service:', err);
            }
        }
    });
}

export async function stopCreatedKafkaConsumer() {
    await createdConsumer.disconnect();
}