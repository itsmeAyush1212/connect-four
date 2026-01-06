import { Server, Socket } from 'socket.io';
import { GameService } from '../services/gameServices';
import { MatchmakingService } from '../services/matchmakingService';
import { AnalyticsService } from '../services/analyticsService';
import { BotService } from '../services/botServices';
import { Player, GameState } from '../types';
import GameModel from '../models/Game';
import PlayerModel from '../models/Player';

export class SocketHandler {
  private gameService: GameService;
  private matchmakingService: MatchmakingService;
  private analyticsService: AnalyticsService;
  private botService: BotService;
  private disconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
  private playerToGame: Map<string, string> = new Map(); // playerId -> gameId

  constructor(private io: Server) {
    this.gameService = new GameService();
    this.matchmakingService = new MatchmakingService(this.gameService);
    this.analyticsService = new AnalyticsService();
    this.botService = new BotService();
  }

  public async initialize(): Promise<void> {
    await this.analyticsService.initializeProducer();

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('find_match', (data: { username: string }) => this.handleFindMatch(socket, data));
      socket.on('make_move', (data: { gameId: string; column: number }) => this.handleMakeMove(socket, data));
      socket.on('reconnect_game', (data: { gameId: string; username: string }) => this.handleReconnect(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('cancel_matchmaking', () => this.handleCancelMatchmaking(socket));
    });
  }

  private async handleFindMatch(socket: Socket, data: { username: string }): Promise<void> {
    try {
      const { username } = data;
      console.log(`handleFindMatch called for socket: ${socket.id}, username: ${username}`);

      if (!username || username.trim().length === 0) {
        console.log('Username is empty');
        socket.emit('error', { message: 'Username is required' });
        return;
      }

      console.log(`Creating/updating player in database: ${username}`);
      // Ensure player exists in database
      await PlayerModel.findOneAndUpdate(
        { username },
        { $setOnInsert: { gamesWon: 0, gamesPlayed: 0 } },
        { upsert: true, new: true }
      );
      console.log(`Player in database: ${username}`);

      const player: Player = {
        id: socket.id,
        username,
        color: 'R',
        type: 'human',
        connected: true,
        lastSeen: new Date(),
      };

      console.log(`Sending matchmaking_started to socket ${socket.id}`);
      socket.emit('matchmaking_started', { 
        message: 'Looking for opponent...', 
        waitingPlayers: this.matchmakingService.getWaitingPlayersCount() 
      });

      console.log(`Adding player to queue: ${player.username} (${player.id})`);
      // Add player to queue
      this.matchmakingService.addPlayerToQueue(
        player,
        (game) => {
          console.log(`onPlayerMatch callback triggered for game: ${game.id}`);
          this.onPlayerMatch(game);
        },
        (game) => {
          console.log(`onBotMatch callback triggered for game: ${game.id}`);
          this.onBotMatch(game);
        }
      );
    } catch (error) {
      console.error('Error in find_match:', error);
      socket.emit('error', { message: 'Failed to find match' });
    }
  }

  private onPlayerMatch(game: GameState): void {
    console.log(`onPlayerMatch called for game ${game.id}`);
    console.log(`Players: ${game.players.map(p => `${p.username}(${p.id})`).join(' vs ')}`);
    
    // Notify both players
    game.players.forEach((player) => {
      console.log(`Looking for socket: ${player.id}`);
      const socket = this.io.sockets.sockets.get(player.id);
      if (socket) {
        console.log(`Found socket for ${player.username}, joining room ${game.id}`);
        socket.join(game.id);
        this.playerToGame.set(player.id, game.id);
        socket.emit('game_started', {
          game,
          yourColor: player.color,
          opponent: game.players.find(p => p.id !== player.id),
        });
      } else {
        console.log(`Socket NOT found for ${player.username} (${player.id})`);
      }
    });

    this.analyticsService.trackGameStarted(game);
    console.log(`Game Started: ${game.id} - ${game.players[0].username} vs ${game.players[1].username}`);
  }

  private onBotMatch(game: GameState): void {
    const humanPlayer = game.players.find(p => p.type === 'human')!;
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

  private async handleMakeMove(socket: Socket, data: { gameId: string; column: number }): Promise<void> {
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

      const updatedGame = result.game!;

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
      } else {
        // Check if bot should play
        const botPlayer = updatedGame.players.find(p => p.type === 'bot');
        if (botPlayer && botPlayer.color === updatedGame.currentTurn && updatedGame.status === 'playing') {
          setTimeout(() => this.makeBotMove(gameId), 800);
        }
      }
    } catch (error) {
      console.error('Error in make_move:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  }

  private makeBotMove(gameId: string): void {
    const game = this.gameService.getGame(gameId);
    if (!game || game.status !== 'playing') return;

    const botPlayer = game.players.find(p => p.type === 'bot');
    if (!botPlayer) return;

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

  private async handleGameFinished(game: GameState): Promise<void> {
    const duration = game.finishedAt && game.startedAt ? (game.finishedAt.getTime() - game.startedAt.getTime()) / 1000 : 0;

    // Update player stats
    for (const player of game.players) {
      if (player.type === 'human') {
        const won = game.winner === player.color;
        await PlayerModel.findOneAndUpdate(
          { username: player.username },
          {
            $inc: {
              gamesPlayed: 1,
              gamesWon: won ? 1 : 0,
            },
            $set: { lastPlayedAt: new Date() },
          }
        );
      }
    }

    await this.analyticsService.trackGameFinished(game);

    this.io.to(game.id).emit('game_finished', {
      game,
      winner: game.winner,
      duration,
    });

    console.log(`Game Finished: ${game.id} - Winner: ${game.winner}`);

    // Clean up after 1 minute
    setTimeout(() => {
      this.gameService.deleteGame(game.id);
      game.players.forEach(p => this.playerToGame.delete(p.id));
    }, 60000);
  }

  private async handleReconnect(socket: Socket, data: { gameId: string; username: string }): Promise<void> {
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
        console.log(`Player Reconnected: ${username} to game ${gameId}`);
      }
    } catch (error) {
      console.error('Error in reconnect_game:', error);
      socket.emit('error', { message: 'Failed to reconnect' });
    }
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    console.log(`Client disconnected: ${socket.id}`);

    const gameId = this.playerToGame.get(socket.id);
    if (!gameId) {
      // Check if in matchmaking queue
      this.matchmakingService.cancelMatchmaking(socket.id);
      return;
    }

    const game = this.gameService.getGame(gameId);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

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

  private handleCancelMatchmaking(socket: Socket): void {
    // Remove player from matchmaking queue using socket id
    this.matchmakingService.cancelMatchmaking(socket.id);
    socket.emit('matchmaking_cancelled', { message: 'Matchmaking cancelled' });
    console.log(`Matchmaking cancelled for socket ${socket.id}`);
  }
}