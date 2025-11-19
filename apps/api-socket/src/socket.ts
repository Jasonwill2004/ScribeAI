import { Server, Socket } from 'socket.io'

/**
 * Socket.io event handlers for ScribeAI
 * Manages real-time connections for audio streaming and transcription
 */

interface SessionData {
  userId?: string
  sessionId?: string
  startTime?: number
}

/**
 * Setup all socket event handlers
 * @param io - Socket.io server instance
 */
export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    const sessionData: SessionData = {}

    /**
     * Handle session start event
     * Initializes a new recording session
     */
    socket.on('session:start', (data: { userId: string; sessionId: string }) => {
      sessionData.userId = data.userId
      sessionData.sessionId = data.sessionId
      sessionData.startTime = Date.now()

      console.log(`🎙️  Session started: ${data.sessionId} for user: ${data.userId}`)
      
      socket.emit('session:status', {
        status: 'recording',
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      })
    })

    /**
     * Handle audio chunk received from client
     * Process and forward to transcription service
     */
    socket.on('audio:chunk', (data: { sessionId: string; chunk: ArrayBuffer }) => {
      console.log(`🎵 Audio chunk received for session: ${data.sessionId}`)
      
      // TODO: Forward to Gemini API for transcription
      // For now, acknowledge receipt
      socket.emit('audio:received', {
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      })
    })

    /**
     * Handle session pause event
     */
    socket.on('session:pause', (data: { sessionId: string }) => {
      console.log(`⏸️  Session paused: ${data.sessionId}`)
      
      socket.emit('session:status', {
        status: 'paused',
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      })
    })

    /**
     * Handle session resume event
     */
    socket.on('session:resume', (data: { sessionId: string }) => {
      console.log(`▶️  Session resumed: ${data.sessionId}`)
      
      socket.emit('session:status', {
        status: 'recording',
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      })
    })

    /**
     * Handle session stop event
     * Triggers final processing and summary generation
     */
    socket.on('session:stop', async (data: { sessionId: string }) => {
      console.log(`⏹️  Session stopped: ${data.sessionId}`)
      
      socket.emit('session:status', {
        status: 'processing',
        sessionId: data.sessionId,
        timestamp: new Date().toISOString()
      })

      // TODO: Trigger Gemini summary generation
      // Simulate processing delay
      setTimeout(() => {
        socket.emit('session:status', {
          status: 'completed',
          sessionId: data.sessionId,
          timestamp: new Date().toISOString()
        })
      }, 2000)
    })

    /**
     * Handle client disconnection
     */
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
      
      if (sessionData.sessionId) {
        console.log(`📝 Session ${sessionData.sessionId} disconnected after ${
          sessionData.startTime ? Math.floor((Date.now() - sessionData.startTime) / 1000) : 0
        }s`)
      }
    })

    /**
     * Handle errors
     */
    socket.on('error', (error: Error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error)
      
      socket.emit('error', {
        message: 'An error occurred',
        timestamp: new Date().toISOString()
      })
    })
  })

  console.log('✅ Socket handlers registered')
}
