import { Kafka, Consumer } from 'kafkajs';
import { KafkaGameEvent } from '../types';
import AnalyticsEventModel from '../models/AnalyticsEvent';

export class ConsumerService {
  private consumer: Consumer | null = null;
  private kafka: Kafka;
  private isRunning = false;

  constructor() {
    const kafkaBrokers = process.env.KAFKA_BROKERS || '';
  
    
    this.kafka = new Kafka({
      clientId: 'four-in-a-row-consumer',
      brokers: kafkaBrokers.split(',').filter(Boolean),
    });
    this.consumer = this.kafka.consumer({ groupId: 'four-in-a-row-analytics' });
  }

  async initialize(): Promise<void> {
    try {
      await this.consumer!.connect();
      await this.consumer!.subscribe({ topic: 'game-events', fromBeginning: false });
      console.log('Kafka Consumer connected and subscribed to game-events');
    } catch (error) {
      console.error('Failed to connect Kafka Consumer:', error);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.consumer!.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (message.value) {
              const event = JSON.parse(message.value.toString()) as KafkaGameEvent;
              await this.processEvent(event);
            }
          } catch (error) {
            console.error('Error processing Kafka message:', error);
          }
        },
      });
      console.log('✅ Kafka Consumer started processing events');
    } catch (error) {
      console.error('Error starting Kafka Consumer:', error);
      this.isRunning = false;
    }
  }

  private async processEvent(event: KafkaGameEvent): Promise<void> {
    try {
      // Store event in database
      const analyticsEvent = {
        gameId: event.gameId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        data: event.data,
      };

      await AnalyticsEventModel.create(analyticsEvent);
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
    } catch (error) {
      console.error('Error processing analytics event:', error);
    }
  }

  private async updateGameStats(event: KafkaGameEvent): Promise<void> {
    // Here you can update aggregated statistics
    console.log(`Game Finished - Winner: ${event.data.winner}`);
  }

  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      console.log('Kafka Consumer disconnected');
    }
  }
}
