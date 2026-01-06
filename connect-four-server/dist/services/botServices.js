"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotService = void 0;
class BotService {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
    }
    getBestMove(game, botColor) {
        const board = game.board;
        const opponentColor = botColor === 'R' ? 'Y' : 'R';
        // Priority 1: Block opponent's immediate win
        const blockMove = this.findWinningMove(board, opponentColor, this.COLS);
        if (blockMove !== -1) {
            return blockMove;
        }
        // Priority 2: Try to win
        const winMove = this.findWinningMove(board, botColor, this.COLS);
        if (winMove !== -1) {
            return winMove;
        }
        // Priority 3: Create strategic positions
        const strategicMove = this.findStrategicMove(board, botColor);
        if (strategicMove !== -1) {
            return strategicMove;
        }
        // Priority 4: Play in center columns (better positional control)
        const centerMove = this.findCenterMove(board);
        if (centerMove !== -1) {
            return centerMove;
        }
        // Priority 5: Play any valid move
        return this.findAnyValidMove(board);
    }
    findWinningMove(board, color, cols) {
        for (let col = 0; col < cols; col++) {
            if (this.isValidMove(board, col)) {
                const row = this.getLowestRow(board, col);
                if (row >= 0) {
                    // Simulate the move
                    board[row][col] = color;
                    const isWinning = this.checkWinner(board, row, col, color);
                    board[row][col] = null; // Undo
                    if (isWinning) {
                        return col;
                    }
                }
            }
        }
        return -1;
    }
    findStrategicMove(board, color) {
        const opponentColor = color === 'R' ? 'Y' : 'R';
        const scores = new Map();
        for (let col = 0; col < this.COLS; col++) {
            if (!this.isValidMove(board, col)) {
                scores.set(col, -Infinity);
                continue;
            }
            const row = this.getLowestRow(board, col);
            if (row < 0) {
                scores.set(col, -Infinity);
                continue;
            }
            let score = 0;
            // Simulate move
            board[row][col] = color;
            // Score based on creating threats
            score += this.countThreats(board, row, col, color) * 10;
            // Score based on blocking opponent threats
            board[row][col] = null;
            board[row][col] = opponentColor;
            score += this.countThreats(board, row, col, opponentColor) * 5;
            board[row][col] = null;
            scores.set(col, score);
        }
        let bestCol = -1;
        let bestScore = -Infinity;
        for (const [col, score] of scores) {
            if (score > bestScore) {
                bestScore = score;
                bestCol = col;
            }
        }
        return bestCol;
    }
    findCenterMove(board) {
        const centerCols = [3, 2, 4, 1, 5, 0, 6]; // Order by proximity to center
        for (const col of centerCols) {
            if (this.isValidMove(board, col)) {
                return col;
            }
        }
        return -1;
    }
    findAnyValidMove(board) {
        for (let col = 0; col < this.COLS; col++) {
            if (this.isValidMove(board, col)) {
                return col;
            }
        }
        return -1;
    }
    isValidMove(board, col) {
        return col >= 0 && col < this.COLS && board[0][col] === null;
    }
    getLowestRow(board, col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                return row;
            }
        }
        return -1;
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
        let count = 1;
        let r = row + rowDelta;
        let c = col + colDelta;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
            count++;
            r += rowDelta;
            c += colDelta;
        }
        r = row - rowDelta;
        c = col - colDelta;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
            count++;
            r -= rowDelta;
            c -= colDelta;
        }
        return count >= 4;
    }
    countThreats(board, row, col, color) {
        let count = 0;
        const directions = [
            [0, 1], // Horizontal
            [1, 0], // Vertical
            [1, 1], // Diagonal
            [1, -1], // Diagonal
        ];
        for (const [rowDelta, colDelta] of directions) {
            let lineCount = 1;
            let r = row + rowDelta;
            let c = col + colDelta;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
                lineCount++;
                r += rowDelta;
                c += colDelta;
            }
            r = row - rowDelta;
            c = col - colDelta;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
                lineCount++;
                r -= rowDelta;
                c -= colDelta;
            }
            if (lineCount >= 3)
                count += 2;
            else if (lineCount >= 2)
                count += 1;
        }
        return count;
    }
}
exports.BotService = BotService;
