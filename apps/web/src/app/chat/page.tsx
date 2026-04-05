'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';

// ── Constants ─────────────────────────────────────────────────────────────────

const INTEREST_TAGS = ['Gaming', 'Music', 'Art', 'Sports', 'Travel', 'Tech', 'Movies', 'Food'];

function getOrCreateUserId(): string {
  // sessionStorage gives each tab its own ID, so two tabs in the same browser
  // get distinct userIds and can be matched with each other.
  const existing = sessionStorage.getItem('vibeloop:userId');
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem('vibeloop:userId', id);
  return id;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatState =
  | { phase: 'idle' }
  | { phase: 'queued'; position: number }
  | { phase: 'matched'; partnerId: string; initiator: boolean };

type Message = { id: string; text: string; self: boolean };

// ── Icons ─────────────────────────────────────────────────────────────────────

function MicOnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
    </svg>
  );
}

function CamOnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  );
}

function CamOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21 6.5l-4-4-9.63 9.63.01.01L3 16.5V21h4.5l4.5-4.5.01.01L21 6.5zM5 19v-2.5l8-8 2.5 2.5-8 8H5zm10.5-10.5l-1.5 1.5-2.5-2.5 1.5-1.5 2.5 2.5zM3.27 2L2 3.27 5.73 7H5L3 9v6l2-2h1l2 2h3l-2.27-2.27L3.27 2z" />
    </svg>
  );
}

function SkipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-200 ${
        active
          ? 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
          : 'bg-white/10 backdrop-blur-md hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const socket = useSocket();
  const [state, setState] = useState<ChatState>({ phase: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const userIdRef = useRef<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const partnerId = state.phase === 'matched' ? state.partnerId : null;
  const initiator = state.phase === 'matched' ? state.initiator : false;

  const { localStream, remoteStream, connectionState } = useWebRTC({
    socket,
    partnerId,
    initiator,
  });

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Scroll messages to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('chat:queued', ({ position }) => {
      setState({ phase: 'queued', position });
      setError(null);
    });
    socket.on('chat:matched', ({ partnerId: pid, initiator: init }) => {
      setState({ phase: 'matched', partnerId: pid, initiator: init });
      setMessages([]);
      setError(null);
    });
    socket.on('chat:partner-left', () => {
      setState({ phase: 'idle' });
      setMessages([]);
    });
    socket.on('chat:error', ({ message }) => setError(message));
    socket.on('chat:message', ({ text }) => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text, self: false }]);
    });

    return () => {
      socket.off('chat:queued');
      socket.off('chat:matched');
      socket.off('chat:partner-left');
      socket.off('chat:error');
      socket.off('chat:message');
    };
  }, [socket]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleStart() {
    if (!socket) return;
    if (!userIdRef.current) userIdRef.current = getOrCreateUserId();
    socket.emit('chat:join-queue', { userId: userIdRef.current });
  }

  function handleSkip() {
    if (!socket) return;
    socket.emit('chat:skip');
    setState({ phase: 'idle' });
    setMessages([]);
  }

  function handleCancel() {
    if (!socket) return;
    socket.emit('chat:skip');
    setState({ phase: 'idle' });
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function toggleMute() {
    if (!localStream) return;
    const next = !isMuted;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setIsMuted(next);
  }

  function toggleCamera() {
    if (!localStream) return;
    const next = !isCameraOff;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setIsCameraOff(next);
  }

  function sendMessage() {
    if (!socket || !messageInput.trim() || state.phase !== 'matched') return;
    const text = messageInput.trim();
    socket.emit('chat:message', { to: state.partnerId, text });
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), text, self: true }]);
    setMessageInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isMatched = state.phase === 'matched';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030712]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#060f23] to-[#020617]" />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/5 blur-3xl" />

      {/* ── Matched: remote video + vignette ── */}
      {isMatched && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Radial vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
          {/* Top fade for header legibility */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 to-transparent" />
          {/* Bottom fade for controls legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </>
      )}

      {/* ── Pre-match: landing / queued ── */}
      {!isMatched && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-5">
          {/* Logo */}
          <div className="mb-12 text-center">
            <h1 className="text-6xl font-black tracking-tight text-white sm:text-7xl">
              Vibe
              <span className="text-cyan-400 [text-shadow:0_0_40px_rgba(34,211,238,0.9),0_0_80px_rgba(34,211,238,0.4)]">
                Loop
              </span>
            </h1>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.25em] text-gray-600">
              Meet someone new · right now
            </p>
          </div>

          {/* Idle */}
          {state.phase === 'idle' && (
            <div className="w-full max-w-sm animate-fade-up space-y-8">
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-gray-600">
                  Pick your vibe
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {INTEREST_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-cyan-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.65)]'
                          : 'border border-white/10 bg-white/5 text-gray-400 hover:border-cyan-500/40 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!socket}
                className="w-full rounded-2xl bg-cyan-500 py-4 text-base font-bold text-white shadow-[0_0_32px_rgba(6,182,212,0.5)] transition-all duration-200 hover:bg-cyan-400 hover:shadow-[0_0_50px_rgba(6,182,212,0.75)] active:scale-[0.98] disabled:opacity-40"
              >
                {socket ? 'Find Someone' : 'Connecting…'}
              </button>
            </div>
          )}

          {/* Queued */}
          {state.phase === 'queued' && (
            <div className="flex animate-fade-in flex-col items-center gap-5">
              <div className="flex items-center gap-2.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block h-3 w-3 rounded-full bg-cyan-400"
                    style={{
                      animation: `pulse-dot 1.4s ease-in-out ${(i * 0.18).toFixed(2)}s infinite`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xl font-semibold text-white">Finding someone…</p>
              <p className="text-sm text-gray-500">Position #{state.position} in queue</p>
              <button
                onClick={handleCancel}
                className="mt-1 rounded-full border border-white/10 px-7 py-2 text-sm font-medium text-gray-400 transition hover:border-white/25 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Header (always visible) ── */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4">
        <span className="text-lg font-black text-white">
          Vibe
          <span className="text-cyan-400 [text-shadow:0_0_16px_rgba(34,211,238,0.7)]">Loop</span>
        </span>
        {isMatched && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
              connectionState === 'connected'
                ? 'text-emerald-400 ring-emerald-400/30'
                : connectionState === 'failed'
                  ? 'text-red-400 ring-red-400/30'
                  : 'text-amber-400 ring-amber-400/30'
            }`}
          >
            {connectionState}
          </span>
        )}
      </header>

      {/* ── Local video PiP ── */}
      {localStream && (
        <div className="absolute bottom-[7.5rem] right-4 z-30 sm:bottom-40 sm:right-5">
          <div className="relative overflow-hidden rounded-2xl shadow-[0_0_0_2px_rgba(34,211,238,0.5),0_0_28px_rgba(34,211,238,0.3),0_8px_32px_rgba(0,0,0,0.5)]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-28 w-20 object-cover sm:h-36 sm:w-24 ${isCameraOff ? 'invisible' : ''}`}
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <CamOffIcon className="h-6 w-6 text-gray-500" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Matched overlay: chat + controls ── */}
      {isMatched && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col">
          {/* Message bubbles */}
          {messages.length > 0 && (
            <div className="mx-4 mb-2 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
                  <span
                    className={`max-w-[72%] rounded-2xl px-3.5 py-1.5 text-sm text-white backdrop-blur-md ${
                      msg.self ? 'bg-cyan-500/75' : 'bg-white/15'
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Chat input */}
          <div className="flex items-center gap-2.5 px-4 pb-3 pt-1">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something…"
              className="flex-1 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none backdrop-blur-md transition focus:border-cyan-500/50"
            />
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.5)] transition hover:bg-cyan-400 disabled:opacity-30"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-6 px-6 pb-8 pt-2">
            <ToolButton onClick={toggleMute} active={isMuted}>
              {isMuted ? (
                <MicOffIcon className="h-6 w-6 text-white" />
              ) : (
                <MicOnIcon className="h-6 w-6 text-white" />
              )}
            </ToolButton>

            {/* Skip — primary CTA, larger */}
            <button
              onClick={handleSkip}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-[0_0_28px_rgba(239,68,68,0.55)] transition hover:bg-red-500 active:scale-95"
            >
              <SkipIcon className="h-7 w-7 text-white" />
            </button>

            <ToolButton onClick={toggleCamera} active={isCameraOff}>
              {isCameraOff ? (
                <CamOffIcon className="h-6 w-6 text-white" />
              ) : (
                <CamOnIcon className="h-6 w-6 text-white" />
              )}
            </ToolButton>
          </div>
        </div>
      )}

      {/* ── Error toast ── */}
      {error && (
        <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded-xl bg-red-950/90 px-4 py-2.5 text-sm text-red-300 shadow-xl backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
