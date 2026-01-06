"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const producer_1 = require("../kafka/producer");
class AnalyticsService {
    constructor() {
        this.producer = new producer_1.ProducerService();
    }
    async initializeProducer() {
        await this.producer.initialize();
    }
    async trackGameStarted(game) {
        const event = {
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
    async trackMoveMade(game, column, player) {
        const event = {
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
    async trackGameFinished(game) {
        const duration = game.finishedAt
            ? (game.finishedAt.getTime() - game.startedAt.getTime()) / 1000
            : 0;
        const event = {
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
    async trackPlayerDisconnected(gameId, player, type) {
        const event = {
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
    async trackPlayerReconnected(gameId, player) {
        const event = {
            eventType: 'player_reconnected',
            gameId,
            timestamp: new Date(),
            data: {
                player,
            },
        };
        await this.producer.sendEvent(event);
    }
    async disconnect() {
        await this.producer.disconnect();
    }
}
exports.AnalyticsService = AnalyticsService;
