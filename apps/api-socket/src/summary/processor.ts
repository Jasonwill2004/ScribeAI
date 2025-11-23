/**
 * Summary Processor
 * Aggregates transcript chunks and generates AI summaries using Gemini
 */

import { Server } from 'socket.io'
import { prisma } from '../db'
import { generateSummary } from '../lib/summary'

interface AggregatedTranscript {
  fullText: string
  chunkCount: number
  sessionId: string
}

interface SummaryData {
  sessionId: string
  summaryId: string
  content: string
  keyPoints: string[]
  actionItems: string[]
  topics: string[]
}

/**
 * Aggregates all transcript chunks for a session into a single text
 * Chunks are ordered by chunkIndex to maintain chronological flow
 */
export async function aggregateTranscript(sessionId: string): Promise<AggregatedTranscript> {
  try {
    // Fetch all chunks for the session, ordered by chunkIndex
    const chunks = await prisma.transcriptChunk.findMany({
      where: { sessionId },
      orderBy: { chunkIndex: 'asc' },
      select: { text: true, chunkIndex: true }
    })

    if (chunks.length === 0) {
      throw new Error(`No transcript chunks found for session ${sessionId}`)
    }

    // Concatenate all chunk texts with newlines for readability
    const fullText = chunks.map(chunk => chunk.text).join('\n')

    return {
      fullText,
      chunkCount: chunks.length,
      sessionId
    }
  } catch (error) {
    console.error(`[Summary Processor] Error aggregating transcript for session ${sessionId}:`, error)
    throw error
  }
}

/**
 * Generates an AI summary for a session by:
 * 1. Aggregating all transcript chunks
 * 2. Calling Gemini to generate summary, key points, action items, topics
 * 3. Saving the summary to the database
 * 4. Updating the session state to 'completed'
 * 
 * Returns the complete summary data including ID
 */
export async function generateSessionSummary(sessionId: string): Promise<SummaryData> {
  let summaryResult: { summary: string; keyPoints: string[]; actionItems: string[]; topics: string[] }
  let summaryGenerationSucceeded = false

  try {
    console.log(`[Summary Processor] Starting summary generation for session ${sessionId}`)

    // Step 1: Aggregate transcript chunks
    const aggregated = await aggregateTranscript(sessionId)
    console.log(`[Summary Processor] Aggregated ${aggregated.chunkCount} chunks (${aggregated.fullText.length} characters)`)

    // Step 2: Generate AI summary using Gemini (with fallback)
    try {
      summaryResult = await generateSummary(aggregated.fullText, {
        maxLength: 500,
        includeKeyPoints: true,
        includeActionItems: true
      })
      summaryGenerationSucceeded = true
      console.log(`[Summary Processor] Generated summary: ${summaryResult.summary.substring(0, 100)}...`)
    } catch (summaryError) {
      console.error(`[Summary Processor] Gemini API failed, creating fallback summary:`, summaryError)
      
      // Create fallback summary with transcript preview
      const preview = aggregated.fullText.substring(0, 500) + (aggregated.fullText.length > 500 ? '...' : '')
      summaryResult = {
        summary: `⚠️ AI summary generation failed. Transcript preview:\n\n${preview}`,
        keyPoints: ['Summary generation failed - AI service unavailable'],
        actionItems: ['Review raw transcript for details'],
        topics: ['Error: Summary unavailable']
      }
    }

    // Step 3: Save summary to database (always save, even if fallback)
    const savedSummary = await saveSummary(sessionId, {
      content: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      actionItems: summaryResult.actionItems
    })

    console.log(`[Summary Processor] Saved ${summaryGenerationSucceeded ? 'AI' : 'fallback'} summary ${savedSummary.id} for session ${sessionId}`)

    // Step 4: Update session state to 'completed'
    await prisma.session.update({
      where: { id: sessionId },
      data: { 
        state: 'completed',
        endedAt: new Date()
      }
    })

    return {
      sessionId,
      summaryId: savedSummary.id,
      content: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      actionItems: summaryResult.actionItems,
      topics: summaryResult.topics
    }
  } catch (error) {
    console.error(`[Summary Processor] Critical error in summary pipeline for session ${sessionId}:`, error)
    
    // Last resort: Update session state to 'completed' even if everything fails
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { 
          state: 'completed',
          endedAt: new Date()
        }
      })
      console.log(`[Summary Processor] Marked session ${sessionId} as completed despite errors`)
    } catch (updateError) {
      console.error(`[Summary Processor] Failed to update session state:`, updateError)
    }

    throw error
  }
}

/**
 * Saves a generated summary to the database
 * Creates a new Summary record linked to the session
 */
export async function saveSummary(
  sessionId: string,
  summaryData: {
    content: string
    keyPoints: string[]
    actionItems: string[]
  }
) {
  try {
    const summary = await prisma.summary.create({
      data: {
        sessionId,
        content: summaryData.content,
        keyPoints: summaryData.keyPoints,
        actionItems: summaryData.actionItems
      }
    })

    return summary
  } catch (error) {
    console.error(`[Summary Processor] Error saving summary for session ${sessionId}:`, error)
    throw error
  }
}

/**
 * Emits a 'completed' event to the client with summary data and download URL
 * Called after successful summary generation and database save
 */
export async function emitCompletedEvent(
  io: Server,
  socketId: string,
  summaryData: SummaryData
) {
  try {
    const downloadUrl = `/api/download/${summaryData.sessionId}`

    const completedEvent = {
      sessionId: summaryData.sessionId,
      summaryId: summaryData.summaryId,
      summary: summaryData.content,
      keyPoints: summaryData.keyPoints,
      actionItems: summaryData.actionItems,
      topics: summaryData.topics,
      downloadUrl,
      timestamp: new Date().toISOString()
    }

    io.to(socketId).emit('completed', completedEvent)
    console.log(`[Summary Processor] Emitted 'completed' event to socket ${socketId}`)
  } catch (error) {
    console.error(`[Summary Processor] Error emitting completed event:`, error)
    throw error
  }
}
