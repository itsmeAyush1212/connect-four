export type CellValue = 'R' | 'Y' | null;
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerType = 'human' | 'bot';

export interface Player {
  id: string;
  username: string;
  color: 'R' | 'Y';
  type: PlayerType;
  connected: boolean;
  lastSeen: Date;
}

export interface GameState {
  id: string;
  board: CellValue[][];
  currentTurn: 'R' | 'Y';
  status: GameStatus;
  winner: 'R' | 'Y' | 'draw' | null;
  players: Player[];
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  moveHistory: { column: number; player: 'R' | 'Y'; timestamp: Date }[];
}

export interface KafkaGameEvent {
  eventType: 'game_started' | 'move_made' | 'game_finished' | 'player_disconnected' | 'player_reconnected';
  gameId: string;
  timestamp: Date;
  data: any;
}
