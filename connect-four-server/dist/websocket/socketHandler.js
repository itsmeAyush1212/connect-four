"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketHandler = void 0;
const gameServices_1 = require("../services/gameServices");
const matchmakingService_1 = require("../services/matchmakingService");
const analyticsService_1 = require("../services/analyticsService");
const botServices_1 = require("../services/botServices");
const Player_1 = __importDefault(require("../models/Player"));
class SocketHandler {
    constructor(io) {
        this.io = io;
        this.disconnectionTimers = new Map();
        this.playerToGame = new Map(); // playerId -> gameId
        this.gameService = new gameServices_1.GameService();
        this.matchmakingService = new matchmakingService_1.MatchmakingService(this.gameService);
        this.analyticsService = new analyticsService_1.AnalyticsService();
        this.botService = new botServices_1.BotService();
    }
    async initialize() {
        await this.analyticsService.initializeProducer();
        this.io.on('connection', (socket) => {
            console.log(`✅ Client connected: ${socket.id}`);
            socket.on('find_match', (data) => this.handleFindMatch(socket, data));
            socket.on('make_move', (data) => this.handleMakeMove(socket, data));
            socket.on('reconnect_game', (data) => this.handleReconnect(socket, data));
            socket.on('disconnect', () => this.handleDisconnect(socket));
            socket.on('cancel_matchmaking', () => this.handleCancelMatchmaking(socket));
        });
    }
    async handleFindMatch(socket, data) {
        try {
            const { username } = data;
            if (!username || username.trim().length === 0) {
                socket.emit('error', { message: 'Username is required' });
                return;
            }
            // Ensure player exists in database
            await Player_1.default.findOneAndUpdate({ username }, { $setOnInsert: { gamesWon: 0, gamesPlayed: 0 } }, { upsert: true, new: true });
            const player = {
                id: socket.id,
                username,
                color: 'R',
                type: 'human',
                connected: true,
                lastSeen: new Date(),
            };
            socket.emit('matchmaking_started', { message: 'Looking for opponent...', waitingPlayers: this.matchmakingService.getWaitingPlayersCount() });
            // Add player to queue
            this.matchmakingService.addPlayerToQueue(player, (game) => this.onPlayerMatch(game), (game) => this.onBotMatch(game));
        }
        catch (error) {
            console.error('Error in find_match:', error);
            socket.emit('error', { message: 'Failed to find match' });
        }
    }
    onPlayerMatch(game) {
        // Notify both players
        game.players.forEach((player) => {
            const socket = this.io.sockets.sockets.get(player.id);
            if (socket) {
                socket.join(game.id);
                this.playerToGame.set(player.id, game.id);
                socket.emit('game_started', {
                    game,
                    yourColor: player.color,
                    opponent: game.players.find(p => p.id !== player.id),
                });
            }
        });
        this.analyticsService.trackGameStarted(game);
        console.log(`🎮 Game Started: ${game.id} - ${game.players[0].username} vs ${game.players[1].username}`);
    }
    onBotMatch(game) {
        const humanPlayer = game.players.find(p => p.type === 'human');
        const socket = this.io.sockets.sockets.get(humanPlayer.id);
        if (socket) {
            socket.join(game.id);
            this.playerToGame.set(humanPlayer.id, game.id);
            socket.emit('game_started', {
                game,
                yourColor: humanPlayer.color,
                opponent: game.players.find(p => p.type === 'bot'),
            });
        }
        this.analyticsService.trackGameStarted(game);
        console.log(`🤖 Game Started vs Bot: ${game.id} - ${humanPlayer.username} vs AI Bot`);
        // Bot makes first move if it's bot's turn
        if (game.currentTurn === 'Y') {
            setTimeout(() => this.makeBotMove(game.id), 1000);
        }
    }
    async handleMakeMove(socket, data) {
        try {
            const { gameId, column } = data;
            const game = this.gameService.getGame(gameId);
            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }
            const player = game.players.find(p => p.id === socket.id);
            if (!player) {
                socket.emit('error', { message: 'Not a player in this game' });
                return;
            }
            const result = this.gameService.makeMove(gameId, column, player.color);
            if (!result.success) {
                socket.emit('move_error', { message: result.error });
                return;
            }
            const updatedGame = result.game;
            // Emit move to all players
            this.io.to(gameId).emit('move_made', {
                game: updatedGame,
                column,
                player: player.username,
            });
            await this.analyticsService.trackMoveMade(updatedGame, column, player.username);
            // Check if game is finished
            if (updatedGame.status === 'finished') {
                await this.handleGameFinished(updatedGame);
            }
            else {
                // Check if bot should play
                const botPlayer = updatedGame.players.find(p => p.type === 'bot');
                if (botPlayer && botPlayer.color === updatedGame.currentTurn && updatedGame.status === 'playing') {
                    setTimeout(() => this.makeBotMove(gameId), 800);
                }
            }
        }
        catch (error) {
            console.error('Error in make_move:', error);
            socket.emit('error', { message: 'Failed to make move' });
        }
    }
    makeBotMove(gameId) {
        const game = this.gameService.getGame(gameId);
        if (!game || game.status !== 'playing')
            return;
        const botPlayer = game.players.find(p => p.type === 'bot');
        if (!botPlayer)
            return;
        const bestColumn = this.botService.getBestMove(game, botPlayer.color);
        const result = this.gameService.makeMove(gameId, bestColumn, botPlayer.color);
        if (result.success && result.game) {
            const updatedGame = result.game;
            this.io.to(gameId).emit('move_made', {
                game: updatedGame,
                column: bestColumn,
                player: 'AI Bot',
            });
            this.analyticsService.trackMoveMade(updatedGame, bestColumn, 'AI Bot');
            if (updatedGame.status === 'finished') {
                this.handleGameFinished(updatedGame);
            }
        }
    }
    async handleGameFinished(game) {
        const duration = game.finishedAt && game.startedAt ? (game.finishedAt.getTime() - game.startedAt.getTime()) / 1000 : 0;
        // Update player stats
        for (const player of game.players) {
            if (player.type === 'human') {
                const won = game.winner === player.color;
                await Player_1.default.findOneAndUpdate({ username: player.username }, {
                    $inc: {
                        gamesPlayed: 1,
                        gamesWon: won ? 1 : 0,
                    },
                    $set: { lastPlayedAt: new Date() },
                });
            }
        }
        await this.analyticsService.trackGameFinished(game);
        this.io.to(game.id).emit('game_finished', {
            game,
            winner: game.winner,
            duration,
        });
        console.log(`✅ Game Finished: ${game.id} - Winner: ${game.winner}`);
        // Clean up after 1 minute
        setTimeout(() => {
            this.gameService.deleteGame(game.id);
            game.players.forEach(p => this.playerToGame.delete(p.id));
        }, 60000);
    }
    async handleReconnect(socket, data) {
        try {
            const { gameId, username } = data;
            const game = this.gameService.getGame(gameId);
            if (!game) {
                socket.emit('reconnect_failed', { message: 'Game not found' });
                return;
            }
            // Clear disconnection timer
            const timerKey = `${gameId}_${username}`;
            const timer = this.disconnectionTimers.get(timerKey);
            if (timer) {
                clearTimeout(timer);
                this.disconnectionTimers.delete(timerKey);
            }
            // Update player connection status
            const player = game.players.find(p => p.username === username);
            if (player) {
                player.id = socket.id;
                player.connected = true;
                player.lastSeen = new Date();
                this.playerToGame.set(socket.id, gameId);
                socket.join(gameId);
                this.io.to(gameId).emit('player_reconnected', {
                    username,
                    game,
                });
                socket.emit('game_reconnected', {
                    game,
                    yourColor: player.color,
                });
                await this.analyticsService.trackPlayerReconnected(gameId, username);
                console.log(`🔄 Player Reconnected: ${username} to game ${gameId}`);
            }
        }
        catch (error) {
            console.error('Error in reconnect_game:', error);
            socket.emit('error', { message: 'Failed to reconnect' });
        }
    }
    async handleDisconnect(socket) {
        console.log(`❌ Client disconnected: ${socket.id}`);
        const gameId = this.playerToGame.get(socket.id);
        if (!gameId) {
            // Check if in matchmaking queue
            this.matchmakingService.cancelMatchmaking(socket.id);
            return;
        }
        const game = this.gameService.getGame(gameId);
        if (!game)
            return;
        const player = game.players.find(p => p.id === socket.id);
        if (!player)
            return;
        // Mark player as disconnected
        player.connected = false;
        this.io.to(gameId).emit('player_disconnected', {
            username: player.username,
            reconnectWindow: 30,
            game,
        });
        await this.analyticsService.trackPlayerDisconnected(gameId, player.username, player.type);
        // Set 30-second timer for forfeit
        const timerKey = `${gameId}_${player.username}`;
        const timer = setTimeout(async () => {
            const currentGame = this.gameService.getGame(gameId);
            if (currentGame && currentGame.status === 'playing') {
                const disconnectedPlayer = currentGame.players.find(p => p.username === player.username);
                if (disconnectedPlayer && !disconnectedPlayer.connected) {
                    // Determine winner (opponent wins by forfeit)
                    const opponent = currentGame.players.find(p => p.username !== player.username);
                    if (opponent) {
                        currentGame.winner = opponent.color;
                        currentGame.status = 'finished';
                        currentGame.finishedAt = new Date();
                        await this.handleGameFinished(currentGame);
                        this.io.to(gameId).emit('game_forfeited', {
                            forfeitedBy: player.username,
                            winner: opponent.username,
                            game: currentGame,
                        });
                    }
                }
            }
            this.disconnectionTimers.delete(timerKey);
        }, 30000);
        this.disconnectionTimers.set(timerKey, timer);
    }
    handleCancelMatchmaking(socket) {
        // Find and remove player from matchmaking queue
        const waitingPlayers = this.matchmakingService.getWaitingPlayers();
        const player = waitingPlayers.find(p => p.id === socket.id);
        if (player) {
            this.matchmakingService.cancelMatchmaking(player.username);
            socket.emit('matchmaking_cancelled', { message: 'Matchmaking cancelled' });
            console.log(`⏸ Matchmaking cancelled for ${player.username}`);
        }
    }
}
exports.SocketHandler = SocketHandler;
