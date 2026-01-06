import { Player, GameState } from '../types';
import { GameService } from './gameServices';
import { BotService } from './botServices';

export class MatchmakingService {
  private waitingPlayers: Map<string, Player> = new Map(); // socketId -> Player
  private playerTimeouts: Map<string, NodeJS.Timeout> = new Map(); // socketId -> timeout
  private readonly MATCHMAKING_TIMEOUT = 10000; // 10 seconds

  constructor(private gameService: GameService) {}

  addPlayerToQueue(player: Player, onMatch: (game: GameState) => void, onBotMatch: (game: GameState) => void): void {
    // Remove if already in queue
    if (this.waitingPlayers.has(player.id)) {
      this.removePlayerFromQueue(player.id);
    }

    this.waitingPlayers.set(player.id, player);

    // Check if we can match with another player
    const matchedPlayer = Array.from(this.waitingPlayers.values()).find(p => p.id !== player.id);

    if (matchedPlayer) {
      // Match with another player
      console.log(`Match found: ${player.username} (${player.id}) vs ${matchedPlayer.username} (${matchedPlayer.id})`);
      this.removePlayerFromQueue(player.id);
      this.removePlayerFromQueue(matchedPlayer.id);
      const game = this.gameService.createGame(player, matchedPlayer);
      onMatch(game);
    } else {
      console.log(`⏳ ${player.username} (${player.id}) waiting for opponent... (${this.waitingPlayers.size} players in queue)`);
      // Set timeout for bot matching
      const existingTimeout = this.playerTimeouts.get(player.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        if (this.waitingPlayers.has(player.id)) {
          console.log(`🤖 No opponent found for ${player.username}, matching with bot`);
          this.removePlayerFromQueue(player.id);
          const botPlayer: Player = {
            id: `bot_${Date.now()}_${Math.random()}`,
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

      this.playerTimeouts.set(player.id, timeout);
    }
  }

  removePlayerFromQueue(socketId: string): void {
    this.waitingPlayers.delete(socketId);
    const timeout = this.playerTimeouts.get(socketId);
    if (timeout) {
      clearTimeout(timeout);
      this.playerTimeouts.delete(socketId);
    }
  }

  getWaitingPlayersCount(): number {
    return this.waitingPlayers.size;
  }

  isPlayerWaiting(socketId: string): boolean {
    return this.waitingPlayers.has(socketId);
  }

  getWaitingPlayers(): Player[] {
    return Array.from(this.waitingPlayers.values());
  }

  cancelMatchmaking(socketId: string): void {
    this.removePlayerFromQueue(socketId);
  }
}
