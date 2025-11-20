import { z } from 'zod'

/**
 * Zod validation schemas for Socket.io event payloads
 */

export const StartSessionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1).max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

export const AudioChunkSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  chunkIndex: z.number().int().min(0),
  audioData: z.string(), // Base64 encoded audio
  duration: z.number().optional(),
  speaker: z.string().optional()
})

export const EndSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
})

export const PauseSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
})

export const ResumeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
})

export const HeartbeatSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  timestamp: z.number()
})

// Type exports
export type StartSessionPayload = z.infer<typeof StartSessionSchema>
export type AudioChunkPayload = z.infer<typeof AudioChunkSchema>
export type EndSessionPayload = z.infer<typeof EndSessionSchema>
export type PauseSessionPayload = z.infer<typeof PauseSessionSchema>
export type ResumeSessionPayload = z.infer<typeof ResumeSessionSchema>
export type HeartbeatPayload = z.infer<typeof HeartbeatSchema>
