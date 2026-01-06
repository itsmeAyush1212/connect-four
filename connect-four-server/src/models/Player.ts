import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  username: string;
  gamesWon: number;
  gamesPlayed: number;
  createdAt: Date;
  lastPlayedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastPlayedAt: {
    type: Date,
    default: Date.now
  }
});

PlayerSchema.index({ gamesWon: -1 });

export default mongoose.model<IPlayer>('Player', PlayerSchema);