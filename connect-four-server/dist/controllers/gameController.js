"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameById = exports.getGameStats = exports.getGameHistory = void 0;
const Game_1 = __importDefault(require("../models/Game"));
const getGameHistory = async (req, res) => {
    try {
        const { username } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const games = await Game_1.default.find({ 'players.username': username })
            .sort({ finishedAt: -1 })
            .skip(offset)
            .limit(limit)
            .exec();
        const total = await Game_1.default.countDocuments({ 'players.username': username });
        res.json({
            success: true,
            games: games.map((game) => ({
                gameId: game.gameId,
                players: game.players,
                winner: game.winner,
                duration: game.duration,
                startedAt: game.startedAt,
                finishedAt: game.finishedAt,
            })),
            total,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error fetching game history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch game history' });
    }
};
exports.getGameHistory = getGameHistory;
const getGameStats = async (req, res) => {
    try {
        const totalGames = await Game_1.default.countDocuments();
        const allGames = await Game_1.default.find().exec();
        let totalGameDuration = 0;
        let totalMoves = 0;
        const winnerCounts = {};
        allGames.forEach((game) => {
            totalGameDuration += game.duration || 0;
            totalMoves += game.moves.length;
            if (game.winner && game.winner !== 'draw') {
                const winner = game.players.find(p => p.color === game.winner);
                if (winner) {
                    winnerCounts[winner.username] = (winnerCounts[winner.username] || 0) + 1;
                }
            }
        });
        const avgGameDuration = totalGames > 0 ? (totalGameDuration / totalGames).toFixed(2) : '0';
        const avgMovesPerGame = totalGames > 0 ? (totalMoves / totalGames).toFixed(2) : '0';
        const topWinners = Object.entries(winnerCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([username, wins]) => ({ username, wins }));
        res.json({
            success: true,
            stats: {
                totalGames,
                averageGameDuration: parseFloat(avgGameDuration),
                averageMovesPerGame: parseFloat(avgMovesPerGame),
                topWinners,
            },
        });
    }
    catch (error) {
        console.error('Error fetching game stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch game stats' });
    }
};
exports.getGameStats = getGameStats;
const getGameById = async (req, res) => {
    try {
        const { gameId } = req.params;
        const game = await Game_1.default.findOne({ gameId });
        if (!game) {
            res.status(404).json({ success: false, message: 'Game not found' });
            return;
        }
        res.json({
            success: true,
            game,
        });
    }
    catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch game' });
    }
};
exports.getGameById = getGameById;
