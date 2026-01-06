import { Kafka, Producer } from 'kafkajs';
import { KafkaGameEvent } from '../types';

export class ProducerService {
  private producer: Producer | null = null;
  private kafka: Kafka;

  constructor() {
    const kafkaBrokers = process.env.KAFKA_BROKERS || '';
    
    this.kafka = new Kafka({
      clientId: 'four-in-a-row-producer',
      brokers: kafkaBrokers.split(',').filter(Boolean),
    });
    this.producer = this.kafka.producer();
  }

  async initialize(): Promise<void> {
    try {
      await this.producer!.connect();
      console.log('✅ Kafka Producer connected');
    } catch (error) {
      console.error('❌ Failed to connect Kafka Producer:', error);
    }
  }

  async sendEvent(event: KafkaGameEvent): Promise<void> {
    try {
      await this.producer!.send({
        topic: 'game-events',
        messages: [
          {
            key: event.gameId,
            value: JSON.stringify(event),
          },
        ],
      });
    } catch (error) {
      console.error('Error sending event to Kafka:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      console.log('✅ Kafka Producer disconnected');
    }
  }
}
