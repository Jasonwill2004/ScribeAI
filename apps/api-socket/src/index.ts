import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { setupSocketHandlers } from './socket'

dotenv.config()

const PORT = process.env.SOCKET_PORT || 4001
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Initialize Express application with Socket.io server
 * Handles real-time communication for audio streaming and transcription
 */
const app = express()

// Middleware
app.use(cors({
  origin: NEXT_PUBLIC_APP_URL,
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
  cors: {
    origin: NEXT_PUBLIC_APP_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Setup socket event handlers
setupSocketHandlers(io)

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

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`)
  console.log(`📡 CORS enabled for: ${NEXT_PUBLIC_APP_URL}`)
})
