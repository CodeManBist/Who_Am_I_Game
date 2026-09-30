import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/lib/auth-context';

import {
  useGameState,
  type GameState,
} from '@/lib/use-game-state';

import { gameSocket } from '@/services/websocket';

type GameContextValue = GameState & {
  isSocketConnected: boolean;
  countdown: number | null;
};

const GameContext =
  createContext<GameContextValue | undefined>(
    undefined
  );

export function GameProvider({
  children,
}: {
  children: ReactNode;
}) {
  const gameState = useGameState();
  const { token } = useAuth();

  const [isSocketConnected, setIsSocketConnected] =
    useState(false);

  const [countdown, setCountdown] =
    useState<number | null>(null);

  const countdownDeadlineRef =
    useRef<number | null>(null);

  const gameStateRef =
    useRef(gameState);

  gameStateRef.current = gameState;

  // ------------------------------------------------------------
  // Render the countdown from the SAME server deadline
  // received by both players.
  // ------------------------------------------------------------

  useEffect(() => {
    const deadline =
      countdownDeadlineRef.current;

    if (!deadline) {
      return;
    }

    const updateCountdown = () => {
      const remaining =
        deadline - Date.now();

      if (remaining <= 0) {
        countdownDeadlineRef.current = null;
        setCountdown(null);
        return;
      }

      // Never show 4 even if the event arrives immediately.
      const value = Math.min(
        3,
        Math.ceil(remaining / 1000)
      );

      setCountdown(value);
    };

    updateCountdown();

    const interval =
      window.setInterval(
        updateCountdown,
        50
      );

    return () => {
      window.clearInterval(interval);
    };
  }, [countdown]);

  // ------------------------------------------------------------
  // WebSocket connection + listeners
  // ------------------------------------------------------------

  useEffect(() => {
    if (!token) {
      gameSocket.disconnect();
      setIsSocketConnected(false);
      return;
    }

    console.log(
      'GAME CONTEXT: connecting WebSocket'
    );

    gameSocket.connect(token);

    setIsSocketConnected(
      gameSocket.isConnected
    );

    const unsubscribeStatus =
      gameSocket.onStatus((connected) => {
        console.log(
          'SOCKET STATUS:',
          connected
        );

        setIsSocketConnected(
          connected
        );
      });

    const unsubscribeMessages =
      gameSocket.onMessage((event) => {
        console.log(
          'GAME WEBSOCKET EVENT:',
          event
        );

        const state =
          gameStateRef.current;

        // ======================================================
        // COUNTDOWN
        // ======================================================

        if (
          event.type ===
          'game_countdown'
        ) {
          const deadline =
            typeof event.countdownEndsAt ===
            'number'
              ? event.countdownEndsAt
              : null;

          if (deadline) {
            countdownDeadlineRef.current =
              deadline;

            const remaining =
              deadline - Date.now();

            setCountdown(
              remaining > 0
                ? Math.min(
                    3,
                    Math.ceil(
                      remaining / 1000
                    )
                  )
                : null
            );
          }

          return;
        }

        // ======================================================
        // GAME STARTED
        // ======================================================

        if (
          event.type ===
          'game_started'
        ) {
          console.log(
            'GAME STARTED:',
            event
          );

          countdownDeadlineRef.current =
            null;
          setCountdown(null);

          if (
            typeof event.currentTurn ===
            'number'
          ) {
            state.setCurrentTurn(
              event.currentTurn
            );
          }

          if (
            event.action === 'question' ||
            event.action === 'answer'
          ) {
            state.setTurnAction(
              event.action
            );
          } else {
            state.setTurnAction(
              'question'
            );
          }

          return;
        }

        // ======================================================
        // TURN CHANGED
        // ======================================================

        if (
          event.type ===
          'turn_changed'
        ) {
          console.log(
            'TURN CHANGED:',
            event
          );

          if (
            typeof event.currentTurn ===
            'number'
          ) {
            state.setCurrentTurn(
              event.currentTurn
            );
          }

          if (
            event.action === 'question' ||
            event.action === 'answer'
          ) {
            state.setTurnAction(
              event.action
            );
          }

          return;
        }

        // ======================================================
        // QUESTION RECEIVED
        // ======================================================

        if (
          event.type ===
          'question_received'
        ) {
          addMessage(
            event,
            state
          );

          // The next player must answer.
          state.setTurnAction(
            'answer'
          );

          return;
        }

        // ======================================================
        // ANSWER RECEIVED
        // ======================================================

        if (
          event.type ===
          'answer_received'
        ) {
          addMessage(
            event,
            state
          );

          // After an answer, the next player asks.
          state.setTurnAction(
            'question'
          );

          return;
        }

        // ======================================================
        // ERROR
        // ======================================================

        if (
          event.type === 'error'
        ) {
          console.error(
            'GAME ERROR:',
            event.message
          );
        }
      });

    return () => {
      console.log(
        'GAME CONTEXT: removing WebSocket listeners'
      );

      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, [token]);

  return (
    <GameContext.Provider
      value={{
        ...gameState,
        isSocketConnected,
        countdown,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ============================================================
// Add message helper
// ============================================================

function addMessage(
  event: {
    type: string;
    [key: string]: unknown;
  },
  gameState: GameState
) {
  const senderId =
    typeof event.userId === 'string'
      ? event.userId
      : '';

  const text =
    typeof event.message === 'string'
      ? event.message
      : '';

  const messageId =
    typeof event.messageId === 'string'
      ? event.messageId
      : `ws-${Date.now()}`;

  if (!senderId || !text) {
    return;
  }

  const sender =
    gameState.players.find(
      (player) =>
        player.userId === senderId
    );

  const chatMessage = {
    id: messageId,
    senderId,
    senderName:
      sender?.name ?? 'Player',
    text,
    timestamp:
      typeof event.createdAt === 'string'
        ? new Date(
            event.createdAt
          ).getTime()
        : Date.now(),
  };

  gameState.setMessages(
    (previous) => {
      if (
        previous.some(
          (message) =>
            message.id === messageId
        )
      ) {
        return previous;
      }

      return [
        ...previous,
        chatMessage,
      ];
    }
  );
}

// ============================================================
// useGame
// ============================================================

export function useGame() {
  const context =
    useContext(GameContext);

  if (!context) {
    throw new Error(
      'useGame must be used inside GameProvider'
    );
  }

  return context;
}
