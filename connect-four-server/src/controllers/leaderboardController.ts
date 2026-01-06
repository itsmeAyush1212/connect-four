import { Request, Response } from 'express';
import PlayerModel from '../models/Player';
import GameModel from '../models/Game';

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const leaderboard = await PlayerModel.find()
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
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

export const getPlayerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const player = await PlayerModel.findOne({ username });

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
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch player stats' });
  }
};

export const getGameHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const games = await GameModel.find({ 'players.username': username })
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
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch game history' });
  }
};

export const getGameStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalGames = await GameModel.countDocuments();
    const totalPlayers = await PlayerModel.countDocuments();

    const allGames = await GameModel.find().exec();

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
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch game stats' });
  }
};
