import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useGameState, type GameState } from '@/lib/use-game-state';
import { gameSocket } from '@/services/websocket';

type GameContextValue = GameState & {
  isSocketConnected: boolean;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const gameState = useGameState();
  const { token } = useAuth();

  const isSocketConnected = gameSocket.isConnected;

  useEffect(() => {
    if (!token) {
      gameSocket.disconnect();
      return;
    }

    gameSocket.connect(token);

    const unsubscribe = gameSocket.onMessage((event) => {
      console.log('Game WebSocket event:', event);
    });

    return () => {
      unsubscribe();
    };
  }, [token]);

  return (
    <GameContext.Provider
      value={{
        ...gameState,
        isSocketConnected,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used inside GameProvider');
  }

  return context;
}