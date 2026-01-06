"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumerService = void 0;
const kafkajs_1 = require("kafkajs");
const AnalyticsEvent_1 = __importDefault(require("../models/AnalyticsEvent"));
class ConsumerService {
    constructor() {
        this.consumer = null;
        this.isRunning = false;
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'four-in-a-row-consumer',
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        });
        this.consumer = this.kafka.consumer({ groupId: 'four-in-a-row-analytics' });
    }
    async initialize() {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ topic: 'game-events', fromBeginning: false });
            console.log('✅ Kafka Consumer connected and subscribed to game-events');
        }
        catch (error) {
            console.error('❌ Failed to connect Kafka Consumer:', error);
        }
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        try {
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        if (message.value) {
                            const event = JSON.parse(message.value.toString());
                            await this.processEvent(event);
                        }
                    }
                    catch (error) {
                        console.error('Error processing Kafka message:', error);
                    }
                },
            });
            console.log('✅ Kafka Consumer started processing events');
        }
        catch (error) {
            console.error('Error starting Kafka Consumer:', error);
            this.isRunning = false;
        }
    }
    async processEvent(event) {
        try {
            // Store event in database
            const analyticsEvent = {
                gameId: event.gameId,
                eventType: event.eventType,
                timestamp: event.timestamp,
                data: event.data,
            };
            await AnalyticsEvent_1.default.create(analyticsEvent);
            console.log(`📊 Analytics Event Recorded: ${event.eventType} for game ${event.gameId}`);
            // Process specific event types for real-time analytics
            switch (event.eventType) {
                case 'game_finished':
                    await this.updateGameStats(event);
                    break;
                case 'game_started':
                    console.log(`🎮 Game Started: ${event.gameId}`);
                    break;
                case 'move_made':
                    // Can be used for real-time move tracking
                    break;
            }
        }
        catch (error) {
            console.error('Error processing analytics event:', error);
        }
    }
    async updateGameStats(event) {
        // Here you can update aggregated statistics
        console.log(`🏆 Game Finished - Winner: ${event.data.winner}`);
    }
    async disconnect() {
        if (this.consumer) {
            await this.consumer.disconnect();
            console.log('✅ Kafka Consumer disconnected');
        }
    }
}
exports.ConsumerService = ConsumerService;
