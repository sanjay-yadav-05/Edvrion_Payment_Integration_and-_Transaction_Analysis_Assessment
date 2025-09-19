import { Kafka } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'payment-service';

const kafka = new Kafka({ clientId, brokers });
const producer = kafka.producer();

async function connect() {
  await producer.connect();
  console.log('Kafka producer connected');
}

async function disconnect() {
  await producer.disconnect();
  console.log('Kafka producer disconnected');
}

/**
 * send event:
 *  await send({ topic: 'payment.created', messages: [{ key: '...', value: JSON.stringify(payload) }] })
 */
async function send({ topic, messages }) {
  if (!topic) throw new Error('topic required');
  await producer.send({ topic, messages });
}

export default { connect, disconnect, send };
