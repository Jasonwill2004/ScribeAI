import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Audio Chunk Aggregator
 * Combines multiple WebM chunks into a single valid WebM file for transcription
 * Solves the EBML header corruption issue in chunks 1+
 */

/**
 * Concatenate WebM chunks using FFmpeg
 * This creates a valid WebM file from multiple chunks that may have corrupted headers
 * 
 * @param chunkPaths - Array of chunk file paths in order
 * @param outputPath - Path where the combined file should be saved
 * @returns Path to the combined audio file
 */
export async function concatenateWebMChunks(
  chunkPaths: string[],
  outputPath: string
): Promise<string> {
  if (chunkPaths.length === 0) {
    throw new Error('No chunks to concatenate')
  }

  // If only one chunk, just copy it
  if (chunkPaths.length === 1) {
    await fs.copyFile(chunkPaths[0], outputPath)
    console.log(`✅ Single chunk copied to: ${outputPath}`)
    return outputPath
  }

  try {
    // Create a concat list file for FFmpeg
    const concatListPath = outputPath.replace(/\.\w+$/, '.txt')
    const concatList = chunkPaths
      .map(p => `file '${p.replace(/'/g, "'\\''")}'`) // Escape single quotes
      .join('\n')
    
    await fs.writeFile(concatListPath, concatList, 'utf-8')
    console.log(`📝 Created concat list with ${chunkPaths.length} chunks`)

    // Use FFmpeg to concatenate chunks
    // -f concat: Use concat demuxer
    // -safe 0: Allow absolute paths
    // -i: Input concat list
    // -c copy: Copy streams without re-encoding (fast)
    const ffmpegCommand = [
      'ffmpeg',
      '-y', // Overwrite output file
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy', // Copy without re-encoding
      outputPath
    ].join(' ')

    console.log(`🎬 Concatenating ${chunkPaths.length} chunks with FFmpeg...`)
    const { stdout, stderr } = await execAsync(ffmpegCommand)
    
    if (stderr && stderr.includes('error')) {
      console.warn('⚠️ FFmpeg warnings:', stderr)
    }

    // Clean up concat list
    await fs.unlink(concatListPath).catch(() => {})

    // Verify output exists and has size
    const stats = await fs.stat(outputPath)
    if (stats.size === 0) {
      throw new Error('Concatenated file is empty')
    }

    console.log(`✅ Concatenated ${chunkPaths.length} chunks → ${outputPath} (${stats.size} bytes)`)
    return outputPath
  } catch (error) {
    console.error('❌ FFmpeg concatenation failed:', error)
    throw new Error(`Failed to concatenate audio chunks: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Alternative: Use binary concatenation for WebM
 * This is faster but less robust than FFmpeg concatenation
 * Only use if FFmpeg concat fails
 */
export async function binaryConcatenateWebM(
  chunkPaths: string[],
  outputPath: string
): Promise<string> {
  if (chunkPaths.length === 0) {
    throw new Error('No chunks to concatenate')
  }

  if (chunkPaths.length === 1) {
    await fs.copyFile(chunkPaths[0], outputPath)
    return outputPath
  }

  try {
    // Read all chunks
    const buffers: Buffer[] = []
    let totalSize = 0

    for (const chunkPath of chunkPaths) {
      const buffer = await fs.readFile(chunkPath)
      buffers.push(buffer)
      totalSize += buffer.length
    }

    // For WebM, we keep the first chunk's EBML header and concatenate the rest
    // This is a simple approach - FFmpeg concat is more reliable
    const combinedBuffer = Buffer.concat(buffers, totalSize)
    await fs.writeFile(outputPath, combinedBuffer)

    console.log(`✅ Binary concatenated ${chunkPaths.length} chunks → ${outputPath} (${totalSize} bytes)`)
    return outputPath
  } catch (error) {
    console.error('❌ Binary concatenation failed:', error)
    throw new Error(`Failed to concatenate chunks: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all chunk files for a session, sorted by index
 */
export async function getSessionChunksSorted(sessionDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(sessionDir)
    
    // Filter audio files and sort by chunk index
    const audioFiles = files
      .filter(f => f.match(/^\d+\.(webm|mp4)$/))
      .sort((a, b) => {
        const aIndex = parseInt(a.match(/^(\d+)/)?.[1] || '0')
        const bIndex = parseInt(b.match(/^(\d+)/)?.[1] || '0')
        return aIndex - bIndex
      })
      .map(f => path.join(sessionDir, f))

    console.log(`📂 Found ${audioFiles.length} chunks in ${sessionDir}`)
    return audioFiles
  } catch (error) {
    console.error(`❌ Error reading session chunks:`, error)
    return []
  }
}
