import { promises as fs } from 'fs'
import path from 'path'

/**
 * File storage utilities for audio chunks
 */

const TMP_DIR = path.join(process.cwd(), 'tmp')

/**
 * Ensure the tmp directory and session folder exist
 */
export async function ensureSessionDirectory(sessionId: string): Promise<string> {
  const sessionDir = path.join(TMP_DIR, sessionId)
  
  try {
    await fs.mkdir(sessionDir, { recursive: true })
    return sessionDir
  } catch (error) {
    console.error(`Error creating session directory: ${sessionId}`, error)
    throw new Error('Failed to create session directory')
  }
}

/**
 * Save Base64 audio chunk to disk
 */
export async function saveAudioChunk(
  sessionId: string,
  chunkIndex: number,
  base64Data: string
): Promise<string> {
  const sessionDir = await ensureSessionDirectory(sessionId)
  const filename = `${chunkIndex}.webm`
  const filePath = path.join(sessionDir, filename)

  try {
    // Convert Base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Write to disk
    await fs.writeFile(filePath, buffer)
    
    console.log(`✅ Saved audio chunk: ${filePath} (${buffer.length} bytes)`)
    return filePath
  } catch (error) {
    console.error(`Error saving audio chunk ${chunkIndex} for session ${sessionId}:`, error)
    throw new Error('Failed to save audio chunk')
  }
}

/**
 * Clean up session directory after processing
 */
export async function cleanupSessionDirectory(sessionId: string): Promise<void> {
  const sessionDir = path.join(TMP_DIR, sessionId)
  
  try {
    await fs.rm(sessionDir, { recursive: true, force: true })
    console.log(`🗑️  Cleaned up session directory: ${sessionId}`)
  } catch (error) {
    console.error(`Error cleaning up session directory: ${sessionId}`, error)
    // Don't throw - cleanup is best effort
  }
}

/**
 * Get all chunk files for a session
 */
export async function getSessionChunks(sessionId: string): Promise<string[]> {
  const sessionDir = path.join(TMP_DIR, sessionId)
  
  try {
    const files = await fs.readdir(sessionDir)
    return files
      .filter(f => f.endsWith('.webm'))
      .sort((a, b) => {
        const aIndex = parseInt(a.replace('.webm', ''))
        const bIndex = parseInt(b.replace('.webm', ''))
        return aIndex - bIndex
      })
      .map(f => path.join(sessionDir, f))
  } catch (error) {
    console.error(`Error reading session chunks: ${sessionId}`, error)
    return []
  }
}
