"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectKafka = exports.getKafkaProducer = exports.initKafka = void 0;
const kafkajs_1 = require("kafkajs");
let producer = null;
const initKafka = async () => {
    try {
        const kafka = new kafkajs_1.Kafka({
            clientId: '4-in-a-row-backend',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            logLevel: kafkajs_1.logLevel.ERROR,
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });
        producer = kafka.producer();
        await producer.connect();
        console.log('Kafka producer connected');
        return producer;
    }
    catch (error) {
        console.error('Kafka connection failed, continuing without analytics:', error);
        return null;
    }
};
exports.initKafka = initKafka;
const getKafkaProducer = () => producer;
exports.getKafkaProducer = getKafkaProducer;
const disconnectKafka = async () => {
    if (producer) {
        await producer.disconnect();
        console.log('Kafka producer disconnected');
    }
};
exports.disconnectKafka = disconnectKafka;
