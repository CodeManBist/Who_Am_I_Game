import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { Target } from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { LiveBadge } from '@/components/game/LiveBadge';
import { RoomCode } from '@/components/game/RoomCode';
import { MysteryPhoto } from '@/components/game/MysteryPhoto';
import {
  ChatBubble,
  TypingIndicator,
} from '@/components/game/ChatBubble';
import { ChatInput } from '@/components/game/ChatInput';
import { GameControls } from '@/components/game/GameControls';
import { GuessModal } from '@/components/game/GuessModal';

import { useGame } from '@/lib/game-context';

import { gameSocket } from '@/services/websocket';

// ------------------------------------------------------------
// Temporary video placeholder
//
// We will replace this later when we add real voice/video.
// ------------------------------------------------------------

const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';

export function GamePage() {
  const { roomCode } =
    useParams();

  const navigate =
    useNavigate();

  const game =
    useGame();

  const [seconds, setSeconds] =
    useState(42);

  const [guessOpen, setGuessOpen] =
    useState(false);

  const scrollRef =
    useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------
  // Temporary UI timer
  //
  // This is NOT used by game logic.
  // We can remove it later because V1 doesn't need a timer.
  // ------------------------------------------------------------

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setSeconds((value) =>
          value > 0
            ? value - 1
            : 0
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  // ------------------------------------------------------------
  // Automatically scroll chat to bottom
  // ------------------------------------------------------------

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [
    game.messages,
    game.opponentTyping,
  ]);

  // ------------------------------------------------------------
  // Join the WebSocket game room
  // ------------------------------------------------------------

  useEffect(() => {
    if (!roomCode || !game.isSocketConnected) {
      return;
    }

    console.log(
      'Joining WebSocket game room:',
      roomCode
    );

    gameSocket.send({
      type: 'join_game',
      roomCode,
    });
  }, [
    roomCode,
    game.isSocketConnected,
  ]);

  // ------------------------------------------------------------
  // Opponent image
  // ------------------------------------------------------------

  const opponentImageUrl =
    game.opponent
      ?.characterImageUrl;

  // ------------------------------------------------------------
  // Temporary timer display
  // ------------------------------------------------------------

  const timeString =
    `${String(
      Math.floor(seconds / 60)
    ).padStart(2, '0')}:${String(
      seconds % 60
    ).padStart(2, '0')}`;

  // ------------------------------------------------------------
  // Is it my turn?
  // ------------------------------------------------------------

  const isMyTurn =
    Boolean(
      game.you &&
      game.currentTurn !== null &&
      game.you.position ===
        game.currentTurn
    );

  // ------------------------------------------------------------
  // Send question/answer through WebSocket
  // ------------------------------------------------------------

  const handleSendMessage = (
    text: string
  ) => {
    const trimmedText =
      text.trim();

    // ----------------------------------------------------------
    // Basic validation
    // ----------------------------------------------------------

    if (!trimmedText) {
      return;
    }

    // ----------------------------------------------------------
    // Must be our turn
    // ----------------------------------------------------------

    if (!isMyTurn) {
      console.warn(
        'Not your turn'
      );

      return;
    }

    // ----------------------------------------------------------
    // Need a connected socket
    // ----------------------------------------------------------

    if (!game.isSocketConnected) {
      console.error(
        'WebSocket is not connected'
      );

      return;
    }

    // ----------------------------------------------------------
    // Question
    // ----------------------------------------------------------

    if (
      game.turnAction ===
      'question'
    ) {
      gameSocket.send({
        type: 'question',
        roomCode:
          game.roomCode,
        message:
          trimmedText,
      });

      return;
    }

    // ----------------------------------------------------------
    // Answer
    // ----------------------------------------------------------

    if (
      game.turnAction ===
      'answer'
    ) {
      gameSocket.send({
        type: 'answer',
        roomCode:
          game.roomCode,
        message:
          trimmedText,
      });

      return;
    }
  };

  // ------------------------------------------------------------
  // Submit final guess
  // ------------------------------------------------------------

  const submitGuess = async (
    guess: string
  ) => {
    setGuessOpen(false);

    const result =
      await game.submitGuess(
        guess
      );

    if (result?.correct) {
      navigate(
        `/game/${roomCode}/result`
      );
    } else {
      console.log(
        'Incorrect guess'
      );
    }
  };

  // ------------------------------------------------------------
  // Chat input state
  // ------------------------------------------------------------

  const chatDisabled = !isMyTurn;

  const inputPlaceholder =
    !game.you
      ? 'Loading...'
      : !game.currentTurn
        ? 'Waiting for game...'
        : !isMyTurn
          ? 'Waiting for opponent...'
          : game.turnAction ===
              'question'
            ? 'Ask a question...'
            : 'Answer the question...';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#11110F] text-[#F5F1E8]">

      {game.countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9A958B]">
              Game starting
            </p>

            <div className="font-mono text-8xl font-bold tabular-nums text-[#FF5A36]">
              {game.countdown}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex h-14 items-center justify-between border-b border-[#1F1F1A] px-4 sm:px-6">

        {/* Logo */}

        <div className="flex items-center gap-2.5">
          <LogoMark size={18} />

          <span className="hidden font-display text-xs font-semibold tracking-tight sm:inline">
            WHO AM I?
          </span>
        </div>

        {/* Game status */}

        <div className="flex items-center gap-3">

          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9A958B]">
            Round 01
          </span>

          <span className="font-mono text-sm tabular-nums text-[#F5F1E8]">
            {timeString}
          </span>

        </div>

        {/* Room */}

        <div className="flex items-center gap-3">

          <RoomCode
            code={
              roomCode ?? ''
            }
          />

          <LiveBadge />

        </div>

      </header>

      {/* ======================================================
          MAIN GAME AREA
      ====================================================== */}

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

        {/* ====================================================
            LEFT SIDE
        ==================================================== */}

        <div className="flex flex-shrink-0 flex-col items-center gap-4 overflow-y-auto border-b border-[#1F1F1A] p-4 sm:p-6 lg:flex-1 lg:border-b-0 lg:border-r">

          {/* Label */}

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF5A36]">
            Who are they?
          </p>

          {/* Opponent character */}

          {opponentImageUrl ? (
            <MysteryPhoto
              src={
                opponentImageUrl
              }
              size="md"
              float={false}
              rotate="-2deg"
            />
          ) : (
            <div className="flex h-64 w-48 items-center justify-center rounded-lg border border-[#2A2A25] bg-[#181815] text-xs text-[#5A564F]">
              Waiting for character...
            </div>
          )}

          {/* =================================================
              Temporary player video placeholder
              ================================================= */}

          <div className="w-full max-w-xs">

            <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] animate-drift">

              <img
                src={PLAYER_B}
                alt="Player"
                className="h-full w-full object-cover opacity-85"
                style={{
                  filter:
                    'saturate(0.8) contrast(1.08) brightness(0.92)',
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />

              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
              />

              {/* Player label */}

              <div className="absolute left-2 top-2">

                <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm">
                  Opponent
                </span>

              </div>

              {/* Live badge */}

              <div className="absolute right-2 top-2">
                <LiveBadge />
              </div>

              {/* Connected */}

              <div className="absolute bottom-2 right-2">

                <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">

                  <span className="h-1 w-1 rounded-full bg-[#8FCB9B]" />

                  <span className="text-[8px] text-white/60">
                    connected
                  </span>

                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            RIGHT / CHAT SIDE
        ==================================================== */}

        <div className="flex flex-1 flex-col overflow-hidden lg:max-w-md">

          {/* ==================================================
              CHAT HEADER
              ================================================== */}

          <div className="flex items-center justify-between border-b border-[#1F1F1A] px-4 py-2.5">

            <span className="text-xs font-semibold text-[#9A958B]">
              Game Conversation
            </span>

            <span className="text-[10px] text-[#5A564F]">
              {game.messages.length}{' '}
              messages
            </span>

          </div>

          {/* ==================================================
              TURN STATUS
              ================================================== */}

          <div className="border-b border-[#1F1F1A] px-4 py-2">
            {game.currentTurn === null ? (
              <span className="text-[10px] text-[#5A564F]">
                Waiting for game to start...
              </span>
            ) : isMyTurn ? (
              <span className="text-[10px] font-medium text-[#FF5A36]">
                YOUR TURN —{' '}
                {game.turnAction === 'question'
                  ? 'ASK A QUESTION'
                  : 'ANSWER THE QUESTION'}
              </span>
            ) : (
              <span className="text-[10px] text-[#9A958B]">
                {game.opponent?.name ?? 'Opponent'}'S TURN — WAITING...
              </span>
            )}
          </div>

          {/* ==================================================
              MESSAGES
              ================================================== */}

          <div
            ref={scrollRef}
            className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
          >

            {game.messages.length ===
            0 ? (
              <div className="flex h-full items-center justify-center">

                <div className="text-center">

                  <p className="text-xs text-[#5A564F]">
                    No messages yet
                  </p>

                  <p className="mt-1 text-[10px] text-[#3F3D38]">
                    Start the conversation
                    by asking a question.
                  </p>

                </div>

              </div>
            ) : (
              game.messages.map(
                (message) => (
                  <ChatBubble
                    key={message.id}
                    message={
                      message
                    }
                    isYou={
                      message.senderId ===
                      game.you?.userId
                    }
                  />
                )
              )
            )}

            {game.opponentTyping && (
              <TypingIndicator
                name={
                  game.opponent
                    ?.name ??
                  'Opponent'
                }
              />
            )}

          </div>

          {/* ==================================================
              CHAT INPUT
              ================================================== */}

          <div className="border-t border-[#1F1F1A]">

            {/* Turn information */}

            <div className="px-4 pt-3">

              <p
                className={`text-[10px] ${
                  chatDisabled
                    ? 'text-[#5A564F]'
                    : 'text-[#9A958B]'
                }`}
              >
                {inputPlaceholder}
              </p>

            </div>

            {/* Input */}

            <div
              className={
                chatDisabled
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            >
              <ChatInput
                onSend={
                  handleSendMessage
                }
              />
            </div>

          </div>

          {/* ==================================================
              GAME CONTROLS
              ================================================== */}

          <div className="border-t border-[#1F1F1A] p-3">

            {/* Guess */}

            <button
              onClick={() =>
                setGuessOpen(true)
              }
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >

              <Target className="h-4 w-4" />

              Make your guess

            </button>

            {/* Leave */}

            <div className="mt-3 flex items-center justify-center">

              <GameControls
                onLeave={() =>
                  navigate('/')
                }
              />

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          GUESS MODAL
      ====================================================== */}

      <GuessModal
        open={guessOpen}
        onOpenChange={
          setGuessOpen
        }
        onSubmit={
          submitGuess
        }
      />

    </div>
  );
}