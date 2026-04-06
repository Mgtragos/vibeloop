'use client';

import { useEffect, useRef, useState } from 'react';

import type { ChatSocket } from './useSocket';

// ── ICE servers ───────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

// ── Signal message types ──────────────────────────────────────────────────────

type OfferSignal = { type: 'offer'; sdp: RTCSessionDescriptionInit };
type AnswerSignal = { type: 'answer'; sdp: RTCSessionDescriptionInit };
type IceSignal = { type: 'ice-candidate'; candidate: RTCIceCandidateInit | null };
type SignalMessage = OfferSignal | AnswerSignal | IceSignal;

function isSignalMessage(v: unknown): v is SignalMessage {
  if (typeof v !== 'object' || v === null) return false;
  const t = (v as Record<string, unknown>)['type'];
  return t === 'offer' || t === 'answer' || t === 'ice-candidate';
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface UseWebRTCOptions {
  socket: ChatSocket | null;
  partnerId: string | null;
  initiator: boolean;
}

export interface UseWebRTCResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWebRTC({ socket, partnerId, initiator }: UseWebRTCOptions): UseWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ── 1. Acquire local media ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function acquireMedia(): Promise<void> {
      console.log('[WebRTC] Requesting camera/mic…');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        console.log('[WebRTC] Local stream acquired:', stream.getTracks().map((t) => t.kind));
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('[WebRTC] getUserMedia failed:', err);
      }
    }

    void acquireMedia();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    };
  }, []);

  // ── 2. Build peer connection when matched ──────────────────────────────────

  useEffect(() => {
    if (!socket || !partnerId || !localStream) {
      console.log('[WebRTC] PC effect skipped:', { socket: !!socket, partnerId, localStream: !!localStream });
      return;
    }

    console.log('[WebRTC] Creating PeerConnection', { partnerId, initiator });

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    const pendingCandidates: RTCIceCandidateInit[] = [];
    let remoteDescSet = false;

    async function drainPendingCandidates(): Promise<void> {
      remoteDescSet = true;
      console.log('[WebRTC] Draining', pendingCandidates.length, 'buffered ICE candidates');
      await Promise.all(
        pendingCandidates.splice(0).map((c) => pc.addIceCandidate(new RTCIceCandidate(c))),
      );
    }

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      console.log('[WebRTC] Adding local track:', track.kind);
      pc.addTrack(track, localStream);
    });

    // Collect remote tracks
    pc.ontrack = ({ track, streams }) => {
      console.log('[WebRTC] ontrack:', track.kind, 'streams:', streams.length);
      // Use the first stream from the event if available; otherwise create one.
      const stream = streams[0] ?? new MediaStream();
      if (!streams[0]) stream.addTrack(track);
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connectionState →', pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    pc.onicecandidate = ({ candidate }) => {
      console.log('[WebRTC] ICE candidate:', candidate?.type ?? 'null (gathering complete)');
      const signal: IceSignal = {
        type: 'ice-candidate',
        candidate: candidate?.toJSON() ?? null,
      };
      socket.emit('chat:signal', { to: partnerId, signal });
    };

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state →', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] signaling state →', pc.signalingState);
    };

    // Inbound signal handler
    async function handleSignal({ signal }: { from: string; signal: unknown }): Promise<void> {
      if (!isSignalMessage(signal)) {
        console.warn('[WebRTC] Unrecognised signal:', signal);
        return;
      }

      console.log('[WebRTC] Signal received:', signal.type);

      switch (signal.type) {
        case 'offer': {
          console.log('[WebRTC] Setting remote description (offer)');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainPendingCandidates();

          console.log('[WebRTC] Creating answer');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const answerSignal: AnswerSignal = { type: 'answer', sdp: answer };
          console.log('[WebRTC] Sending answer');
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          socket!.emit('chat:signal', { to: partnerId!, signal: answerSignal });
          break;
        }

        case 'answer': {
          console.log('[WebRTC] Setting remote description (answer)');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainPendingCandidates();
          break;
        }

        case 'ice-candidate': {
          if (signal.candidate === null) {
            console.log('[WebRTC] Remote ICE gathering complete');
            return;
          }

          if (remoteDescSet) {
            console.log('[WebRTC] Adding ICE candidate immediately');
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            console.log('[WebRTC] Buffering ICE candidate (no remote desc yet)');
            pendingCandidates.push(signal.candidate);
          }
          break;
        }
      }
    }

    socket.on('chat:signal', (payload) => {
      void handleSignal(payload);
    });

    // Initiator sends the first offer
    async function sendOffer(): Promise<void> {
      console.log('[WebRTC] Creating offer');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const offerSignal: OfferSignal = { type: 'offer', sdp: offer };
      console.log('[WebRTC] Sending offer to', partnerId);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      socket!.emit('chat:signal', { to: partnerId!, signal: offerSignal });
    }

    if (initiator) {
      void sendOffer();
    }

    return () => {
      console.log('[WebRTC] Cleaning up PeerConnection');
      socket.off('chat:signal');
      pc.close();
      pcRef.current = null;
      setRemoteStream(null);
      setConnectionState('new');
    };
  }, [socket, partnerId, localStream, initiator]);

  return { localStream, remoteStream, connectionState };
}
