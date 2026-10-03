import { gameSocket } from "./websocket";

declare global {
  interface Window {
    __WHOMI_ICE_SERVERS__?: RTCIceServer[];
  }
}

const defaultIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

function createPeerConnection() {
  const configuredServers = typeof window !== 'undefined' ? window.__WHOMI_ICE_SERVERS__ : undefined;
  const iceServers = configuredServers?.length ? configuredServers : defaultIceServers;
  return new RTCPeerConnection({ iceServers });
}

export let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let mediaRequest: Promise<MediaStream> | null = null;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function resetWebRTC() {
  closeWebRTC();
  peerConnection = createPeerConnection();
  return peerConnection;
}

export function closeWebRTC() {
  // Invalidates a pending getUserMedia request; its tracks are stopped if it
  // resolves after this cleanup.
  mediaRequest = null;
  stopStream(localStream);
  localStream = null;
  const connection = peerConnection;
  peerConnection = null;
  if (connection && connection.signalingState !== 'closed') connection.close();
}

export async function prepareWebRTC(): Promise<MediaStream> {
  const currentTracks = localStream?.getTracks() ?? [];
  if (currentTracks.length > 0 && currentTracks.every((track) => track.readyState === 'live')) return localStream!;
  if (mediaRequest) return mediaRequest;

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera and microphone access is not supported in this browser or page context');
  }

  const request = navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  mediaRequest = request;
  try {
    const stream = await request;
    if (mediaRequest !== request) {
      stopStream(stream);
      throw new Error('WebRTC media request was cancelled');
    }
    localStream = stream;
    return stream;
  } finally {
    if (mediaRequest === request) mediaRequest = null;
  }
}

export async function addLocalTracks(stream: MediaStream) {
  const connection = peerConnection;
  if (!connection) throw new Error('WebRTC peer connection has not been initialized');
  for (const track of stream.getTracks()) {
    if (connection !== peerConnection || connection.signalingState === 'closed') throw new Error('WebRTC peer connection was closed during media setup');
    const sender = connection.getSenders().find((item) => item.track?.kind === track.kind);
    if (sender) {
      if (sender.track?.id !== track.id) await sender.replaceTrack(track);
    } else {
      connection.addTrack(track, stream);
    }
  }
}

function isCurrentPeerConnection(connection: RTCPeerConnection) {
  return connection === peerConnection && connection.signalingState !== 'closed';
}

export async function startWebRTC(roomCode: string, forceIceRestart = false) {
  const connection = peerConnection;
  if (!connection) throw new Error('WebRTC peer connection has not been initialized');
  if (connection.connectionState === 'connected') return;

  if (connection.signalingState !== 'have-local-offer') {
    if (connection.signalingState !== 'stable') {
      throw new Error(`Cannot create WebRTC offer while signaling state is ${connection.signalingState}`);
    }
    const restartIce = forceIceRestart || ['failed', 'disconnected'].includes(connection.iceConnectionState);
    const offer = await connection.createOffer(restartIce ? { iceRestart: true } : undefined);
    if (!isCurrentPeerConnection(connection)) throw new Error('WebRTC offer was cancelled');
    await connection.setLocalDescription(offer);
    console.log('Created WebRTC offer:', offer);
  }

  if (!isCurrentPeerConnection(connection)) throw new Error('WebRTC offer was cancelled');
  const description = connection.localDescription;
  if (!description || description.type !== 'offer') throw new Error('Local WebRTC offer is unavailable');
  const sent = gameSocket.send({
    type: 'webrtc_offer',
    roomCode,
    data: { type: description.type, sdp: description.sdp },
  });
  if (!sent) throw new Error('WebSocket is unavailable; WebRTC offer was not sent');
  console.log('WebRTC offer sent:', roomCode);
}
