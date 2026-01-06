import { KafkaGameEvent, GameState } from '../types';
import { ProducerService } from '../kafka/producer';

export class AnalyticsService {
  private producer: ProducerService;

  constructor() {
    this.producer = new ProducerService();
  }

  async initializeProducer(): Promise<void> {
    await this.producer.initialize();
  }

  async trackGameStarted(game: GameState): Promise<void> {
    const event: KafkaGameEvent = {
      eventType: 'game_started',
      gameId: game.id,
      timestamp: new Date(),
      data: {
        players: game.players.map(p => ({
          username: p.username,
          type: p.type,
          color: p.color,
        })),
        startedAt: game.startedAt,
      },
    };

    await this.producer.sendEvent(event);
  }

  async trackMoveMade(game: GameState, column: number, player: string): Promise<void> {
    const event: KafkaGameEvent = {
      eventType: 'move_made',
      gameId: game.id,
      timestamp: new Date(),
      data: {
        column,
        player,
        moveNumber: game.moveHistory.length,
        currentTurn: game.currentTurn,
      },
    };

    await this.producer.sendEvent(event);
  }

  async trackGameFinished(game: GameState): Promise<void> {
    const duration = game.finishedAt
      ? (game.finishedAt.getTime() - game.startedAt!.getTime()) / 1000
      : 0;

    const event: KafkaGameEvent = {
      eventType: 'game_finished',
      gameId: game.id,
      timestamp: new Date(),
      data: {
        winner: game.winner,
        players: game.players.map(p => ({
          username: p.username,
          type: p.type,
          color: p.color,
        })),
        duration,
        totalMoves: game.moveHistory.length,
        finishedAt: game.finishedAt,
      },
    };

    await this.producer.sendEvent(event);
  }

  async trackPlayerDisconnected(gameId: string, player: string, type: 'human' | 'bot'): Promise<void> {
    const event: KafkaGameEvent = {
      eventType: 'player_disconnected',
      gameId,
      timestamp: new Date(),
      data: {
        player,
        type,
      },
    };

    await this.producer.sendEvent(event);
  }

  async trackPlayerReconnected(gameId: string, player: string): Promise<void> {
    const event: KafkaGameEvent = {
      eventType: 'player_reconnected',
      gameId,
      timestamp: new Date(),
      data: {
        player,
      },
    };

    await this.producer.sendEvent(event);
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}
