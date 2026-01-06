"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const uuid_1 = require("uuid");
const Game_1 = __importDefault(require("../models/Game"));
class GameService {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.games = new Map();
    }
    createGame(player1, player2) {
        const gameId = (0, uuid_1.v4)();
        const board = Array(this.ROWS)
            .fill(null)
            .map(() => Array(this.COLS).fill(null));
        // Assign colors randomly
        const color1 = Math.random() > 0.5 ? 'R' : 'Y';
        const color2 = color1 === 'R' ? 'Y' : 'R';
        player1.color = color1;
        player2.color = color2;
        const game = {
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
    makeMove(gameId, column, playerColor) {
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
        }
        else if (this.isBoardFull(game.board)) {
            game.winner = 'draw';
            game.status = 'finished';
            game.finishedAt = new Date();
            this.persistGame(game);
        }
        else {
            // Switch turns
            game.currentTurn = game.currentTurn === 'R' ? 'Y' : 'R';
        }
        this.games.set(gameId, game);
        return { success: true, game };
    }
    checkWinner(board, row, col, color) {
        // Check horizontal
        if (this.checkDirection(board, row, col, color, 0, 1))
            return true;
        // Check vertical
        if (this.checkDirection(board, row, col, color, 1, 0))
            return true;
        // Check diagonal (top-left to bottom-right)
        if (this.checkDirection(board, row, col, color, 1, 1))
            return true;
        // Check diagonal (top-right to bottom-left)
        if (this.checkDirection(board, row, col, color, 1, -1))
            return true;
        return false;
    }
    checkDirection(board, row, col, color, rowDelta, colDelta) {
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
    isBoardFull(board) {
        return board[0].every(cell => cell !== null);
    }
    getGame(gameId) {
        return this.games.get(gameId);
    }
    endGame(gameId, reason) {
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
    async persistGame(game) {
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
                duration: game.finishedAt ? (game.finishedAt.getTime() - game.startedAt.getTime()) / 1000 : 0,
                startedAt: game.startedAt,
                finishedAt: game.finishedAt,
                status: game.status === 'finished' ? 'completed' : 'forfeited',
            };
            await Game_1.default.create(gameData);
        }
        catch (error) {
            console.error('Error persisting game:', error);
        }
    }
    deleteGame(gameId) {
        this.games.delete(gameId);
    }
}
exports.GameService = GameService;
