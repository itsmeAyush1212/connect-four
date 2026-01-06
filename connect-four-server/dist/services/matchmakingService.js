"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingService = void 0;
class MatchmakingService {
    constructor(gameService) {
        this.gameService = gameService;
        this.waitingPlayers = new Map(); // username -> Player
        this.playerTimeouts = new Map(); // username -> timeout
        this.MATCHMAKING_TIMEOUT = 10000; // 10 seconds
    }
    addPlayerToQueue(player, onMatch, onBotMatch) {
        // Remove if already in queue
        if (this.waitingPlayers.has(player.username)) {
            this.removePlayerFromQueue(player.username);
        }
        this.waitingPlayers.set(player.username, player);
        // Check if we can match with another player
        const matchedPlayer = Array.from(this.waitingPlayers.values()).find(p => p.username !== player.username);
        if (matchedPlayer) {
            // Match with another player
            this.removePlayerFromQueue(player.username);
            this.removePlayerFromQueue(matchedPlayer.username);
            const game = this.gameService.createGame(player, matchedPlayer);
            onMatch(game);
        }
        else {
            // Set timeout for bot matching
            const existingTimeout = this.playerTimeouts.get(player.username);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            const timeout = setTimeout(() => {
                if (this.waitingPlayers.has(player.username)) {
                    this.removePlayerFromQueue(player.username);
                    const botPlayer = {
                        id: `bot_${Date.now()}`,
                        username: 'AI Bot',
                        color: 'Y',
                        type: 'bot',
                        connected: true,
                        lastSeen: new Date(),
                    };
                    const game = this.gameService.createGame(player, botPlayer);
                    onBotMatch(game);
                }
            }, this.MATCHMAKING_TIMEOUT);
            this.playerTimeouts.set(player.username, timeout);
        }
    }
    removePlayerFromQueue(username) {
        this.waitingPlayers.delete(username);
        const timeout = this.playerTimeouts.get(username);
        if (timeout) {
            clearTimeout(timeout);
            this.playerTimeouts.delete(username);
        }
    }
    getWaitingPlayersCount() {
        return this.waitingPlayers.size;
    }
    isPlayerWaiting(username) {
        return this.waitingPlayers.has(username);
    }
    getWaitingPlayers() {
        return Array.from(this.waitingPlayers.values());
    }
    cancelMatchmaking(username) {
        this.removePlayerFromQueue(username);
    }
}
exports.MatchmakingService = MatchmakingService;
