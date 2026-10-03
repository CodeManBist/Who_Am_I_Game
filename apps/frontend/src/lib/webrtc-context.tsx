import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '@/lib/auth-context';
import { gameSocket, type WebSocketEvent } from '@/services/websocket';
import {
  addLocalTracks,
  closeWebRTC,
  prepareWebRTC,
  resetWebRTC,
  startWebRTC,
} from '@/services/webrtc';

type WebRTCStatus =
  | 'idle'
  | 'requesting-media'
  | 'waiting-for-peer'
  | 'negotiating'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'error';

type WebRTCContextValue = {
  roomCode: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: WebRTCStatus;
  initialize: (roomCode: string, position: number | undefined) => void;
  close: () => void;
};

const WebRTCContext = createContext<WebRTCContextValue | undefined>(undefined);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { pathname } = useLocation();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<WebRTCStatus>('idle');

  const roomCodeRef = useRef<string | null>(null);
  const positionRef = useRef<number | undefined>(undefined);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const opponentReadyRef = useRef(false);
  const offerStartedRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const candidateKeysRef = useRef(new Set<string>());

  const close = useCallback(() => {
    closeWebRTC();
    roomCodeRef.current = null;
    positionRef.current = undefined;
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    opponentReadyRef.current = false;
    offerStartedRef.current = false;
    pendingCandidatesRef.current = [];
    candidateKeysRef.current.clear();
    setRoomCode(null);
    setLocalStream(null);
    setRemoteStream(null);
    setStatus('idle');
  }, []);

  const prepareLocalMedia = useCallback(async (expectedRoomCode: string) => {
    try {
      setStatus('requesting-media');
      const stream = await prepareWebRTC();
      if (roomCodeRef.current !== expectedRoomCode) return;
      localStreamRef.current = stream;
      setLocalStream(stream);
      await addLocalTracks(stream);
      if (gameSocket.send({ type: 'webrtc_ready', roomCode: expectedRoomCode })) {
        setStatus('waiting-for-peer');
      }
    } catch (error) {
      console.error('Could not start WebRTC local media:', error);
      setStatus('error');
    }
  }, []);

  const initialize = useCallback((nextRoomCode: string, position: number | undefined) => {
    if (roomCodeRef.current === nextRoomCode) {
      positionRef.current = position;
      return;
    }

    close();
    roomCodeRef.current = nextRoomCode;
    positionRef.current = position;
    peerConnectionRef.current = resetWebRTC();
    setRoomCode(nextRoomCode);
    setStatus('waiting-for-peer');
    void prepareLocalMedia(nextRoomCode);
  }, [close, prepareLocalMedia]);

  const maybeStartOffer = useCallback((forceIceRestart = false) => {
    const connection = peerConnectionRef.current;
    const currentRoomCode = roomCodeRef.current;
    if (
      !connection ||
      !currentRoomCode ||
      positionRef.current !== 1 ||
      !opponentReadyRef.current ||
      offerStartedRef.current
    ) {
      return;
    }
    if (connection.connectionState === 'connected' && !forceIceRestart) return;

    offerStartedRef.current = true;
    setStatus('negotiating');
    void startWebRTC(currentRoomCode, forceIceRestart)
      .catch((error) => {
        console.error('Could not create WebRTC offer:', error);
        setStatus('error');
      })
      .finally(() => {
        offerStartedRef.current = false;
      });
  }, []);

  const applyPendingCandidates = useCallback(async (connection: RTCPeerConnection) => {
    const candidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Could not apply queued WebRTC ICE candidate:', error);
      }
    }
  }, []);

  useEffect(() => {
    const connection = peerConnectionRef.current;
    if (!connection) return;

    connection.ontrack = (event) => {
      const stream = event.streams[0] ?? remoteStreamRef.current ?? new MediaStream();
      if (!stream.getTracks().some((track) => track.id === event.track.id)) {
        stream.addTrack(event.track);
      }
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') setStatus('connected');
      else if (connection.connectionState === 'failed') {
        setStatus('failed');
        if (positionRef.current === 1) maybeStartOffer(true);
        else if (roomCodeRef.current) gameSocket.send({ type: 'webrtc_ready', roomCode: roomCodeRef.current });
      } else if (connection.connectionState === 'disconnected') {
        setStatus('disconnected');
      }
    };
    connection.onicecandidate = (event) => {
      if (event.candidate && roomCodeRef.current) {
        gameSocket.send({
          type: 'webrtc_ice_candidate',
          roomCode: roomCodeRef.current,
          data: event.candidate.toJSON(),
        });
      }
    };
    connection.onicecandidateerror = (event) => {
      console.error('WebRTC ICE candidate error:', event);
    };

    return () => {
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.onicecandidate = null;
      connection.onicecandidateerror = null;
    };
  }, [roomCode, maybeStartOffer]);

  useEffect(() => {
    if (!roomCode || !token) return;

    const handleMessage = async (event: WebSocketEvent) => {
      if (typeof event.roomCode === 'string' && event.roomCode !== roomCodeRef.current) return;
      const connection = peerConnectionRef.current;
      if (!connection) return;

      if (event.type === 'room_state') {
        await prepareLocalMedia(roomCode);
        return;
      }

      if (event.type === 'webrtc_ready') {
        opponentReadyRef.current = true;
        maybeStartOffer();
        return;
      }

      if (event.type === 'webrtc_offer') {
        const offer = event.data as { type?: RTCSdpType; sdp?: string };
        if (offer.type !== 'offer' || typeof offer.sdp !== 'string') return;
        try {
          if (connection.signalingState === 'have-remote-offer') return;
          await connection.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
          await applyPendingCandidates(connection);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          const description = connection.localDescription;
          if (description) {
            gameSocket.send({
              type: 'webrtc_answer',
              roomCode,
              data: { type: description.type, sdp: description.sdp },
            });
          }
        } catch (error) {
          console.error('Could not handle WebRTC offer:', error);
          setStatus('error');
        }
        return;
      }

      if (event.type === 'webrtc_answer') {
        const answer = event.data as { type?: RTCSdpType; sdp?: string };
        if (answer.type !== 'answer' || typeof answer.sdp !== 'string') return;
        try {
          if (connection.signalingState !== 'have-local-offer') return;
          await connection.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
          await applyPendingCandidates(connection);
        } catch (error) {
          console.error('Could not apply WebRTC answer:', error);
          setStatus('error');
        }
        return;
      }

      if (event.type === 'webrtc_ice_candidate') {
        const candidate = event.data as RTCIceCandidateInit;
        if (!candidate || typeof candidate.candidate !== 'string') return;
        const key = `${candidate.usernameFragment ?? ''}:${candidate.sdpMid ?? ''}:${candidate.sdpMLineIndex ?? ''}:${candidate.candidate}`;
        if (candidateKeysRef.current.has(key)) return;
        candidateKeysRef.current.add(key);
        try {
          if (connection.remoteDescription) await connection.addIceCandidate(candidate);
          else pendingCandidatesRef.current.push(candidate);
        } catch (error) {
          console.error('Could not add WebRTC ICE candidate:', error);
        }
      }
    };

    return gameSocket.onMessage((event) => { void handleMessage(event); });
  }, [roomCode, token, applyPendingCandidates, maybeStartOffer, prepareLocalMedia]);

  useEffect(() => {
    if (!token) close();
  }, [token, close]);

  useEffect(() => {
    if (!roomCodeRef.current || /\/(?:room|game)\/[^/]+/.test(pathname)) return;
    close();
  }, [pathname, close]);

  useEffect(() => () => close(), [close]);

  return (
    <WebRTCContext.Provider value={{ roomCode, localStream, remoteStream, status, initialize, close }}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within WebRTCProvider');
  return context;
}
