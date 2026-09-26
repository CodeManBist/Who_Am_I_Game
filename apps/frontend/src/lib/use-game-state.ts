import { useCallback, useState } from 'react';
import type { Character, ChatMessage, GameResult, Player } from './types';
import {
  MOCK_CHARACTERS,
  MOCK_CHAT_SEED,
  MOCK_OPPONENT_REPLIES,
  MOCK_PLAYERS,
  MOCK_ROOM_CODE,
} from './mock-data';

let msgId = 0;
const nextId = () => `m${++msgId}`;

export type GameState = ReturnType<typeof useGameStateImpl>;

function useGameStateImpl() {
  const [roomCode] = useState(MOCK_ROOM_CODE);
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [gameSeconds, setGameSeconds] = useState(0);

  const you = players[0];
  const opponent = players[1];

  const confirmCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setPlayers((prev) =>
      prev.map((p) => (p.isYou ? { ...p, characterConfirmed: true, characterId: character.id } : p))
    );
  }, []);

  const simulateOpponentConfirm = useCallback(() => {
    const opponentPick = MOCK_CHARACTERS[1];
    setOpponentCharacter(opponentPick);
    setPlayers((prev) =>
      prev.map((p) => (!p.isYou ? { ...p, characterConfirmed: true, characterId: opponentPick.id } : p))
    );
  }, []);

  const seedChat = useCallback(() => {
    setQuestionsAsked(0);
    setMessages(
      MOCK_CHAT_SEED.map((m) => ({
        id: nextId(),
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        timestamp: Date.now(),
      }))
    );
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const msg: ChatMessage = {
        id: nextId(),
        senderId: you.id,
        senderName: you.name,
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      setQuestionsAsked((q) => q + 1);

      setOpponentTyping(true);
      const reply = MOCK_OPPONENT_REPLIES[Math.floor(Math.random() * MOCK_OPPONENT_REPLIES.length)];
      setTimeout(() => {
        setOpponentTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            senderId: opponent.id,
            senderName: opponent.name,
            text: reply,
            timestamp: Date.now(),
          },
        ]);
      }, 1400 + Math.random() * 800);
    },
    [you, opponent]
  );

  const submitGuess = useCallback(
    (guess: string, actualName: string, timeElapsed: string) => {
      const correct = guess.trim().toLowerCase() === actualName.trim().toLowerCase();
      setResult({
        correct,
        guess,
        actualName,
        questionsAsked,
        timeElapsed,
        winnerName: correct ? you.name : opponent.name,
        loserName: correct ? opponent.name : you.name,
      });
    },
    [questionsAsked, you, opponent]
  );

  const reset = useCallback(() => {
    setSelectedCharacter(null);
    setOpponentCharacter(null);
    setMessages([]);
    setOpponentTyping(false);
    setResult(null);
    setQuestionsAsked(0);
    setGameSeconds(0);
    setPlayers(MOCK_PLAYERS);
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
  };
}

export function useGameState() {
  return useGameStateImpl();
}
