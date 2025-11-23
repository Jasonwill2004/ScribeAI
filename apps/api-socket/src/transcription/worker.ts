/**
 * Transcription Worker
 * 
 * Processes audio chunks asynchronously:
 * 1. Reads audio file from disk
 * 2. Sends to Whisper (local) for transcription
 * 3. Emits transcript event via Socket.io
 * 4. Persists transcript to database
 * 
 * This worker is called after each audio chunk is saved to disk.
 * Uses local Whisper model (FREE) - no API key required.
 */

import { Server } from 'socket.io'
import { transcribeAudioChunk, TranscriptionResult } from '../lib/whisper'
import { prisma } from '../db'
import { createId } from '@paralleldrive/cuid2'

export interface TranscriptionJobPayload {
  sessionId: string
  chunkIndex: number
  chunkId: string
  filePath: string
  socketId?: string // Optional: to emit transcript directly to specific client
}

export interface TranscriptionJobResult {
  success: boolean
  transcriptChunkId?: string
  text?: string
  error?: string
}

/**
 * Process a transcription job for a single audio chunk
 * 
 * @param io - Socket.io server instance for emitting events
 * @param job - Transcription job payload
 * @returns Result of transcription processing
 */
export async function processTranscription(
  io: Server,
  job: TranscriptionJobPayload
): Promise<TranscriptionJobResult> {
  const { sessionId, chunkIndex, chunkId, filePath, socketId } = job

  console.log(`📝 Starting transcription job for session ${sessionId}, chunk ${chunkIndex}`)

  try {
    // Step 1: Transcribe audio using Whisper (local, free)
    const transcription: TranscriptionResult = await transcribeAudioChunk(filePath, {
      language: 'english',
      task: 'transcribe',
      model: 'base', // Better accuracy than tiny (~150MB model)
    })

    console.log(`✅ Transcription completed: "${transcription.text.substring(0, 100)}..."`)

    // Step 2: Save transcript to database
    const transcriptChunk = await prisma.transcriptChunk.update({
      where: { id: chunkId },
      data: {
        text: transcription.text,
        speaker: transcription.speaker,
      },
    })

    console.log(`💾 Transcript chunk saved to DB: ${transcriptChunk.id}`)

    // Step 3: Emit transcript event to client(s)
    const transcriptEvent = {
      sessionId,
      chunkIndex,
      text: transcription.text,
      speaker: transcription.speaker,
      timestamp: new Date().toISOString(),
    }

    if (socketId) {
      // Emit to specific socket if provided
      io.to(socketId).emit('transcript', transcriptEvent)
      console.log(`📡 Transcript emitted to socket: ${socketId}`)
    } else {
      // Broadcast to all clients in session room (if rooms are implemented)
      io.emit('transcript', transcriptEvent)
      console.log(`📡 Transcript broadcast to all clients`)
    }

    return {
      success: true,
      transcriptChunkId: transcriptChunk.id,
      text: transcription.text,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Transcription job failed for chunk ${chunkIndex}:`, error)

    // Emit error event to client
    const errorEvent = {
      sessionId,
      chunkIndex,
      error: 'Transcription failed',
      message: errorMessage,
    }

    if (socketId) {
      io.to(socketId).emit('transcription_error', errorEvent)
    } else {
      io.emit('transcription_error', errorEvent)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Queue a transcription job (for future queue-based processing)
 * 
 * This is a placeholder for when you implement a proper job queue
 * (e.g., BullMQ, Bull, or AWS SQS) for handling transcription at scale.
 * 
 * @param job - Transcription job payload
 */
export async function queueTranscription(job: TranscriptionJobPayload): Promise<void> {
  console.log(`📥 Queuing transcription job (not implemented yet):`, job)
  
  // TODO: Implement queue integration
  // Example with BullMQ:
  // await transcriptionQueue.add('transcribe', job, {
  //   attempts: 3,
  //   backoff: { type: 'exponential', delay: 2000 }
  // })
  
  throw new Error('Queue-based transcription not yet implemented. Use processTranscription() directly.')
}

/**
 * Batch process multiple transcription jobs
 * 
 * @param io - Socket.io server instance
 * @param jobs - Array of transcription jobs
 * @returns Array of results
 */
export async function batchProcessTranscriptions(
  io: Server,
  jobs: TranscriptionJobPayload[]
): Promise<TranscriptionJobResult[]> {
  console.log(`📦 Batch processing ${jobs.length} transcription jobs`)

  const results = await Promise.allSettled(
    jobs.map(job => processTranscription(io, job))
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.error(`❌ Batch job ${index} failed:`, result.reason)
      return {
        success: false,
        error: result.reason?.message || 'Unknown error',
      }
    }
  })
}
