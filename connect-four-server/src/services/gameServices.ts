import { GameState, CellValue, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';
import GameModel from '../models/Game';

export class GameService {
  private readonly ROWS = 6;
  private readonly COLS = 7;
  private games: Map<string, GameState> = new Map();

  createGame(player1: Player, player2: Player): GameState {
    const gameId = uuidv4();
    const board: CellValue[][] = Array(this.ROWS)
      .fill(null)
      .map(() => Array(this.COLS).fill(null));

    // Assign colors randomly
    const color1: 'R' | 'Y' = Math.random() > 0.5 ? 'R' : 'Y';
    const color2: 'R' | 'Y' = color1 === 'R' ? 'Y' : 'R';
    player1.color = color1;
    player2.color = color2;

    const game: GameState = {
      id: gameId,
      board,
      currentTurn: 'R',
      status: 'playing',
      winner: null,
      players: [player1, player2],
      createdAt: new Date(),
      startedAt: new Date(),
      moveHistory: [],
    };

    this.games.set(gameId, game);
    return game;
  }

  makeMove(gameId: string, column: number, playerColor: 'R' | 'Y'): { success: boolean; error?: string; game?: GameState } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'playing') {
      return { success: false, error: 'Game is not in progress' };
    }

    if (game.currentTurn !== playerColor) {
      return { success: false, error: 'Not your turn' };
    }

    if (column < 0 || column >= this.COLS) {
      return { success: false, error: 'Invalid column' };
    }

    // Check if column is full
    if (game.board[0][column] !== null) {
      return { success: false, error: 'Column is full' };
    }

    // Find the lowest available row in the column
    let row = this.ROWS - 1;
    while (row >= 0 && game.board[row][column] !== null) {
      row--;
    }

    if (row < 0) {
      return { success: false, error: 'Column is full' };
    }

    // Place the disc
    game.board[row][column] = playerColor;
    game.moveHistory.push({
      column,
      player: playerColor,
      timestamp: new Date(),
    });

    // Check for winner
    const winner = this.checkWinner(game.board, row, column, playerColor);
    if (winner) {
      game.winner = playerColor;
      game.status = 'finished';
      game.finishedAt = new Date();
      this.persistGame(game);
    } else if (this.isBoardFull(game.board)) {
      game.winner = 'draw';
      game.status = 'finished';
      game.finishedAt = new Date();
      this.persistGame(game);
    } else {
      // Switch turns
      game.currentTurn = game.currentTurn === 'R' ? 'Y' : 'R';
    }

    this.games.set(gameId, game);
    return { success: true, game };
  }

  private checkWinner(board: CellValue[][], row: number, col: number, color: 'R' | 'Y'): boolean {
    // Check horizontal
    if (this.checkDirection(board, row, col, color, 0, 1)) return true;
    // Check vertical
    if (this.checkDirection(board, row, col, color, 1, 0)) return true;
    // Check diagonal (top-left to bottom-right)
    if (this.checkDirection(board, row, col, color, 1, 1)) return true;
    // Check diagonal (top-right to bottom-left)
    if (this.checkDirection(board, row, col, color, 1, -1)) return true;
    return false;
  }

  private checkDirection(
    board: CellValue[][],
    row: number,
    col: number,
    color: 'R' | 'Y',
    rowDelta: number,
    colDelta: number
  ): boolean {
    let count = 1; // Count the current disc

    // Check forward
    let r = row + rowDelta;
    let c = col + colDelta;
    while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
      count++;
      r += rowDelta;
      c += colDelta;
    }

    // Check backward
    r = row - rowDelta;
    c = col - colDelta;
    while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
      count++;
      r -= rowDelta;
      c -= colDelta;
    }

    return count >= 4;
  }

  private isBoardFull(board: CellValue[][]): boolean {
    return board[0].every(cell => cell !== null);
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  endGame(gameId: string, reason: 'forfeited' | 'disconnect'): void {
    const game = this.games.get(gameId);
    if (game && game.status === 'playing') {
      game.status = 'finished';
      game.finishedAt = new Date();

      // Determine winner based on reason
      if (reason === 'disconnect' || reason === 'forfeited') {
        const disconnectedPlayer = game.players.find(p => !p.connected);
        const winnerColor = disconnectedPlayer ? (disconnectedPlayer.color === 'R' ? 'Y' : 'R') : null;
        if (winnerColor) {
          game.winner = winnerColor;
        }
      }

      this.persistGame(game);
    }
  }

  private async persistGame(game: GameState): Promise<void> {
    try {
      const gameData = {
        gameId: game.id,
        players: game.players.map(p => ({
          username: p.username,
          color: p.color,
          type: p.type,
        })),
        winner: game.winner,
        moves: game.moveHistory,
        duration: game.finishedAt ? (game.finishedAt.getTime() - game.startedAt!.getTime()) / 1000 : 0,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
        status: game.status === 'finished' ? 'completed' : 'forfeited',
      };

      await GameModel.create(gameData);
    } catch (error) {
      console.error('Error persisting game:', error);
    }
  }

  deleteGame(gameId: string): void {
    this.games.delete(gameId);
  }
}
