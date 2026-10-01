import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
} from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { MobileMenu } from '@/components/game/MobileMenu';
import { RoomCode } from '@/components/game/RoomCode';
import { useAuth } from '@/lib/auth-context';
import { gameSocket } from '@/services/websocket';

const API_URL = 'http://localhost:3001/api/v1';

const PLAYER_A =
  'https://images.pexels.com/photos/7958715/pexels-photo-7958715.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';

const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';

type RoomPlayer = {
  id: string;
  position: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
};

type RoomData = {
  id: string;
  roomCode: string;
  status: string;
  currentTurn: number | null;
  turnDeadline: string | null;
  startedAt: string | null;
  endedAt: string | null;
  players: RoomPlayer[];
};

export function WaitingRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Prevent sending join_game multiple times
  const hasJoinedSocketRoom = useRef(false);

  /**
   * Load the latest room data from the backend.
   */
  const loadRoom = async (showLoading = false) => {
    if (!roomCode) {
      setError('Room code is missing.');
      setLoading(false);
      return;
    }

    if (!auth.token) {
      navigate(`/auth?redirect=/room/${roomCode}`);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      setError('');

      const response = await fetch(
        `${API_URL}/rooms/${encodeURIComponent(roomCode)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const data = await response.json();

      console.log('Waiting room response:', data);

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            'Unable to load room.'
        );
        return;
      }

      if (!data?.game) {
        setError('Invalid room response from server.');
        return;
      }

      setRoom(data.game);
    } catch (error) {
      console.error('Load room error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /**
   * Initial room load.
   */
  useEffect(() => {
    void loadRoom(true);
  }, [roomCode, auth.token, navigate]);

  /**
   * Connect this Waiting Room to the WebSocket room.
   *
   * We send join_game:
   * 1. Immediately if the socket is already connected.
   * 2. When the authenticated event arrives if the socket is still connecting.
   */
  useEffect(() => {
    if (!roomCode || !auth.token) {
      return;
    }

    hasJoinedSocketRoom.current = false;

    const joinSocketRoom = () => {
      if (hasJoinedSocketRoom.current) {
        return;
      }

      const sent = gameSocket.send({
        type: 'join_game',
        roomCode,
      });

      if (sent) {
        hasJoinedSocketRoom.current = true;

        console.log(
          `Joined WebSocket room: ${roomCode}`
        );
      }
    };

    const unsubscribe = gameSocket.onMessage((event) => {
      console.log(
        'Waiting room WebSocket event:',
        event
      );

      /**
       * If the socket was already connected before this page
       * mounted, authenticated may have already happened.
       * We therefore also check isConnected below.
       */
      if (event.type === 'authenticated') {
        joinSocketRoom();
        return;
      }

      /**
       * Player 2 joined the room.
       *
       * The WebSocket tells us something changed.
       * The HTTP API remains the source of truth for the
       * actual player list.
       */
      if (event.type === 'player_joined') {
        console.log(
          'Player joined. Refreshing room...'
        );

        void loadRoom(false);
        return;
      }

      /**
       * Player left the room.
       */
      if (event.type === 'player_left') {
        console.log(
          'Player left. Refreshing room...'
        );

        void loadRoom(false);
      }
    });

    /**
     * The WebSocket may already be connected because
     * GameProvider owns the global connection.
     */
    if (gameSocket.isConnected) {
      joinSocketRoom();
    }

    return () => {
      unsubscribe();
      hasJoinedSocketRoom.current = false;
    };
  }, [roomCode, auth.token]);

  const currentUser = room?.players.find(
    (player) => player.userId === auth.user?.id
  );

  const opponent = room?.players.find(
    (player) => player.userId !== auth.user?.id
  );

  const opponentJoined = Boolean(opponent);

  const currentPlayerName =
    currentUser?.username ||
    auth.user?.username ||
    'You';

  const opponentName =
    opponent?.username ||
    'Player 2';

  const currentPlayerImage =
    currentUser?.avatarUrl ||
    PLAYER_A;

  const opponentImage =
    opponent?.avatarUrl ||
    PLAYER_B;

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#11110F] text-[#F5F1E8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF5A36]" />

          <p className="text-sm text-[#9A958B]">
            Loading room...
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#11110F] px-6 text-[#F5F1E8]">
        <div className="w-full max-w-md text-center">
          <LogoMark />

          <h1 className="mt-6 font-display text-2xl font-bold">
            Unable to load room
          </h1>

          <p className="mt-2 text-sm text-[#9A958B]">
            {error || 'Something went wrong.'}
          </p>

          <button
            onClick={() => navigate('/join')}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#FF5A36] px-5 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a]"
          >
            Back to join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#11110F] text-[#F5F1E8]">
      {/* Header */}
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-10 sm:py-4">
          <div className="flex items-center gap-3">
            <LogoMark />

            <span className="hidden font-display text-sm font-semibold tracking-tight sm:inline">
              WHO AM I?
            </span>
          </div>

          <div className="flex items-center gap-3">
            <RoomCode code={room.roomCode} />

            <span className="hidden items-center gap-1.5 rounded-md border border-[#2A2A25] bg-[#181815] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9A958B] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A36]" />

              Private
            </span>
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Room info */}
        <div className="border-b border-[#1F1F1A] px-4 py-3 sm:px-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="font-mono text-xs text-[#5A564F]">
              ROOM {room.roomCode}
            </span>

            {opponentJoined ? (
              <span className="flex items-center gap-2 text-xs text-[#8FCB9B] animate-enter-fade">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8FCB9B]" />

                {opponentName} is here
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs text-[#9A958B]">
                <Loader2 className="h-3 w-3 animate-spin" />

                Waiting for your friend...
              </span>
            )}
          </div>
        </div>

        {/* Split player area */}
        <div className="relative flex min-h-0 flex-1 items-stretch">
          {/* LEFT — current player */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center p-2 sm:p-8">
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5A564F] sm:tracking-[0.15em]">
                  Player preview
                </span>

                <span className="rounded bg-[#FF5A36]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF5A36]">
                  You
                </span>
              </div>

              <div className="relative aspect-[3/4] max-h-[34dvh] w-full overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] animate-drift">
                {camOn ? (
                  <img
                    src={currentPlayerImage}
                    alt={currentPlayerName}
                    className="h-full w-full object-cover opacity-85"
                    style={{
                      filter:
                        'saturate(0.8) contrast(1.08) brightness(0.92)',
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <VideoOff className="h-8 w-8 text-[#5A564F]" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-2 left-2">
                  <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                    {currentPlayerName}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2">
                  <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">V2 mock</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER — VS */}
          <div className="flex items-center justify-center px-1 sm:px-2">
            <span className="font-display text-base font-bold text-[#3a3a32] sm:text-4xl">
              VS
            </span>
          </div>

          {/* RIGHT — opponent */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center p-2 sm:p-8">
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5A564F] sm:tracking-[0.15em]">
                  Opponent preview
                </span>

                {opponentJoined ? (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[#8FCB9B]">Joined</span>
                ) : (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[#5A564F]">
                    Waiting
                  </span>
                )}
              </div>

              {opponentJoined ? (
                <div className="relative aspect-[3/4] max-h-[34dvh] w-full overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] animate-scale-in">
                  <img
                    src={opponentImage}
                    alt={opponentName}
                    className="h-full w-full object-cover opacity-85"
                    style={{
                      filter:
                        'saturate(0.8) contrast(1.08) brightness(0.92)',
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute bottom-2 left-2">
                    <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                      {opponentName}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">V2 mock</span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[3/4] max-h-[34dvh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#2A2A25] bg-[#181815]/50">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5A564F]" />

                  <p className="text-xs text-[#5A564F]">
                    Waiting for player 2...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="border-t border-[#1F1F1A] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-10 sm:py-5">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Mic / Camera */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                aria-label={
                  micOn
                    ? 'Mute microphone'
                    : 'Unmute microphone'
                }
                className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-all ${
                  micOn
                    ? 'border-[#2A2A25] bg-[#181815] text-[#9A958B] hover:text-[#F5F1E8]'
                    : 'border-[#E56B6F]/30 bg-[#E56B6F]/10 text-[#E56B6F]'
                }`}
              >
                {micOn ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={() => setCamOn(!camOn)}
                aria-label={
                  camOn
                    ? 'Turn off camera'
                    : 'Turn on camera'
                }
                className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-all ${
                  camOn
                    ? 'border-[#2A2A25] bg-[#181815] text-[#9A958B] hover:text-[#F5F1E8]'
                    : 'border-[#E56B6F]/30 bg-[#E56B6F]/10 text-[#E56B6F]'
                }`}
              >
                {camOn ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Main action */}
            <button
              onClick={() =>
                navigate(`/room/${room.roomCode}/select`)
              }
              disabled={!opponentJoined}
              className="group inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-md bg-[#FF5A36] px-4 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:pointer-events-none disabled:opacity-30 sm:w-auto sm:px-6 sm:text-base"
            >
              Choose your character

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
