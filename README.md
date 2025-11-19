# ScribeAI

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