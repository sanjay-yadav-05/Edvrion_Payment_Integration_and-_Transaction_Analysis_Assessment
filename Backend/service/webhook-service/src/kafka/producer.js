import { Kafka } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'webhook-service';

const kafka = new Kafka({ clientId, brokers });
const producer = kafka.producer();

export async function connect() {
    await producer.connect();
    console.log('Kafka producer connected (webhook-service)');
}

export async function disconnect() {
    await producer.disconnect();
    console.log('Kafka producer disconnected (webhook-service)');
}

export async function send({ topic, messages }) {
    if (!topic) throw new Error('topic required');
    return producer.send({ topic, messages });
}

export default {connect, disconnect, send}