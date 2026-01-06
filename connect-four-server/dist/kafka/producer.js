"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducerService = void 0;
const kafkajs_1 = require("kafkajs");
class ProducerService {
    constructor() {
        this.producer = null;
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'four-in-a-row-producer',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        });
        this.producer = this.kafka.producer();
    }
    async initialize() {
        try {
            await this.producer.connect();
            console.log('Kafka Producer connected');
        }
        catch (error) {
            console.error('Failed to connect Kafka Producer:', error);
        }
    }
    async sendEvent(event) {
        try {
            await this.producer.send({
                topic: 'game-events',
                messages: [
                    {
                        key: event.gameId,
                        value: JSON.stringify(event),
                    },
                ],
            });
        }
        catch (error) {
            console.error('Error sending event to Kafka:', error);
        }
    }
    async disconnect() {
        if (this.producer) {
            await this.producer.disconnect();
            console.log('Kafka Producer disconnected');
        }
    }
}
exports.ProducerService = ProducerService;
