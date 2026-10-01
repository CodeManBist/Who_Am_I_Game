import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  Character,
  ChatMessage,
  GameResult,
  Player,
} from './types';
import { useAuth } from './auth-context';

const API_URL = 'http://localhost:3001/api/v1';

type RoomPlayerResponse = {
  id: string;
  position: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  characterReady?: boolean;
  characterConfirmed?: boolean;
  characterName?: string | null;
  characterImageUrl?: string | null;
};

type RoomResponse = {
  game?: {
    id: string;
    roomCode: string;
    status: string;
    currentTurn: number | null;
    turnDeadline: string | null;
    startedAt: string | null;
    endedAt: string | null;
    players: RoomPlayerResponse[];
  };
};

export type GameState = ReturnType<typeof useGameStateImpl>;

function useGameStateImpl() {
  const { pathname } = useLocation();
  const { token, user } = useAuth();

  // ------------------------------------------------------------
  // Get room code from URL
  // Supports:
  // /room/WBEW79
  // /game/WBEW79
  // ------------------------------------------------------------
  const roomMatch = pathname.match(
    /\/(?:room|game)\/([^/]+)/
  );

  const roomCode = roomMatch?.[1] ?? '';

  // ------------------------------------------------------------
  // Game state
  // ------------------------------------------------------------

  const [players, setPlayers] = useState<Player[]>([]);

  const [selectedCharacter, setSelectedCharacter] =
    useState<Character | null>(null);

  const [opponentCharacter, setOpponentCharacter] =
    useState<Character | null>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [opponentTyping, setOpponentTyping] =
    useState(false);

  const [result, setResult] =
    useState<GameResult | null>(null);

  const [questionsAsked, setQuestionsAsked] =
    useState(0);

  const [gameSeconds, setGameSeconds] =
    useState(0);

  // ------------------------------------------------------------
  // Whose turn is it?
  // 1 = player 1
  // 2 = player 2
  // ------------------------------------------------------------

  const [currentTurn, setCurrentTurn] =
    useState<number | null>(null);

  // ------------------------------------------------------------
  // What should the current player do?
  //
  // question:
  //   Player should ask a question.
  //
  // answer:
  //   Player should answer opponent's question.
  // ------------------------------------------------------------

  const [turnAction, setTurnAction] =
    useState<'question' | 'answer'>('question');

  // ------------------------------------------------------------
  // Current user
  // ------------------------------------------------------------

  const you =
    players.find((player) => player.isYou) ?? null;

  const opponent =
    players.find((player) => !player.isYou) ?? null;

  // ------------------------------------------------------------
  // Load room from backend
  // ------------------------------------------------------------

  const loadRoom = useCallback(async () => {
    if (!roomCode || !token || !user?.id) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/rooms/${encodeURIComponent(roomCode)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: RoomResponse =
        await response.json();

      console.log('ROOM DATA:', data);

      if (!response.ok) {
        throw new Error(
          (data as { error?: string })?.error ||
            'Failed to load game room.'
        );
      }

      const serverPlayers =
        data.game?.players ?? [];

      console.log(
        'GAME PAGE PLAYERS:',
        serverPlayers
      );

      const mappedPlayers: Player[] =
        serverPlayers.map((player) => ({
          id: player.id,

          userId: player.userId,

          name: player.username,

          avatarUrl:
            player.avatarUrl ?? undefined,

          position: player.position,

          status:
            player.position === 1
              ? 'host'
              : 'connected',

          isYou:
            player.userId === user.id,

          characterConfirmed:
            Boolean(
              player.characterConfirmed
            ),

          characterReady:
            Boolean(
              player.characterReady
            ),

          characterName: player.characterName ?? undefined,

          characterImageUrl:
            player.characterImageUrl ??
            undefined,
        }));

      setPlayers(mappedPlayers);

      // ----------------------------------------------------------
      // Keep current turn synchronized with backend
      // ----------------------------------------------------------

      if (
        typeof data.game?.currentTurn ===
        'number'
      ) {
        setCurrentTurn(
          data.game.currentTurn
        );
      }

      console.log(
        'MAPPED PLAYERS:',
        mappedPlayers
      );
    } catch (error) {
      console.error(
        'Failed to load game room:',
        error
      );
    }
  }, [roomCode, token, user?.id]);

  // ------------------------------------------------------------
  // Initial room load
  // ------------------------------------------------------------

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // ------------------------------------------------------------
  // Poll room every 3 seconds
  //
  // This is still useful for:
  // - character upload
  // - character confirmation
  // - opponent image
  // - game status
  //
  // We can remove this later once everything is WebSocket driven.
  // ------------------------------------------------------------

  useEffect(() => {
    if (!roomCode || !token || !user?.id) {
      return;
    }

    const interval = window.setInterval(() => {
      loadRoom();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    roomCode,
    token,
    user?.id,
    loadRoom,
  ]);

  // Restore persisted chat after refresh or reconnect. Merge by database id
  // so a live socket event that arrives while this request is in flight is kept.
  useEffect(() => {
    if (!roomCode || !token) return;
    let cancelled = false;
    void fetch(`${API_URL}/rooms/${encodeURIComponent(roomCode)}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || cancelled || !Array.isArray(data.messages)) return;
      const restored: ChatMessage[] = data.messages
        .filter((item: any) => item.type === 'QUESTION' || item.type === 'ANSWER')
        .map((item: any) => ({
          id: item.id,
          senderId: item.senderId,
          senderName: item.sender?.username ?? 'Player',
          text: item.message,
          timestamp: new Date(item.createdAt).getTime(),
        }));
      setMessages((previous) => {
        const merged = new Map(previous.map((message) => [message.id, message]));
        for (const message of restored) if (!merged.has(message.id)) merged.set(message.id, message);
        return [...merged.values()].sort((a, b) => a.timestamp - b.timestamp);
      });
    }).catch((error) => console.error('Failed to restore game messages:', error));
    return () => { cancelled = true; };
  }, [roomCode, token]);

  // ------------------------------------------------------------
  // Character confirmation
  // ------------------------------------------------------------

  const confirmCharacter = useCallback(
    (character: Character) => {
      setSelectedCharacter(character);

      setPlayers((prev) =>
        prev.map((player) =>
          player.isYou
            ? {
                ...player,
                characterConfirmed: true,
                characterReady: true,
              }
            : player
        )
      );
    },
    []
  );

  // ------------------------------------------------------------
  // Legacy functions
  //
  // Kept so existing components don't break.
  // ------------------------------------------------------------

  const simulateOpponentConfirm =
    useCallback(() => {
      console.warn(
        'simulateOpponentConfirm() is disabled. Real opponent state comes from the server.'
      );
    }, []);

  const seedChat = useCallback(() => {
    console.warn(
      'seedChat() is disabled. Real game messages come from WebSocket.'
    );
  }, []);

  // ------------------------------------------------------------
  // Legacy local sendMessage
  //
  // GamePage will now use WebSocket directly.
  // This function is kept for compatibility with any
  // component that may still call it.
  // ------------------------------------------------------------

  const sendMessage = useCallback(
    (text: string) => {
      if (!you) {
        return;
      }

      const trimmedText = text.trim();

      if (!trimmedText) {
        return;
      }

      console.warn(
        'sendMessage() is deprecated. GamePage should send messages through WebSocket.'
      );
    },
    [you]
  );

  // ------------------------------------------------------------
  // Submit final guess
  // ------------------------------------------------------------

  const submitGuess = useCallback(
    async (guess: string) => {
      if (!roomCode || !token || !you) {
        return null;
      }

      const trimmedGuess = guess.trim();

      if (!trimmedGuess) {
        return null;
      }

      try {
        const response = await fetch(
          `${API_URL}/rooms/${encodeURIComponent(
            roomCode
          )}/guess`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              guess: trimmedGuess,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            'Guess failed:',
            data
          );

          return null;
        }

        console.log(
          'Guess result:',
          data
        );

        if (typeof data.currentTurn === 'number') {
          setCurrentTurn(data.currentTurn);
          setTurnAction(data.currentTurn === 1 ? 'question' : 'answer');
        }

        return data;
      } catch (error) {
        console.error(
          'Failed to submit guess:',
          error
        );

        return null;
      }
    },
    [roomCode, token, you]
  );

  // ------------------------------------------------------------
  // Reset game state
  // ------------------------------------------------------------

  const reset = useCallback(() => {
    setSelectedCharacter(null);

    setOpponentCharacter(null);

    setMessages([]);

    setOpponentTyping(false);

    setResult(null);

    setQuestionsAsked(0);

    setGameSeconds(0);

    setCurrentTurn(null);

    setTurnAction('question');

    setPlayers([]);
  }, []);

  // ------------------------------------------------------------
  // Return state
  // ------------------------------------------------------------

  return {
    roomCode,

    players,

    you,

    opponent,

    selectedCharacter,

    opponentCharacter,

    messages,

    setMessages,

    opponentTyping,

    result,

    questionsAsked,

    gameSeconds,

    setGameSeconds,

    currentTurn,

    setCurrentTurn,

    turnAction,

    setTurnAction,

    confirmCharacter,

    simulateOpponentConfirm,

    seedChat,

    sendMessage,

    submitGuess,

    reset,

    loadRoom,
  };
}

export function useGameState() {
  return useGameStateImpl();
}
