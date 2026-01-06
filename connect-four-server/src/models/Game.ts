import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  gameId: string;
  players: {
    username: string;
    color: 'R' | 'Y';
    type: 'human' | 'bot';
  }[];
  winner: 'R' | 'Y' | 'draw' | null;
  moves: {
    column: number;
    player: 'R' | 'Y';
    timestamp: Date;
  }[];
  duration: number;
  startedAt: Date;
  finishedAt: Date;
  status: 'completed' | 'forfeited';
}

const GameSchema = new Schema<IGame>({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    username: String,
    color: String,
    type: String
  }],
  winner: {
    type: String,
    default: null
  },
  moves: [{
    column: Number,
    player: String,
    timestamp: Date
  }],
  duration: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  finishedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'forfeited'],
    default: 'completed'
  }
});

GameSchema.index({ finishedAt: -1 });
GameSchema.index({ 'players.username': 1 });

export default mongoose.model<IGame>('Game', GameSchema);