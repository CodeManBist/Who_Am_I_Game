import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { Target, VideoOff } from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { RoomCode } from '@/components/game/RoomCode';
import {
  ChatBubble,
  TypingIndicator,
} from '@/components/game/ChatBubble';
import { ChatInput } from '@/components/game/ChatInput';
import { GameControls } from '@/components/game/GameControls';
import { GuessModal } from '@/components/game/GuessModal';
import { MobileMenu } from '@/components/game/MobileMenu';

import { useGame } from '@/lib/game-context';
import { useWebRTC } from '@/lib/webrtc-context';

import { gameSocket } from '@/services/websocket';

export function GamePage() {
  const { roomCode } =
    useParams();

  const navigate =
    useNavigate();

  const game =
    useGame();
  const { remoteStream } = useWebRTC();

  const [guessOpen, setGuessOpen] =
    useState(false);
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);

  const scrollRef =
    useRef<HTMLDivElement>(null);
  const remoteVideoRef =
    useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;
    remoteVideoRef.current.srcObject = remoteStream;
    void remoteVideoRef.current.play().catch((error) => {
      console.warn('Remote media autoplay was blocked:', error);
    });
  }, [remoteStream]);

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

  useEffect(() => gameSocket.onMessage((event) => {
    if (event.type === 'game_finished') {
      navigate(`/game/${roomCode}/result`, { replace: true });
    }
  }), [navigate, roomCode]);

  // Recover if the finish event was missed during a brief disconnect.
  useEffect(() => {
    if (!roomCode) return;
    const checkFinished = async () => {
      const token = localStorage.getItem('whoami-token');
      if (!token) return;
      try {
        const response = await fetch(`http://localhost:3001/api/v1/rooms/${encodeURIComponent(roomCode)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.game?.status === 'FINISHED') {
          navigate(`/game/${roomCode}/result`, { replace: true });
        }
      } catch (error) {
        console.error('Could not refresh game result:', error);
      }
    };
    const interval = window.setInterval(() => void checkFinished(), 2500);
    return () => window.clearInterval(interval);
  }, [navigate, roomCode]);

  // ------------------------------------------------------------
  // Opponent image
  // ------------------------------------------------------------

  const myCharacterImageUrl = game.you?.characterImageUrl;
  const myCharacterName = game.you?.characterName;

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
    const result =
      await game.submitGuess(
        guess
      );

    setGuessOpen(false);
    if (result?.gameStatus === 'FINISHED' && result.correct === true) {
      navigate(
        `/game/${roomCode}/result`,
        { replace: true }
      );
    } else if (result?.correct === false && result.gameStatus === 'PLAYING') {
      setGuessFeedback('Not quite. The game continues—keep asking questions and try again on a later turn.');
    } else {
      setGuessFeedback('Your guess could not be submitted. Please check your connection and try again.');
    }
  };

  const leaveGame = async () => {
    try {
      const token = localStorage.getItem('whoami-token');
      if (roomCode && token) {
        await fetch(`http://localhost:3001/api/v1/rooms/${encodeURIComponent(roomCode)}/leave`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      navigate('/');
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
    <div className="game-page-shell flex h-[100dvh] flex-col overflow-hidden bg-[#11110F] pb-[env(safe-area-inset-bottom)] text-[#F5F1E8]">

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

      <header className="grid h-[calc(3.25rem+env(safe-area-inset-top))] shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#1F1F1A] px-3 pt-[env(safe-area-inset-top)] sm:h-[calc(3.5rem+env(safe-area-inset-top))] sm:gap-4 sm:px-6 sm:pt-[env(safe-area-inset-top)]">

        {/* Logo */}

        <div className="flex items-center gap-2.5">
          <LogoMark size={18} />

          <span className="hidden font-display text-xs font-semibold tracking-tight sm:inline">
            WHO AM I?
          </span>
        </div>

        {/* Game status */}

        <div className="flex min-w-0 justify-center">
          <span className="max-w-full truncate rounded-full border border-[#2A2A25] bg-[#181815] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9A958B] sm:px-3 sm:text-[10px] sm:tracking-[0.12em]">
            {game.currentTurn === null ? 'Getting ready' : isMyTurn ? 'Your turn' : 'Opponent turn'}
          </span>

        </div>

        {/* Room */}

        <div className="flex items-center gap-1.5 sm:gap-3">

          <RoomCode
            code={
              roomCode ?? ''
            }
          />

          <span className={`hidden rounded border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide sm:inline-flex ${game.isSocketConnected ? 'border-[#8FCB9B]/25 text-[#8FCB9B]' : 'border-[#E56B6F]/25 text-[#E56B6F]'}`}>
            {game.isSocketConnected ? 'Connected' : 'Reconnecting'}
          </span>
          <MobileMenu />

        </div>

      </header>

      {/* ======================================================
          MAIN GAME AREA
      ====================================================== */}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">

        {/* ====================================================
            LEFT SIDE
        ==================================================== */}

        <div className="game-character-panel grid shrink-0 grid-cols-1 items-start gap-y-2 border-b border-[#1F1F1A] px-3 py-2.5 sm:p-4 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:items-center lg:gap-5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">

          {/* Label */}

          <p className="game-character-hint text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[#FF5A36] sm:text-[10px]">
            Your character
          </p>

          <div className="flex min-w-0 flex-col items-center gap-1.5 lg:w-full lg:gap-2">
            <div className="game-character-image flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg border border-[#8FCB9B]/30 bg-[#181815] sm:h-20 sm:w-16 lg:h-28 lg:w-20">
              {myCharacterImageUrl ? <img src={myCharacterImageUrl} alt="Your chosen character" className="h-full w-full object-cover" /> : <span className="px-2 text-center text-xs text-[#5A564F]">Loading your character…</span>}
            </div>
            <div className="min-w-0 max-w-full text-center">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8FCB9B] sm:text-[10px]">My Character</p>
              <p className="mt-0.5 max-w-36 truncate text-[10px] text-[#F5F1E8] sm:text-xs">{myCharacterName || 'Your secret choice'}</p>
            </div>
          </div>

          <div className="game-v2-preview mx-auto flex w-full max-w-2xl flex-col items-stretch gap-2 overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] p-2 lg:mt-1 lg:w-full lg:max-w-none lg:p-2.5">
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-[#11110F]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`h-full w-full object-cover ${remoteStream ? 'opacity-70' : 'opacity-0'}`}
                aria-label="Opponent video"
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                  <VideoOff className="h-5 w-5 text-[#5A564F]" />
                  <span className="px-3 text-[9px] text-[#9A958B]">Waiting for opponent video</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-[10px] font-semibold text-[#F5F1E8] sm:text-xs">Video call</p>
              <p className="truncate text-[9px] text-[#9A958B] sm:text-[10px]">Live opponent video</p>
            </div>
            <p className="hidden text-center text-[10px] font-medium text-[#9A958B] lg:block">Live opponent video</p>
          </div>

        </div>

        {/* ====================================================
            RIGHT / CHAT SIDE
        ==================================================== */}

        <div className="game-chat-panel flex min-h-[18rem] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0 lg:w-[min(36vw,34rem)] lg:flex-none">

          {/* ==================================================
              CHAT HEADER
              ================================================== */}

          <div className="game-chat-header flex items-center justify-between border-b border-[#1F1F1A] px-4 py-2.5">

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

          <div className="game-turn-status border-b border-[#1F1F1A] px-4 py-2">
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

          {guessFeedback && (
            <div role="status" className="mx-3 mt-3 rounded-md border border-[#FF5A36]/25 bg-[#FF5A36]/10 px-3 py-2 text-xs text-[#F5F1E8] sm:mx-4">
              <div className="flex items-start justify-between gap-3">
                <span>{guessFeedback}</span>
                <button type="button" className="shrink-0 text-[#9A958B] underline" onClick={() => setGuessFeedback(null)}>Dismiss</button>
              </div>
            </div>
          )}

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

          <div className="game-action-footer shrink-0 border-t border-[#1F1F1A] p-2 pb-3 sm:p-3">

            {/* Guess */}

            <button
              onClick={() =>
                setGuessOpen(true)
              }
              disabled={!isMyTurn || !game.isSocketConnected}
              title={!isMyTurn ? 'You can guess during your turn' : undefined}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:cursor-not-allowed disabled:opacity-40"
            >

              <Target className="h-4 w-4" />

              Make your guess

            </button>

            {/* Leave */}

            <div className="game-secondary-controls mt-3 flex items-center justify-center">

              <GameControls
                onLeave={leaveGame}
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
