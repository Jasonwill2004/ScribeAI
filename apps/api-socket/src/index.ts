import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { setupSocketHandlers } from './socket'

// ⚠️ IMPORTANT: Load root-level .env (2 directories above)
dotenv.config({ path: '../../.env' })

const PORT = process.env.SOCKET_PORT || 4001
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Initialize Express application with Socket.io server
 * Handles real-time communication for audio streaming and transcription
 */
const app = express()

// Log all HTTP requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} from ${req.ip}`)
  next()
})

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? NEXT_PUBLIC_APP_URL : '*',
  credentials: true
}))

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? NEXT_PUBLIC_APP_URL : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Allow Engine.IO v3 clients
  serveClient: false // Don't serve the Socket.IO client library
})

// Add engine-level debug logging
io.engine.on('connection', (conn) => {
  console.log(`🔌 Engine: new connection (id=${conn.id}, remote=${conn.request.socket.remoteAddress})`)
})

io.engine.on('error', (err) => {
  console.error('💥 Engine connection error:', err)
})

// Setup socket event handlers with error handling
try {
  setupSocketHandlers(io)
  console.log('✅ Socket handlers registered')
} catch (err) {
  console.error('❌ Error loading socket handlers:', (err as Error).stack || err)
  process.exit(1)
}

// Graceful shutdown handler
const shutdown = () => {
  console.log('\n⏳ Gracefully shutting down socket server...')
  
  io.close(() => {
    console.log('✅ All socket connections closed')
    httpServer.close(() => {
      console.log('✅ HTTP server closed')
      process.exit(0)
    })
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Start server - bind to IPv4 (127.0.0.1) for local development
httpServer.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`)
  console.log(`📡 CORS enabled for: ${NEXT_PUBLIC_APP_URL}`)
  console.log('🗄️  DATABASE_URL:', process.env.DATABASE_URL || '❌ Missing!')
  console.log('📁 Env loaded from ../../.env')
})
