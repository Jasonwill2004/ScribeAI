# ScribeAI 🎙️

**Real-time audio transcription & AI summarization platform**

ScribeAI is a production-ready web application that streams live audio, transcribes speech using Whisper AI (local, offline), and generates intelligent summaries with OpenAI GPT-4o-mini. Built with Next.js, Socket.io, and PostgreSQL for scalable real-time processing.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **PostgreSQL** database (local or cloud)
- **OpenAI API Key** (pay-as-you-go, no quota limits)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jasonwill2004/ScribeAI.git
cd ScribeAI

# Install dependencies (monorepo with Turborepo)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add:
#   DATABASE_URL="postgresql://user:password@localhost:5432/scribeai"
#   OPENAI_API_KEY="your-openai-api-key"

# Run database migrations
npx prisma migrate dev

# Start development servers (web + api-socket)
npm run dev
```

### First Recording

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **"New Session"** to start recording
3. Allow microphone access
4. Speak into your microphone
5. Click **"End Session"** to generate AI summary
6. View your session at **Sessions** page

---

## 🏗️ Architecture

ScribeAI uses a **chunked streaming architecture** for real-time transcription with minimal latency:

```mermaid
graph LR
    A[Client Browser] -->|MediaRecorder| B[Socket.io WebSocket]
    B -->|Audio Chunks| C[API Socket Server]
    C -->|WebM Opus| D[Whisper Base Model]
    D -->|Text Chunks| E[PostgreSQL DB]
    E -->|Aggregated Transcript| F[OpenAI GPT-4o-mini]
    F -->|Summary + Insights| E
    E -->|Session Data| G[Next.js App Router]
    G -->|SSR/API Routes| A
    
    style A fill:#e1f5ff
    style C fill:#fff4e1
    style D fill:#e8f5e9
    style F fill:#f3e5f5
    style E fill:#ffe0b2
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 App Router | React SSR, server components, API routes |
| **Real-time** | Socket.io | Bidirectional WebSocket for audio streaming |
| **Transcription** | Whisper Base (@xenova/transformers) | Local, offline speech-to-text (~150MB model) |
| **AI Summary** | OpenAI GPT-4o-mini | Natural language understanding, key insights |
| **Database** | PostgreSQL + Prisma ORM | Session persistence, relational data |
| **Monorepo** | Turborepo | Unified build system for apps/web + apps/api-socket |

---

## 📊 Technology Comparison

### Transcription Approaches

| Approach | Cost | Latency | Accuracy | Offline | ScribeAI Choice |
|----------|------|---------|----------|---------|-----------------|
| **Whisper Base (Local)** | FREE | ~200ms | Good (85-90%) | ✅ Yes | ✅ **Selected** |
| Whisper Large v3 | FREE | ~500ms | Excellent (95%+) | ✅ Yes | ❌ Too heavy (3GB) |
| OpenAI Whisper API | $0.006/min | ~100ms | Excellent | ❌ No | ❌ Recurring cost |
| Google Speech-to-Text | $0.016/min | ~50ms | Excellent | ❌ No | ❌ Expensive at scale |
| AWS Transcribe | $0.024/min | ~100ms | Excellent | ❌ No | ❌ Most expensive |

**Why Whisper Base?** Balance of speed, accuracy, and zero cost. Runs entirely client-side or server-side without external API dependencies.

### AI Summarization Approaches

| Approach | Cost | Quality | Streaming | ScribeAI Choice |
|----------|------|---------|-----------|-----------------|
| **OpenAI GPT-4o-mini** | $0.15/1M in + $0.60/1M out | Excellent | ✅ Yes | ✅ **Selected** |
| Google Gemini 1.5 Flash | FREE (15 RPM) | Excellent | ✅ Yes | ❌ Quota limits |
| OpenAI GPT-4o | $5/1M tokens | Excellent | ✅ Yes | ❌ More expensive |
| Claude 3.5 Sonnet | $3/1M tokens | Excellent | ✅ Yes | ❌ More expensive |
| Llama 3 (Local) | FREE | Good | ❌ No | ❌ Resource intensive |

**Why GPT-4o-mini?** Unlimited usage (pay-as-you-go), fast response times (~1-2s), excellent natural language understanding, JSON mode for structured output, no quota limits.

**Resilient Fallback Design**: ScribeAI implements graceful degradation when the OpenAI API is temporarily unavailable (network issues, etc.). In these cases:
- ✅ Session is **always saved** with full transcript chunks
- ✅ Fallback summary is generated showing transcript preview
- ✅ UI displays "AI Unavailable - Fallback Summary" badge
- ✅ Users can still download and review raw transcripts
- ✅ No data loss occurs - summaries can be regenerated later

This architecture ensures **100% reliability** for core transcription functionality, with AI summarization as an enhancement layer rather than a hard dependency.

---

## 📈 Scalability Design

ScribeAI is architected for **horizontal scalability** with session-based isolation:

**1. Chunked Streaming Pipeline**  
Audio is processed in **30-second chunks** (configurable) rather than waiting for the entire recording. This enables:
- **Memory efficiency**: Fixed ~150MB RAM per session (Whisper model)
- **Progressive UX**: Users see transcripts appear in real-time
- **Fault tolerance**: Failed chunks don't invalidate the entire session

**2. Stateless Session Management**  
Each recording session is isolated in PostgreSQL with a unique `sessionId`. The Socket.io server maintains no in-memory state beyond active connections, allowing:
- **Horizontal scaling**: Multiple API servers behind a load balancer
- **Session recovery**: Clients reconnect using `sessionId` to resume
- **Database-driven state**: All progress persisted (recording → paused → processing → completed)

**3. Async Summary Generation**  
OpenAI API calls happen **asynchronously** after session end, preventing blocking:
- **Non-blocking**: User can close the browser while summarization runs
- **Event-driven**: Socket.io emits `completed` event when summary finishes
- **Retry logic**: Failed summaries can be regenerated without re-transcribing

**Projected Capacity** (Single 4-core server):
- **Concurrent sessions**: ~20-30 (limited by Whisper CPU usage)
- **Database load**: <100 sessions/sec write throughput
- **Cost at 1000 users/day**: ~$3-5 (GPT-4o-mini: $0.15/1M input tokens, avg ~500 tokens/summary)

**Bottlenecks to Monitor**:
- Whisper CPU usage (solution: GPU acceleration or cloud Whisper API)
- OpenAI rate limits (solution: tier-based limits, typically 500 RPM on tier 1)
- PostgreSQL connections (solution: PgBouncer pooling)

---

## 🎬 Video Walkthrough

### Recording a Session
1. **Start**: Click "New Session" → allow mic access
2. **Record**: Speak naturally (app auto-chunks every 30s)
3. **Pause/Resume**: Control recording with toolbar buttons
4. **End**: Click "End Session" to trigger AI summary

### Viewing Results
- **Sessions Page**: Grid of all sessions with state badges
- **Session Detail**: Full transcript with timestamps + AI insights
- **Download**: Export transcript as formatted TXT file

### Demo Script
Use the included script to generate sample sessions:
```bash
./scripts/record-demo.sh
```

---

## 🛠️ Development

### Project Structure
```
ScribeAI/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── app/
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx         # Sessions list
│   │   │   │   └── [id]/page.tsx    # Session detail
│   │   │   └── api/
│   │   │       └── download/[sessionId]/route.ts
│   │   └── lib/
│   │       └── auth.ts              # Auth helpers (Better Auth TODO)
│   └── api-socket/       # Socket.io server
│       ├── src/
│       │   ├── socket.ts            # Socket event handlers
│       │   ├── summary/
│       │   │   └── processor.ts     # Summary aggregation logic
│       │   └── lib/
│       │       └── summary.ts       # OpenAI API integration
│       └── package.json
├── packages/
│   └── database/         # Prisma schema & migrations
│       └── prisma/
│           └── schema.prisma
├── turbo.json            # Turborepo config
└── README.md
```

### Key Files

**Frontend**
- `apps/web/app/sessions/page.tsx`: Server component fetching sessions with Prisma
- `apps/web/app/sessions/[id]/page.tsx`: Detail view with transcript + summary
- `apps/web/app/api/download/[sessionId]/route.ts`: TXT export endpoint

**Backend**
- `apps/api-socket/src/socket.ts`: Socket.io events (`start_session`, `audio_chunk`, `end_session`)
- `apps/api-socket/src/summary/processor.ts`: Core logic for aggregating transcript & generating summary
- `apps/api-socket/src/lib/summary.ts`: OpenAI API wrapper

**Database**
- `packages/database/prisma/schema.prisma`: Models: `User`, `Session`, `TranscriptChunk`, `Summary`

### Available Scripts

```bash
# Development
npm run dev              # Start all apps (web + api-socket)
npm run dev:web          # Start Next.js only
npm run dev:api          # Start Socket.io only

# Build
npm run build            # Build all apps
npm run build:web        # Build Next.js
npm run build:api        # Build Socket.io

# Database
npx prisma migrate dev   # Apply migrations
npx prisma studio        # Visual DB browser
npx prisma generate      # Regenerate Prisma Client

# Testing
npm run test             # Run tests (TODO: Add tests)
npm run test:summary     # Test OpenAI summarization
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/scribeai"

# AI Services
OPENAI_API_KEY="sk-..."  # Get from https://platform.openai.com/api-keys

# Better Auth (TODO)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

---

## 🚧 Roadmap

### ✅ Completed
- [x] PR #5: MediaRecorder → Socket.io audio streaming
- [x] PR #6: Whisper Base local transcription
- [x] PR #7: OpenAI GPT-4o-mini summarization
- [x] PR #8: Session list/detail pages + README

### 🔄 In Progress
- [ ] Better Auth integration (email/password + OAuth)
- [ ] Real-time transcript display during recording
- [ ] WebSocket heartbeat monitoring

### 📋 Planned
- [ ] Export to PDF/JSON formats
- [ ] Speaker diarization (multi-speaker support)
- [ ] Custom summary templates
- [ ] Mobile app (React Native)
- [ ] Self-hosted deployment guides (Docker)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Whisper AI**: OpenAI's state-of-the-art speech recognition
- **Xenova Transformers**: Lightweight Whisper.js implementation
- **Google Gemini**: Powerful language model for summarization
- **Next.js**: React framework for production-grade apps
- **Socket.io**: Reliable WebSocket library

---

**Built with ❤️ by Jason William**  
[GitHub](https://github.com/Jasonwill2004) • [Issues](https://github.com/Jasonwill2004/ScribeAI/issues) • [Pull Requests](https://github.com/Jasonwill2004/ScribeAI/pulls)

> AI-powered audio transcription and meeting summarization tool built with Next.js, Socket.io, and Google Gemini API.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socket.io)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-AttackCapital_Assignment-red)](LICENSE)

## 🚀 Features

- **Real-time Audio Transcription**: Capture and transcribe audio from microphone or shared meeting tabs (Google Meet/Zoom)
- **Live Streaming**: Stream audio chunks to Gemini API for incremental transcription
- **Session Management**: Record, pause, resume, and stop recording sessions
- **AI Summaries**: Generate meeting summaries with key points, action items, and decisions
- **Long-duration Support**: Architected for 1+ hour recording sessions with chunked streaming
- **Real-time Updates**: Socket.io integration for live status updates
- **Dark Mode**: Full dark mode support for extended sessions

## 📋 Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router, TypeScript)
- **Real-time Communication**: Socket.io
- **Database**: PostgreSQL via Prisma ORM
- **AI/ML**: Google Gemini API
- **Authentication**: Better Auth (planned)
- **Styling**: Tailwind CSS
- **Code Quality**: ESLint, Prettier

## 🏗️ Project Structure

```
ScribeAI/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/
│   │   │   ├── components/     # React components
│   │   │   ├── providers/      # Context providers
│   │   │   ├── layout.tsx      # Root layout with dark mode
│   │   │   ├── page.tsx        # Home page
│   │   │   └── globals.css     # Global styles
│   │   ├── next.config.js
│   │   ├── tailwind.config.cjs
│   │   └── package.json
│   └── api-socket/             # Node.js Socket.io server
│       ├── src/
│       │   ├── index.ts        # Express server setup
│       │   └── socket.ts       # Socket event handlers
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yml          # PostgreSQL container
├── .eslintrc.cjs              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .env.example                # Environment variables template
└── package.json                # Root workspace configuration
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)
- Google Gemini API key ([Get it here](https://ai.google.dev))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ScribeAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start PostgreSQL with Docker**
   ```bash
   docker-compose up -d
   ```
   
   Verify it's running:
   ```bash
   docker-compose ps
   ```

5. **Run the development servers**
   ```bash
   # Start both Next.js and Socket.io servers concurrently
   npm run dev
   
   # Or run them separately:
   npm run dev:app      # Next.js on http://localhost:3000
   npm run dev:socket   # Socket.io on http://localhost:4001
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Socket.io server: http://localhost:4001
   - Health check: http://localhost:4001/health

## 📦 Available Scripts

### Root Level
- `npm run dev` - Start both app and socket server concurrently
- `npm run dev:app` - Start Next.js development server only
- `npm run dev:socket` - Start Socket.io server only
- `npm run build` - Build all workspaces
- `npm run start` - Start production servers
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Web App (apps/web)
- `npm run dev --workspace=apps/web` - Start Next.js dev server
- `npm run build --workspace=apps/web` - Build Next.js app
- `npm run start --workspace=apps/web` - Start Next.js production server

### Socket Server (apps/api-socket)
- `npm run dev --workspace=apps/api-socket` - Start Socket.io dev server
- `npm run build --workspace=apps/api-socket` - Build TypeScript to JavaScript
- `npm run start --workspace=apps/api-socket` - Start production server

## 🔌 Socket.io Events

### Client → Server
- `session:start` - Initialize new recording session
- `audio:chunk` - Send audio data chunk
- `session:pause` - Pause current session
- `session:resume` - Resume paused session
- `session:stop` - Stop and process session

### Server → Client
- `session:status` - Session state updates (recording, paused, processing, completed)
- `audio:received` - Acknowledge audio chunk receipt
- `error` - Error notifications

## 🐳 Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f postgres

# Remove volumes (⚠️ deletes all data)
docker-compose down -v
```

## 🔧 Development Workflow

1. Make changes to code
2. Hot reload will update automatically
3. Check console for errors
4. Format code before committing:
   ```bash
   npm run format
   ```

## 📝 Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for TypeScript and React best practices
- **Prettier**: Consistent code formatting
- **JSDoc**: Inline documentation for functions and components

## 🚧 TODO / Roadmap

- [ ] Prisma ORM integration
- [ ] Better Auth authentication
- [ ] Gemini API transcription integration
- [ ] Session history dashboard
- [ ] Audio chunk streaming implementation
- [ ] Meeting summary generation
- [ ] Export transcripts (PDF, TXT, JSON)
- [ ] Multi-speaker diarization
- [ ] WebRTC implementation for tab sharing
- [ ] Unit and integration tests

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting
4. Submit a pull request

## 📄 License

This project is part of the AttackCapital assignment.

---

**Built with ❤️ for productivity professionals**