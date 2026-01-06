import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { ConsumerService } from './kafka/consumer';

dotenv.config();

const startAnalyticsService = async () => {
  console.log('📊 Starting Analytics Service...');

  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Initialize Kafka consumer
    const consumerService = new ConsumerService();
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
  } catch (error) {
    console.error('❌ Failed to start Analytics Service:', error);
    process.exit(1);
  }
};

startAnalyticsService();
