"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const consumer_1 = require("./kafka/consumer");
dotenv_1.default.config();
const startAnalyticsService = async () => {
    console.log('📊 Starting Analytics Service...');
    try {
        // Connect to MongoDB
        await (0, database_1.connectDatabase)();
        console.log('✅ Connected to MongoDB');
        // Initialize Kafka consumer
        const consumerService = new consumer_1.ConsumerService();
        await consumerService.initialize();
        console.log('✅ Kafka Consumer initialized');
        // Start consuming events
        await consumerService.start();
        console.log('✅ Analytics Service running');
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n⏸ Shutting down Analytics Service...');
            await consumerService.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to start Analytics Service:', error);
        process.exit(1);
    }
};
startAnalyticsService();
