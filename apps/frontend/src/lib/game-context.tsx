import { createContext, useContext, type ReactNode } from 'react';
import { useGameState, type GameState } from '@/lib/use-game-state';

const GameStateContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const state = useGameState();
  return <GameStateContext.Provider value={state}>{children}</GameStateContext.Provider>;
}

export function useGame(): GameState {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
