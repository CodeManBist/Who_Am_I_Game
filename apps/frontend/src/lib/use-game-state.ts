import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Character, ChatMessage, GameResult, Player } from './types';
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
  const { token, user } = useAuth ();
  
  const roomMatch = pathname.match(
    /\/(?:room|game)\/([^/]+)/
  );
  
  const roomCode = roomMatch?.[1] ?? '';

  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCharacter, setSelectedCharacter] =
    useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] =
    useState<Character | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponentTyping, setOpponentTyping] = useState(false);

  const [result, setResult] = useState<GameResult | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [gameSeconds, setGameSeconds] = useState(0);

  const you = players.find((player) => player.isYou) ?? null;

  const opponent =
    players.find((player) => !player.isYou) ?? null;

  /*
   * Load the real room from the backend.
   */
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

      const data: RoomResponse = await response.json();

      console.log('ROOM DATA:', data);

      if (!response.ok) {
        throw new Error(
          (data as { error?: string })?.error ||
            'Failed to load game room.'
        );
      }

      const serverPlayers = data.game?.players ?? [];
      console.log('GAME PAGE PLAYERS:', serverPlayers);

      const mappedPlayers: Player[] = serverPlayers.map((player) => ({
        id: player.id,
        userId: player.userId,
        name: player.username,
        avatarUrl: player.avatarUrl ?? undefined,
        position: player.position,
        status:
          player.position === 1
            ? 'host'
            : 'connected',
        isYou: player.userId === user.id,
        characterConfirmed: Boolean(player.characterConfirmed),
        characterReady: Boolean(player.characterReady),
        characterImageUrl: player.characterImageUrl ?? undefined,
      }));

      setPlayers(mappedPlayers);
      console.log('MAPPED PLAYERS:', mappedPlayers);

      /*
       * IMPORTANT:
       *
       * We intentionally do NOT read characterName from the opponent.
       * The opponent's identity must remain secret.
       *
       * The current room API only gives us characterReady /
       * characterConfirmed, so the actual mystery image will be
       * wired separately.
       */
    } catch (error) {
      console.error('Failed to load game room:', error);
    }
  }, [roomCode, token, user?.id]);

  /*
   * Load the real room when the Game Page opens.
   */
  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  /*
   * Keep polling the room temporarily.
   *
   * We'll replace this with WebSocket game-state events once
   * the gameplay WebSocket protocol is implemented.
   */
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
  }, [roomCode, token, user?.id, loadRoom]);

  /*
   * Character confirmation.
   *
   * This is kept in the API shape so existing components don't
   * break. Character selection itself is already handled by
   * CharacterSelectPage.
   */
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

  /*
   * Removed fake opponent confirmation.
   *
   * Kept as a no-op temporarily so old components don't crash
   * until we remove the call from GamePage.
   */
  const simulateOpponentConfirm = useCallback(() => {
    console.warn(
      'simulateOpponentConfirm() is disabled. Real opponent state comes from the server.'
    );
  }, []);

  /*
   * Removed fake seeded chat.
   */
  const seedChat = useCallback(() => {
    console.warn(
      'seedChat() is disabled. Real game messages will come from WebSocket.'
    );
  }, []);

  /*
   * Temporary message function.
   *
   * We will replace this with the real WebSocket send_message
   * flow in the next step.
   */
  const sendMessage = useCallback(
    (text: string) => {
      if (!you) {
        return;
      }

      const trimmedText = text.trim();

      if (!trimmedText) {
        return;
      }

      const message: ChatMessage = {
        id: `local-${Date.now()}`,
        senderId: you.id,
        senderName: you.name,
        text: trimmedText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, message]);
      setQuestionsAsked((count) => count + 1);

      console.warn(
        'sendMessage() is currently local only. WebSocket gameplay will be connected next.'
      );
    },
    [you]
  );

  /*
   * Temporary local result state.
   *
   * This will be replaced by the real /guess API in the next
   * gameplay step.
   */
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
          `${API_URL}/rooms/${encodeURIComponent(roomCode)}/guess`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              guess: trimmedGuess,
            }),
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          console.error('Guess failed:', data);
          return null;
        }
  
        console.log('Guess result:', data);
  
        return data;
      } catch (error) {
        console.error('Failed to submit guess:', error);
        return null;
      }
    },
    [roomCode, token, you]
  );

  const reset = useCallback(() => {
    setSelectedCharacter(null);
    setOpponentCharacter(null);
    setMessages([]);
    setOpponentTyping(false);
    setResult(null);
    setQuestionsAsked(0);
    setGameSeconds(0);
    setPlayers([]);
  }, []);

  return {
    roomCode,
    players,
    you,
    opponent,
    selectedCharacter,
    opponentCharacter,
    messages,
    opponentTyping,
    result,
    questionsAsked,
    gameSeconds,
    setGameSeconds,

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