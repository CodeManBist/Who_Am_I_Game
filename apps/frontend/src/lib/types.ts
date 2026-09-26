export type PlayerStatus = 'host' | 'connected' | 'waiting' | 'disconnected';

export type Player = {
  id: string;
  name: string;
  avatarUrl?: string;
  status: PlayerStatus;
  isYou: boolean;
  characterConfirmed: boolean;
  characterId?: string;
};

export type Character = {
  id: string;
  name: string;
  archetype: string;
  imageUrl: string;
  confidence: number;
};

export type GamePhase =
  | 'landing'
  | 'create'
  | 'join'
  | 'waiting'
  | 'select'
  | 'countdown'
  | 'playing'
  | 'result';

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
};

export type GameResult = {
  correct: boolean;
  guess: string;
  actualName: string;
  questionsAsked: number;
  timeElapsed: string;
  winnerName: string;
  loserName: string;
};
