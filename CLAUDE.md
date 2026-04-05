# VibeLoop — Project Guide

Real-time video chat platform. Monorepo managed with **npm workspaces**.

## Structure

```
vibeloop/
├── apps/
│   ├── web/                  Next.js 14 (App Router, TypeScript, Tailwind) — port 3000
│   │   └── src/hooks/        useSocket.ts, useWebRTC.ts
│   └── api/                  NestJS (TypeScript, Socket.IO, Prisma) — port 4000
│       ├── src/chat/         WebRTC signaling gateway + Redis queue service
│       ├── src/match/        Match queue business logic
│       └── prisma/           schema.prisma + migrations
├── packages/
│   └── types/
│       ├── src/index.ts      Shared TS types (User, API responses)
│       └── src/events.ts     All WebSocket event shapes (canonical source of truth)
├── tsconfig.json             Root strict TypeScript config (all packages extend this)
├── .eslintrc.js              Root ESLint config (shared across all packages)
└── .prettierrc               Prettier config (shared)
```

## Commands

Run all of these from the repo root (`/vibeloop`) unless noted.

| Command | Description |
|---|---|
| `npm install` | Install all workspace dependencies |
| `npm run dev` | Start web + api in dev mode |
| `npm run build` | Build all packages and apps |
| `npm run db:migrate` | Run Prisma migrations (`prisma migrate dev`) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run all tests across workspaces |
| `npm run lint` | Lint all TypeScript files (0 warnings allowed) |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Type-check all workspaces |

### Per-workspace

```bash
npm run dev -w @vibeloop/web          # Next.js on :3000
npm run dev -w @vibeloop/api          # NestJS watch mode on :4000
npm run build -w @vibeloop/types      # Compile shared types to dist/
```

## Environment variables

Copy `.env.example` → `.env` in each app that needs it.

**`apps/api/.env`**
```
DATABASE_URL="postgresql://user:password@localhost:5432/vibeloop"
PORT=4000
CORS_ORIGIN=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

**`apps/web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Architecture

### WebRTC signaling — `apps/api/src/chat/`

`ChatGateway` (Socket.IO namespace `/chat`) handles the full peer-connection lifecycle:

| Event (client → server) | Behaviour |
|---|---|
| `chat:join-queue` | Enqueue user; match immediately if a candidate is waiting |
| `chat:signal` | Relay opaque SDP/ICE payload to the named recipient socket |
| `chat:skip` | End session, requeue both peers |
| `disconnect` | Implicit skip + key cleanup |

| Event (server → client) | Payload |
|---|---|
| `chat:matched` | `{ partnerId, initiator }` |
| `chat:signal` | `{ from, signal }` |
| `chat:queued` | `{ position }` |
| `chat:partner-left` | `{ reason: 'skip' \| 'disconnect' }` |
| `chat:error` | `{ message }` |

**All event shapes live in `packages/types/src/events.ts`** — never duplicate them elsewhere.

### Match queue — `apps/api/src/match/`

Business logic for pairing users (priority rules, interest-vector scoring, etc.) is isolated here and called by `ChatGateway`. Keep transport concerns out of this layer.

### Redis key layout

| Key | Type | Value |
|---|---|---|
| `queue:global` | Sorted Set | `member=userId`, `score=joinTimestamp(ms)` — FIFO |
| `user:{socketId}` | String | `userId` |
| `user:reverse:{userId}` | String | `socketId` |
| `session:{id}` | String | `partnerId` |

### WebRTC client — `apps/web/src/hooks/`

| Hook | Purpose |
|---|---|
| `useSocket` | Stable Socket.IO connection to `/chat`; returns `null` until connected |
| `useWebRTC` | Creates `RTCPeerConnection`, handles offer/answer/ICE via `chat:signal`; returns `localStream`, `remoteStream`, `connectionState` |

## Conventions

- **No default exports** — named exports only across the entire codebase.
- **Zod for all API validation** — every REST/WS payload entering the API must be parsed with a Zod schema before use. Do not use `class-validator` or manual checks.
- **WebSocket events in one place** — add new events to `packages/types/src/events.ts` first, then implement. Never define event names as bare strings in gateway/hook code.
- **TypeScript strict** — do not relax `strict`, `noImplicitAny`, or `exactOptionalPropertyTypes` in any tsconfig.
- **Import order** — builtin → external → internal, blank line between groups (enforced by ESLint).
- **Prisma** — always run `npm run db:generate` after editing `schema.prisma`.
