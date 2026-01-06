"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameStats = exports.getGameHistory = exports.getPlayerStats = exports.getLeaderboard = void 0;
const Player_1 = __importDefault(require("../models/Player"));
const Game_1 = __importDefault(require("../models/Game"));
const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Player_1.default.find()
            .sort({ gamesWon: -1 })
            .limit(50)
            .exec();
        res.json({
            success: true,
            leaderboard: leaderboard.map((player) => ({
                rank: 0, // Will be assigned during mapping
                username: player.username,
                gamesWon: player.gamesWon,
                gamesPlayed: player.gamesPlayed,
                winRate: player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(2) : '0.00',
            })),
        });
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
};
exports.getLeaderboard = getLeaderboard;
const getPlayerStats = async (req, res) => {
    try {
        const { username } = req.params;
        const player = await Player_1.default.findOne({ username });
        if (!player) {
            res.status(404).json({ success: false, message: 'Player not found' });
            return;
        }
        res.json({
            success: true,
            stats: {
                username: player.username,
                gamesWon: player.gamesWon,
                gamesPlayed: player.gamesPlayed,
                winRate: player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(2) : '0.00',
                joinedAt: player.createdAt,
                lastPlayedAt: player.lastPlayedAt,
            },
        });
    }
    catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch player stats' });
    }
};
exports.getPlayerStats = getPlayerStats;
const getGameHistory = async (req, res) => {
    try {
        const { username } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const games = await Game_1.default.find({ 'players.username': username })
            .sort({ finishedAt: -1 })
            .limit(limit)
            .exec();
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
        const totalPlayers = await Player_1.default.countDocuments();
        const allGames = await Game_1.default.find().exec();
        let totalGameDuration = 0;
        let totalMoves = 0;
        allGames.forEach((game) => {
            totalGameDuration += game.duration || 0;
            totalMoves += game.moves.length;
        });
        const avgGameDuration = totalGames > 0 ? (totalGameDuration / totalGames).toFixed(2) : '0';
        const avgMovesPerGame = totalGames > 0 ? (totalMoves / totalGames).toFixed(2) : '0';
        res.json({
            success: true,
            stats: {
                totalGames,
                totalPlayers,
                averageGameDuration: parseFloat(avgGameDuration),
                averageMovesPerGame: parseFloat(avgMovesPerGame),
            },
        });
    }
    catch (error) {
        console.error('Error fetching game stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch game stats' });
    }
};
exports.getGameStats = getGameStats;
