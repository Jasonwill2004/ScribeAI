# Quick Start Guide - PR #1

## ⚡ Fast Setup (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Start PostgreSQL
docker-compose up -d

# 4. Run development servers
npm run dev
```

Visit: http://localhost:3000

## 🧪 Testing the Setup

### 1. Verify Next.js App
- Open http://localhost:3000
- You should see "Welcome to ScribeAI"
- Click the theme toggle (sun/moon icon) - should switch between light/dark mode

### 2. Verify Socket.io Server
- Open http://localhost:4001/health
- Should return: `{"status":"ok","timestamp":"..."}`

### 3. Verify PostgreSQL
```bash
docker-compose ps
# Should show scribeai-postgres running
```

### 4. Check Console Logs
You should see:
```
🚀 Socket.io server running on port 4001
📡 CORS enabled for: http://localhost:3000
✅ Socket handlers registered
```

## 📋 PR #1 Checklist

- [x] Root workspace configuration
- [x] Next.js 14 app with TypeScript
- [x] Tailwind CSS with dark mode
- [x] Socket.io server with Express
- [x] PostgreSQL via Docker Compose
- [x] ESLint and Prettier
- [x] Environment variables template
- [x] Comprehensive documentation
- [x] Setup and verification scripts

## 🏗️ What's Included

### Frontend (apps/web)
- ✅ Next.js 14 App Router
- ✅ TypeScript strict mode
- ✅ Tailwind CSS
- ✅ Dark mode support
- ✅ Responsive layout
- ✅ Header with theme toggle

### Backend (apps/api-socket)
- ✅ Express HTTP server
- ✅ Socket.io WebSocket server
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Event handlers for:
  - Session start/stop/pause/resume
  - Audio chunk streaming
  - Status broadcasting

### Infrastructure
- ✅ PostgreSQL 16 (Docker)
- ✅ Environment variables
- ✅ Git ignore patterns

### Tooling
- ✅ ESLint with TypeScript rules
- ✅ Prettier formatting
- ✅ Concurrent dev servers
- ✅ Setup automation

### Documentation
- ✅ README with full setup guide
- ✅ Architecture documentation
- ✅ PR description
- ✅ This quick start guide

## 🎯 What to Test

### Manual Testing
1. **Dark Mode**: Toggle theme and verify styles change
2. **Responsive Design**: Resize browser window
3. **Socket Server**: Check health endpoint
4. **Hot Reload**: Make a change to `app/page.tsx` and verify it updates

### Automated Verification
```bash
./verify-setup.sh
```

## 🐛 Common Issues

### Issue: Port 3000 already in use
**Solution**: 
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Docker not starting
**Solution**: 
- Ensure Docker Desktop is running
- Try: `docker-compose down && docker-compose up -d`

### Issue: TypeScript errors in editor
**Solution**: 
```bash
npm install  # Install all dependencies
```
Then restart your editor.

### Issue: npm install fails
**Solution**: 
```bash
# Clear npm cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📊 Project Stats

- **Total Files Created**: 30+
- **Lines of Code**: ~1,500
- **Dependencies**: 25+
- **Configuration Files**: 8
- **Documentation Files**: 4

## 🔄 Development Workflow

```bash
# Make changes to code
# ↓
# Hot reload automatically updates
# ↓
# Test in browser
# ↓
# Format code
npm run format
# ↓
# Commit changes
git add .
git commit -m "your message"
```

## 📝 File Tree

```
ScribeAI/
├── apps/
│   ├── web/                    # Next.js app
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── Header.tsx
│   │   │   ├── providers/
│   │   │   │   └── theme-provider.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── postcss.config.cjs
│   │   ├── tailwind.config.cjs
│   │   └── tsconfig.json
│   └── api-socket/             # Socket.io server
│       ├── src/
│       │   ├── index.ts
│       │   └── socket.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── ARCHITECTURE.md         # System design
│   └── QUICK_START.md          # This file
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── .prettierignore
├── docker-compose.yml
├── package.json
├── PR-1-DESCRIPTION.md
├── README.md
├── setup.sh
└── verify-setup.sh
```

## 🚀 Next Steps

After PR #1 is merged:
- **PR #2**: Prisma ORM + database schema
- **PR #3**: Better Auth integration
- **PR #4**: Audio capture UI
- **PR #5**: Gemini API integration
- **PR #6**: Session management

## 📞 Need Help?

- Check the [README.md](../README.md) for detailed docs
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Run `./verify-setup.sh` to check your setup

---

**Happy coding! 🎉**
