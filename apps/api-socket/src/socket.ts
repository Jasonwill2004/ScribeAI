import { Server, Socket } from 'socket.io'
import { ZodError } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from './db'
import { saveAudioChunk } from './fileStorage'
import { processTranscription } from './transcription/worker'
import { generateSessionSummary, emitCompletedEvent } from './summary/processor'
import { concatenateWebMChunks, getSessionChunksSorted } from './lib/audioAggregator'
import {
  StartSessionSchema,
  AudioChunkSchema,
  EndSessionSchema,
  PauseSessionSchema,
  ResumeSessionSchema,
  HeartbeatSchema,
  type StartSessionPayload,
  type AudioChunkPayload,
  type EndSessionPayload,
  type PauseSessionPayload,
  type ResumeSessionPayload,
  type HeartbeatPayload
} from './schemas'

/**
 * Wait for file to be fully written by checking if size stabilizes
 */
async function waitForFileReady(filePath: string, timeoutMs: number = 5000): Promise<void> {
  const startTime = Date.now()
  let lastSize = 0
  let stableCount = 0

  while (Date.now() - startTime < timeoutMs) {
    try {
      const stats = await fs.stat(filePath)
      const currentSize = stats.size

      if (currentSize === lastSize && currentSize > 0) {
        stableCount++
        // File size stable for 3 consecutive checks = file ready (increased from 2)
        if (stableCount >= 3) {
          console.log(`✅ File ready: ${filePath} (${currentSize} bytes)`)
          return
        }
      } else {
        stableCount = 0
      }

      lastSize = currentSize
      await new Promise(resolve => setTimeout(resolve, 800)) // Check every 800ms (increased from 500ms)
    } catch (error) {
      // File doesn't exist yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  throw new Error(`File not ready after ${timeoutMs}ms: ${filePath}`)
}

/**
 * Aggregate all chunks for a session and transcribe once
 * This solves the EBML header corruption issue in chunks 1+
 */
async function aggregateAndTranscribeSession(
  io: Server,
  socketId: string,
  sessionId: string
): Promise<void> {
  try {
    console.log(`🔄 Starting chunk aggregation for session: ${sessionId}`)

    // Get session directory
    const TMP_DIR = path.join(process.cwd(), 'tmp')
    const sessionDir = path.join(TMP_DIR, sessionId)

    // Get all chunks sorted by index
    const chunkPaths = await getSessionChunksSorted(sessionDir)
    
    if (chunkPaths.length === 0) {
      throw new Error('No chunks found for session')
    }

    console.log(`📦 Found ${chunkPaths.length} chunks to aggregate`)

    // Create combined file path
    const combinedFilePath = path.join(sessionDir, 'combined.webm')

    // Concatenate all chunks into one valid WebM file
    await concatenateWebMChunks(chunkPaths, combinedFilePath)

    // Wait for combined file to be ready
    await waitForFileReady(combinedFilePath, 10000)

    // Get the first chunk from database for metadata
    const firstChunk = await prisma.transcriptChunk.findFirst({
      where: { sessionId },
      orderBy: { chunkIndex: 'asc' }
    })

    if (!firstChunk) {
      throw new Error('No chunk metadata found in database')
    }

    // Transcribe the combined file
    console.log(`🎤 Transcribing combined audio file...`)
    await processTranscription(io, {
      sessionId,
      chunkIndex: 0, // Use index 0 for the combined transcript
      chunkId: firstChunk.id,
      filePath: combinedFilePath,
      socketId
    })

    console.log(`✅ Aggregation and transcription complete for session ${sessionId}`)
  } catch (error) {
    console.error(`❌ Aggregation failed for session ${sessionId}:`, error)
    throw error
  }
}

/**
 * Socket.io event handlers for ScribeAI
 * Manages real-time connections for audio streaming and transcription
 */

interface SocketSessionData {
  sessionId?: string
  userId?: string
  lastHeartbeat?: number
}

/**
 * Setup all socket event handlers
 * @param io - Socket.io server instance
 */
export function setupSocketHandlers(io: Server) {
  // Heartbeat monitor - disconnect clients with no heartbeat for 90s
  const heartbeatInterval = setInterval(() => {
    const now = Date.now()
    io.sockets.sockets.forEach((socket) => {
      const data = socket.data as SocketSessionData
      if (data.lastHeartbeat && now - data.lastHeartbeat > 90000) {
        console.log(`💀 Client ${socket.id} timed out - no heartbeat (90s)`)
        socket.disconnect(true)
      }
    })
  }, 15000) // Check every 15 seconds

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)
    console.log(`   Transport: ${socket.conn.transport.name}`)
    console.log(`   Address: ${socket.handshake.address}`)

    // Initialize socket session data
    socket.data = { lastHeartbeat: Date.now() } as SocketSessionData

    /**
     * Handle heartbeat event
     * Keeps connection alive and monitors client health
     */
    socket.on('heartbeat', async (payload: unknown, ack?: (response: any) => void) => {
      try {
        const data = HeartbeatSchema.parse(payload)
        socket.data.lastHeartbeat = Date.now()

        if (ack) {
          ack({ success: true, serverTime: Date.now() })
        }
      } catch (error) {
        console.error('Heartbeat validation error:', error)
      }
    })

    /**
     * Handle start_session event
     * Creates a new session in the database
     */
    socket.on('start_session', async (payload: unknown, ack?: (response: any) => void) => {
      try {
        const data = StartSessionSchema.parse(payload)

        // Create session in database
        const session = await prisma.session.create({
          data: {
            userId: data.userId,
            title: data.title || `Session ${new Date().toLocaleString()}`,
            state: 'recording',
            startedAt: new Date()
          }
        })

        // Store session data on socket
        socket.data.sessionId = session.id
        socket.data.userId = data.userId

        console.log(`🎙️  Session started: ${session.id} for user: ${data.userId}`)

        // Acknowledge with session ID
        if (ack) {
          ack({
            success: true,
            sessionId: session.id,
            timestamp: session.startedAt.toISOString()
          })
        }

        // Emit status to client
        socket.emit('session:status', {
          status: 'recording',
          sessionId: session.id,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('start_session error:', error)
        
        const errorMessage = error instanceof ZodError 
          ? `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
          : 'Failed to start session'

        if (ack) {
          ack({ success: false, error: errorMessage })
        }
        
        socket.emit('error', { message: errorMessage, timestamp: new Date().toISOString() })
      }
    })

    /**
     * Handle audio_chunk event
     * Saves audio chunk to disk and creates metadata in database
     */
    socket.on('audio_chunk', async (payload: unknown, ack?: (response: any) => void) => {
      try {
        const data = AudioChunkSchema.parse(payload)

        // Verify session exists
        const session = await prisma.session.findUnique({
          where: { id: data.sessionId }
        })

        if (!session) {
          throw new Error('Session not found')
        }

        if (session.state !== 'recording') {
          throw new Error(`Session is not recording (current state: ${session.state})`)
        }

        // Save audio chunk to disk
        const filePath = await saveAudioChunk(
          data.sessionId,
          data.chunkIndex,
          data.audioData
        )

        // Create TranscriptChunk metadata in database
        const chunk = await prisma.transcriptChunk.create({
          data: {
            sessionId: data.sessionId,
            chunkIndex: data.chunkIndex,
            speaker: data.speaker || 'Unknown',
            text: '', // Will be filled by Gemini processing
            timestamp: new Date()
          }
        })

        console.log(`🎵 Audio chunk ${data.chunkIndex} saved for session: ${data.sessionId}`)

        // Acknowledge receipt
        if (ack) {
          ack({
            success: true,
            chunkId: chunk.id,
            chunkIndex: data.chunkIndex,
            sessionId: data.sessionId
          })
        }

        // Emit confirmation
        socket.emit('audio:received', {
          sessionId: data.sessionId,
          chunkIndex: data.chunkIndex,
          timestamp: new Date().toISOString()
        })

        // Don't transcribe individual chunks - wait for session end
        // This prevents EBML header corruption issues in chunks 1+
        console.log(`✅ Chunk ${data.chunkIndex} saved, waiting for session end to aggregate and transcribe`)
      } catch (error) {
        console.error('audio_chunk error:', error)
        
        const errorMessage = error instanceof ZodError
          ? `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
          : error instanceof Error
          ? error.message
          : 'Failed to process audio chunk'

        if (ack) {
          ack({ success: false, error: errorMessage })
        }
        
        socket.emit('error', { message: errorMessage, timestamp: new Date().toISOString() })
      }
    })

    /**
     * Handle pause event
     * Updates session state to PAUSED
     */
    socket.on('pause', async (payload: unknown, ack?: (response: any) => void) => {
      try {
        const data = PauseSessionSchema.parse(payload)

        const session = await prisma.session.update({
          where: { id: data.sessionId },
          data: { state: 'paused' }
        })

        console.log(`⏸️  Session paused: ${data.sessionId}`)

        if (ack) {
          ack({ success: true, sessionId: session.id })
        }

        socket.emit('session:status', {
          status: 'paused',
          sessionId: data.sessionId,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('pause error:', error)
        
        const errorMessage = error instanceof ZodError
          ? `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
          : 'Failed to pause session'

        if (ack) {
          ack({ success: false, error: errorMessage })
        }
        
        socket.emit('error', { message: errorMessage, timestamp: new Date().toISOString() })
      }
    })

    /**
     * Handle resume event
     * Updates session state back to RECORDING
     */
    socket.on('resume', async (payload: unknown, ack?: (response: any) => void) => {
      try {
        const data = ResumeSessionSchema.parse(payload)

        const session = await prisma.session.update({
          where: { id: data.sessionId },
          data: { state: 'recording' }
        })

        console.log(`▶️  Session resumed: ${data.sessionId}`)

        if (ack) {
          ack({ success: true, sessionId: session.id })
        }

        socket.emit('session:status', {
          status: 'recording',
          sessionId: data.sessionId,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('resume error:', error)
        
        const errorMessage = error instanceof ZodError
          ? `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
          : 'Failed to resume session'

        if (ack) {
          ack({ success: false, error: errorMessage })
        }
        
        socket.emit('error', { message: errorMessage, timestamp: new Date().toISOString() })
      }
    })

    /**
     * Handle end_session event
     * Finalizes session and triggers processing
     */
    socket.on('end_session', async (payload: unknown, ack?: (response: any) => void) => {
      try {
        const data = EndSessionSchema.parse(payload)

        const session = await prisma.session.update({
          where: { id: data.sessionId },
          data: {
            state: 'processing',
            endedAt: new Date()
          }
        })

        console.log(`⏹️  Session ended: ${data.sessionId}`)

        if (ack) {
          ack({ success: true, sessionId: session.id })
        }

        socket.emit('session:status', {
          status: 'processing',
          sessionId: data.sessionId,
          timestamp: new Date().toISOString()
        })

        // Aggregate all chunks and transcribe once
        // This solves the EBML header corruption issue
        aggregateAndTranscribeSession(io, socket.id, data.sessionId)
          .then(() => {
            console.log(`✅ Aggregation and transcription complete for session ${data.sessionId}`)
            // Now generate AI summary
            return generateSessionSummary(data.sessionId)
          })
          .then(async (summaryData) => {
            // Emit completed event with summary data and download URL
            await emitCompletedEvent(io, socket.id, summaryData)
            
            // Also emit session:status for backward compatibility
            socket.emit('session:status', {
              status: 'completed',
              sessionId: data.sessionId,
              timestamp: new Date().toISOString()
            })
          })
          .catch((error) => {
            console.error(`[end_session] Critical failure in summary pipeline for session ${data.sessionId}:`, error)
            
            // Emit error - session should still be saved with fallback summary
            socket.emit('error', {
              message: 'Summary generation encountered errors. Session saved with transcript only.',
              timestamp: new Date().toISOString()
            })
            
            // Still mark as completed - the processor should have handled it
            socket.emit('session:status', {
              status: 'completed',
              sessionId: data.sessionId,
              timestamp: new Date().toISOString()
            })
          })
      } catch (error) {
        console.error('end_session error:', error)
        
        const errorMessage = error instanceof ZodError
          ? `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
          : 'Failed to end session'

        if (ack) {
          ack({ success: false, error: errorMessage })
        }
        
        socket.emit('error', { message: errorMessage, timestamp: new Date().toISOString() })
      }
    })

    /**
     * Handle client disconnection
     * NOTE: Don't auto-pause sessions - let client explicitly pause/resume
     * This prevents issues with brief disconnects during transport upgrades
     */
    socket.on('disconnect', async () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
      
      // Removed auto-pause logic - sessions remain in their current state
      // Client should explicitly call pause/end_session before closing
    })

    /**
     * Handle socket errors
     */
    socket.on('error', (error: Error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error)
      
      socket.emit('error', {
        message: 'An error occurred',
        timestamp: new Date().toISOString()
      })
    })
  })

  // Cleanup on server shutdown
  io.on('close', () => {
    clearInterval(heartbeatInterval)
  })

  console.log('✅ Socket handlers registered')
}
