import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Check,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { MobileMenu } from '@/components/game/MobileMenu';
import { useAuth } from '@/lib/auth-context';
import { gameSocket } from '@/services/websocket';

const API_URL = 'http://localhost:3001/api/v1';

type UploadedCharacter = {
  name: string;
  imageUrl: string;
  confidence: number;
  facts?: Record<string, unknown> | null;
};

export function CharacterSelectPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [character, setCharacter] =
    useState<UploadedCharacter | null>(null);

  const [identifying, setIdentifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [opponentReady, setOpponentReady] = useState(false);
  const [error, setError] = useState('');

  /*
   * Clean up local preview URL.
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /*
   * Listen for opponent character_ready event.
   */
  useEffect(() => {
    if (!roomCode || !auth.user?.id) {
      return;
    }
  
    const unsubscribe = gameSocket.onMessage((event) => {
      console.log(
        'Character select WebSocket event:',
        event
      );
  
      if (event.type !== 'character_confirmed') {
        return;
      }
  
      const confirmedUserId = event.userId;
  
      // Ignore our own confirmation.
      if (confirmedUserId === auth.user?.id) {
        return;
      }
  
      // Opponent has clicked "Lock it in".
      setOpponentReady(true);
    });
  
    return () => {
      unsubscribe();
    };
  }, [roomCode, auth.user?.id]);

  /*
   * Open file picker.
   */
  const openFilePicker = () => {
    if (identifying || confirmed) {
      return;
    }

    fileInputRef.current?.click();
  };

  /*
 * Check the current room confirmation state.
 *
 * WebSocket handles live updates.
 * This HTTP check handles the case where the
 * character_confirmed event was missed.
 */
const checkRoomReadyState = async () => {
  if (!roomCode || !auth.token || !auth.user?.id) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/rooms/${encodeURIComponent(roomCode)}`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || 'Failed to check room status.'
      );
    }

    const players = data?.game?.players ?? [];

    const currentPlayer = players.find(
      (player: {
        userId: string;
        position?: number;
        characterConfirmed?: boolean;
      }) => player.userId === auth.user?.id
    );
    if (currentPlayer?.characterConfirmed) setConfirmed(true);

    const opponent = players.find(
      (player: {
        userId: string;
        characterConfirmed?: boolean;
      }) => player.userId !== auth.user?.id
    );
    
    if (opponent?.characterConfirmed) {
      setOpponentReady(true);
    }

  } catch (error) {
    console.error(
      'Failed to check character confirmation:',
      error
    );
  }
};

  useEffect(() => {
    checkRoomReadyState();
    const interval = window.setInterval(checkRoomReadyState, 3000);
    return () => window.clearInterval(interval);
  }, [roomCode, auth.token, auth.user?.id]);

  /*
   * Handle image selection.
   */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');

    // Validate image type.
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    // Backend currently allows max 5 MB.
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    // Clean previous preview.
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localPreview = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(localPreview);
    setCharacter(null);
    setConfirmed(false);
    setOpponentReady(false);

    /*
     * Start real AI identification immediately
     * after the user selects the image.
     */
    await uploadCharacter(file);
  };

  /*
   * Upload character to backend.
   */
  const uploadCharacter = async (file: File) => {
    if (!roomCode) {
      setError('Room code is missing.');
      return;
    }

    if (!auth.token) {
      navigate(`/auth?redirect=/room/${roomCode}/select`);
      return;
    }

    try {
      setIdentifying(true);
      setError('');
      setCharacter(null);

      const formData = new FormData();

      formData.append('image', file);

      const response = await fetch(
        `${API_URL}/rooms/${encodeURIComponent(roomCode)}/character`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      console.log(
        'Character upload response:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Failed to identify character.'
        );
      }

      if (!data?.player) {
        throw new Error(
          'Character was uploaded but no character information was returned.'
        );
      }

      setCharacter({
        name: data.player.characterName,
        imageUrl:
          data.player.characterImageUrl ||
          localPreviewFallback(file),
        confidence: data.player.aiConfidence ?? 0,
        facts: data.player.characterFacts ?? null,
      });
    } catch (error) {
      console.error(
        'Character upload error:',
        error
      );

      setCharacter(null);

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to upload and identify character.'
      );
    } finally {
      setIdentifying(false);
    }
  };

  /*
   * Fallback only if backend doesn't return an image URL.
   */
  const localPreviewFallback = (file: File) => {
    return URL.createObjectURL(file);
  };

  /*
   * Choose another image.
   */
  const chooseAnother = () => {
    if (identifying) {
      return;
    }

    setSelectedFile(null);
    setCharacter(null);
    setError('');
    setConfirmed(false);
    setOpponentReady(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    fileInputRef.current?.click();
  };

  /*
   * Lock the character after successful AI identification.
   */

  const confirm = async () => {
    if (!character || identifying || !auth.token || !roomCode) {
      return;
    }
  
    try {
      setError('');
  
      const response = await fetch(
        `${API_URL}/rooms/${encodeURIComponent(roomCode)}/character/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to confirm character.'
        );
      }
  
      setConfirmed(true);
  
      console.log(
        'Character confirmed:',
        data
      );
    } catch (error) {
      console.error(
        'Character confirmation error:',
        error
      );
  
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to confirm character.'
      );
    }
  };

  /*
   * Once our character is locked and opponent is also ready,
   * move to countdown.
   */
  useEffect(() => {
    if (!confirmed || !opponentReady || !roomCode) {
      return;
    }
  
    // Enter immediately so neither client loses the first countdown second.
    navigate(`/room/${roomCode}/countdown`);
  }, [
    confirmed,
    opponentReady,
    navigate,
    roomCode,
  ]);

  /*
   * Convert Gemini confidence:
   *
   * Backend:
   * 0.8 -> 80%
   * 0.9 -> 90%
   * 1   -> 100%
   */
  const confidencePercentage = character
    ? Math.round(
        Math.max(
          0,
          Math.min(1, character.confidence)
        ) * 100
      )
    : 0;

  const acceptedAliases = Array.isArray(character?.facts?.aliases)
    ? character.facts.aliases.filter((alias): alias is string => typeof alias === 'string' && alias.trim().length > 0)
    : [];

  if (confirmed) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#11110F] text-[#F5F1E8]">
        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 sm:right-6"><MobileMenu /></div>
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8FCB9B]/8 blur-3xl" />

        <div className="relative text-center animate-scale-in">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#8FCB9B]/15 ring-1 ring-[#8FCB9B]/30">
            <Check className="h-7 w-7 text-[#8FCB9B]" />
          </div>

          <h1 className="font-display text-2xl font-bold">
            Locked in.
          </h1>

          <p className="mt-2 text-sm text-[#9A958B]">
            Your mystery person is secret.
          </p>

          {opponentReady ? (
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#8FCB9B]">
              <Check className="h-4 w-4" />
              Both players are ready.
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#5A564F]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for your opponent to confirm...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#11110F] text-[#F5F1E8]">
      {/* Header */}
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-10 sm:py-4">
          <div className="flex items-center gap-3">
            <LogoMark />

            <span className="hidden font-display text-sm font-semibold tracking-tight sm:inline">
              WHO AM I?
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/room/${roomCode}`)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[12px] text-[#9A958B] transition-colors hover:bg-[#181815] hover:text-[#F5F1E8] sm:px-2.5 sm:text-[13px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to room
            </button>
            <MobileMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 py-7 sm:px-10 sm:py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Pick someone they know.
        </h1>

        <p className="mt-2 text-sm text-[#9A958B]">
          Choose your character. Your opponent will try to figure out who you picked.
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload / change image area */}
        <div className="mt-8">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={identifying}
            className="group relative min-h-20 w-full overflow-hidden rounded-lg border border-dashed border-[#2A2A25] bg-[#181815] p-4 transition-all hover:border-[#FF5A36]/40 hover:bg-[#211F1B] disabled:pointer-events-none disabled:opacity-60 sm:p-6"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#211F1B] ring-1 ring-[#2A2A25] transition-all group-hover:bg-[#FF5A36]/10 group-hover:ring-[#FF5A36]/30">
                {identifying ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#FF5A36]" />
                ) : selectedFile ? (
                  <ImageIcon className="h-5 w-5 text-[#9A958B] transition-colors group-hover:text-[#FF5A36]" />
                ) : (
                  <Upload className="h-5 w-5 text-[#9A958B] transition-colors group-hover:text-[#FF5A36]" />
                )}
              </div>

              <div className="text-left">
                <p className="text-sm font-semibold">
                  {identifying
                    ? 'Identifying your image...'
                    : selectedFile
                      ? 'Choose another photo'
                      : 'Upload a photo'}
                </p>

                <p className="mt-0.5 text-xs text-[#5A564F]">
                  JPG, PNG, WebP or AVIF up to 5MB
                </p>
              </div>
            </div>
          </button>

          <p className="mt-3 text-center text-xs text-[#5A564F]">
            Your image is kept secret from your opponent.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-lg border border-[#E56B6F]/20 bg-[#E56B6F]/10 px-4 py-3 text-sm text-[#E56B6F]">
            {error}
          </div>
        )}

        {/* Identification panel */}
        {selectedFile && (
          <div className="mt-8 animate-slide-up">
            {identifying ? (
              <div className="rounded-lg border border-[#2A2A25] bg-[#181815] p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#FF5A36]" />

                  <span className="text-sm font-semibold text-[#9A958B]">
                    AI IS IDENTIFYING YOUR CHARACTER...
                  </span>
                </div>

                <div className="mt-4 relative h-1 overflow-hidden rounded-full bg-[#211F1B]">
                  <div className="absolute inset-0 shimmer-bg" />
                </div>

                <p className="mt-3 text-xs text-[#5A564F]">
                  Checking the image and identifying the person or character.
                </p>
              </div>
            ) : character ? (
              <div className="rounded-lg border border-[#2A2A25] bg-[#181815] p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {/* Single image display */}
                  <div className="relative mx-auto h-36 w-28 shrink-0 overflow-hidden rounded-md border border-[#2A2A25] sm:mx-0">
                    <img
                      src={
                        character.imageUrl ||
                        previewUrl ||
                        ''
                      }
                      alt="Your selected character"
                      className="h-full w-full object-cover"
                      style={{
                        filter:
                          'saturate(0.85) contrast(1.05) brightness(0.9)',
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF5A36]">
                        SECRET CHARACTER
                      </p>

                      <p className="mt-1 font-display text-lg font-bold">
                        {character.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-md bg-[#FF5A36]/8 px-3 py-2 ring-1 ring-[#FF5A36]/15">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FF5A36]" />

                      <span className="text-xs text-[#9A958B]">
                        AI identified:
                      </span>

                      <span className="truncate text-xs font-semibold text-[#F5F1E8]">
                        {character.name}
                      </span>
                    </div>

                    {acceptedAliases.length > 0 && (
                      <p className="text-xs leading-relaxed text-[#9A958B]">
                        Guesses accepted: <span className="text-[#F5F1E8]">{character.name}</span>
                        {acceptedAliases.map((alias) => `, ${alias}`).join('')}
                      </p>
                    )}

                    {/* Correct confidence percentage */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-[#5A564F]">
                          AI Confidence
                        </span>

                        <span className="text-xs font-semibold text-[#FF5A36]">
                          {confidencePercentage}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#211F1B]">
                        <div
                          className="h-full rounded-full bg-[#FF5A36] transition-all duration-700"
                          style={{
                            width: `${confidencePercentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={chooseAnother}
                    disabled={identifying}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-4 py-2 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Choose another
                  </button>

                  <button
                    onClick={confirm}
                    disabled={!character || identifying}
                    className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Lock it in
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {!selectedFile && !error && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#5A564F]">
              Upload a photo to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
