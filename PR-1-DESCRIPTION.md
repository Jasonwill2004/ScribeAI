# PR #1 — Project Bootstrap (Monorepo-like App + Server)

## Title
chore: init nextjs app + node socket server + tooling

## Description
Initialize ScribeAI project with a monorepo-style structure containing:
- Next.js 14 TypeScript app with App Router and Tailwind CSS
- Node.js Express + Socket.io server for real-time communication
- PostgreSQL via Docker Compose for database
- Development tooling (ESLint, Prettier)
- Comprehensive documentation and setup scripts

## Changes Made

### Project Structure
```
ScribeAI/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api-socket/             # Socket.io server
├── docker-compose.yml          # PostgreSQL setup
├── .eslintrc.cjs
├── .prettierrc
├── .env.example
├── setup.sh                    # Automated setup script
└── package.json                # Root workspace config
```

### Key Features Implemented

#### 1. Next.js Application (`apps/web/`)
- ✅ Next.js 14 with TypeScript and App Router
- ✅ Tailwind CSS with dark mode support
- ✅ Custom layout with Header component
- ✅ Theme provider using `next-themes`
- ✅ Responsive design with dark mode toggle
- ✅ Type-safe configuration

**Files Created:**
- `app/layout.tsx` - Root layout with dark mode
- `app/page.tsx` - Landing page
- `app/components/Header.tsx` - Header with theme toggle
- `app/providers/theme-provider.tsx` - Theme context provider
- `app/globals.css` - Global styles with Tailwind
- `next.config.js`, `tsconfig.json`, `package.json`
- `tailwind.config.cjs`, `postcss.config.cjs`

#### 2. Socket.io Server (`apps/api-socket/`)
- ✅ Express-based HTTP server
- ✅ Socket.io integration with CORS
- ✅ Real-time event handlers for:
  - Session management (start, pause, resume, stop)
  - Audio chunk streaming
  - Status broadcasting
- ✅ Graceful shutdown handling
- ✅ Health check endpoint
- ✅ TypeScript with type definitions

**Files Created:**
- `src/index.ts` - Express server with Socket.io
- `src/socket.ts` - Socket event handlers
- `tsconfig.json`, `package.json`

#### 3. Development Tooling
- ✅ ESLint configuration for TypeScript
- ✅ Prettier for code formatting
- ✅ Workspace scripts for concurrent development
- ✅ Git ignore patterns

**Files Created:**
- `.eslintrc.cjs` - ESLint rules
- `.prettierrc` - Code formatting rules
- `.prettierignore` - Ignore patterns

#### 4. Infrastructure
- ✅ Docker Compose for PostgreSQL 16
- ✅ Environment variables template
- ✅ Health checks for database
- ✅ Volume persistence

**Files Created:**
- `docker-compose.yml` - PostgreSQL container
- `.env.example` - Environment template
- `.gitignore` - Git ignore patterns

#### 5. Documentation
- ✅ Comprehensive README with:
  - Setup instructions
  - Available scripts
  - Socket.io event documentation
  - Project structure overview
  - Development workflow
- ✅ Automated setup script (`setup.sh`)

## Socket.io Events Implemented

### Client → Server
- `session:start` - Initialize recording session
- `audio:chunk` - Stream audio data
- `session:pause` - Pause recording
- `session:resume` - Resume recording
- `session:stop` - Stop and process

### Server → Client
- `session:status` - State updates (recording, paused, processing, completed)
- `audio:received` - Chunk acknowledgment
- `error` - Error notifications

## Scripts Available

### Root Level
```bash
npm run dev          # Start both servers
npm run dev:app      # Next.js only
npm run dev:socket   # Socket.io only
npm run build        # Build all workspaces
npm run start        # Start production
npm run lint         # Lint all
npm run format       # Format code
```

## Testing Checklist

- [x] `npm install` completes successfully
- [x] `npm run dev:app` starts Next.js on port 3000
- [x] `npm run dev:socket` starts Socket.io on port 4001
- [x] Docker Compose brings up PostgreSQL container
- [x] Visit http://localhost:3000 shows ScribeAI header
- [x] Dark mode toggle works correctly
- [x] Socket.io health check responds at http://localhost:4001/health
- [x] All TypeScript files compile without errors
- [x] ESLint and Prettier configurations work

## Setup Instructions for Reviewers

1. **Clone and install:**
   ```bash
   git checkout <this-branch>
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for local dev)
   ```

3. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

4. **Run development servers:**
   ```bash
   npm run dev
   ```

5. **Verify:**
   - Visit http://localhost:3000 (Next.js app)
   - Visit http://localhost:4001/health (Socket.io health check)
   - Toggle dark mode in the header
   - Check console logs show both servers running

## Automated Setup (Alternative)
```bash
./setup.sh
npm run dev
```

## Dependencies Added

### Root
- `concurrently` - Run multiple npm scripts
- `prettier` - Code formatting
- `typescript` - TypeScript support

### apps/web
- `next` 14.2.0 - React framework
- `react`, `react-dom` - React library
- `next-themes` - Dark mode support
- `socket.io-client` - WebSocket client
- `tailwindcss` - Utility-first CSS
- `autoprefixer`, `postcss` - CSS processing

### apps/api-socket
- `express` - HTTP server
- `socket.io` - Real-time engine
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `tsx` - TypeScript execution

## Notes

- TypeScript errors in files are expected until dependencies are installed
- PostgreSQL credentials are in `.env.example` (safe for development)
- Production secrets should be properly secured
- Socket.io events have TODO comments for Gemini API integration

## Next Steps (Future PRs)

- PR #2: Prisma ORM setup and database schema
- PR #3: Better Auth authentication
- PR #4: Audio capture and streaming
- PR #5: Gemini API integration
- PR #6: Session management UI

## Commit Message
```
chore: init repo - next app, socket server, tooling, docker-compose

- Add Next.js 14 app with TypeScript, Tailwind, and dark mode
- Add Node.js Socket.io server with event handlers
- Configure ESLint, Prettier, and workspace scripts
- Add Docker Compose for PostgreSQL 16
- Create comprehensive documentation and setup script
- Set up monorepo structure with npm workspaces
```

---

**Ready for review!** 🚀
