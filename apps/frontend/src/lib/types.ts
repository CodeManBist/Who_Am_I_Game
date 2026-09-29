export type PlayerStatus =
  | 'host'
  | 'connected'
  | 'waiting'
  | 'disconnected';

export type Player = {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  position: number;
  status: PlayerStatus;
  isYou: boolean;

  characterConfirmed: boolean;
  characterReady: boolean;
  characterImageUrl?: string | null;
};

export type Character = {
  id: string;
  name: string;
  imageUrl: string;
  confidence: number;
  archetype?: string;
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