/**
 * OpenAI Whisper Local Transcription Client
 * 
 * Uses @xenova/transformers to run Whisper locally (FREE)
 * No API key required, runs entirely on your machine
 * 
 * Documentation: https://huggingface.co/docs/transformers.js/guides/node-audio-processing
 */

import { pipeline } from '@xenova/transformers'
import { spawn } from 'child_process'

export interface TranscriptionResult {
  text: string
  speaker: string | null
  confidence: number | null
  duration?: number
  language?: string
}

export interface TranscriptionOptions {
  language?: string
  task?: 'transcribe' | 'translate'
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large'
}

let transcriber: any = null

/**
 * Initialize Whisper transcriber (lazy loading)
 * Downloads model on first use (~40MB for tiny, ~150MB for base)
 */
async function getTranscriber(modelSize: string = 'tiny') {
  if (!transcriber) {
    console.log(`🎤 Loading Whisper ${modelSize} model (first use may take a minute)...`)
    transcriber = await pipeline('automatic-speech-recognition', `Xenova/whisper-${modelSize}`)
    console.log(`✅ Whisper ${modelSize} model loaded`)
  }
  return transcriber
}

/**
 * Convert audio file to Float32Array using ffmpeg
 * Whisper expects 16kHz mono PCM
 */
async function loadAudioAsFloat32(filePath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-f', 'f32le',
      '-ac', '1',
      '-ar', '16000',
      'pipe:1',
    ])

    const chunks: Buffer[] = []

    ffmpeg.stdout.on('data', (data) => chunks.push(data))

    ffmpeg.stderr.on('data', () => {}) // Ignore ffmpeg logs

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}`))
        return
      }
      const buffer = Buffer.concat(chunks)
      resolve(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4))
    })

    ffmpeg.on('error', reject)
  })
}

/**
 * Transcribe audio chunk using local Whisper model
 * 
 * @param filePath - Absolute path to audio file (webm, mp4, wav, etc.)
 * @param options - Transcription options
 * @returns Transcription result with text
 */
export async function transcribeAudioChunk(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const { language = 'english', task = 'transcribe', model = 'tiny' } = options

  try {
    console.log(`🎯 Transcribing audio with Whisper (${model}): ${filePath}`)
    const startTime = Date.now()

    // Get or initialize transcriber
    const whisper = await getTranscriber(model)

    // Convert audio to Float32Array using ffmpeg
    console.log(`🔄 Converting audio to PCM...`)
    const audio = await loadAudioAsFloat32(filePath)

    // Transcribe
    console.log(`📝 Transcribing...`)
    const result = await whisper(audio, {
      task,
      language,
      chunk_length_s: 30, // Process in 30-second chunks
      stride_length_s: 5, // 5-second overlap for better accuracy
    })

    const duration = Date.now() - startTime
    const text = result.text.trim()

    console.log(`✅ Transcription complete in ${duration}ms (${text.length} chars)`)

    return {
      text,
      speaker: null, // TODO: Add speaker diarization with pyannote
      confidence: null,
      duration,
      language,
    }
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error)
    throw new Error(`Whisper transcription failed: ${(error as Error).message}`)
  }
}

/**
 * Get supported audio formats for Whisper
 */
export function getSupportedFormats(): string[] {
  return ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac']
}

/**
 * Validate if audio format is supported
 */
export function isFormatSupported(mimeType: string): boolean {
  return getSupportedFormats().includes(mimeType)
}
