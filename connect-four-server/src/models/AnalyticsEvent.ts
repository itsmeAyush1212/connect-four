import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  gameId: string;
  eventType: 'game_started' | 'move_made' | 'game_finished' | 'player_disconnected' | 'player_reconnected';
  timestamp: Date;
  data: Record<string, any>;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  gameId: {
    type: String,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    enum: ['game_started', 'move_made', 'game_finished', 'player_disconnected', 'player_reconnected'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

AnalyticsEventSchema.index({ timestamp: -1 });
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
