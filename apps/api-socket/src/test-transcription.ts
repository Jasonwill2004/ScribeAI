/**
 * Test script for transcription worker
 * 
 * Usage:
 *   npm run test:transcription
 * 
 * This script tests the Whisper transcription integration.
 */

import dotenv from 'dotenv'
import path from 'path'
import { transcribeAudioChunk } from './lib/whisper'

// Load environment variables
dotenv.config({ path: '../../.env' })

const __dirname = path.resolve()

async function testTranscription() {
  console.log('🧪 Testing Whisper Transcription Worker\n')

  // Test with real audio file
  console.log('📝 Testing Whisper transcription\n')
  
  const audioFilePath = path.join(__dirname, 'tmp', 'test-session', '0.webm')
  
  try {
    const result = await transcribeAudioChunk(audioFilePath, {
      language: 'english',
      task: 'transcribe',
      model: 'base'
    })

    console.log('✅ Transcription result:')
    console.log(`   Text: "${result.text}"`)
    console.log(`   Speaker: ${result.speaker || 'N/A'}`)
    console.log(`   Confidence: ${result.confidence || 'N/A'}`)
    console.log(`   Duration: ${result.duration}s`)
    console.log(`   Language: ${result.language || 'N/A'}\n`)
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.log('')
  }

  // Instructions for testing with real audio
  console.log('📌 To test with real audio:')
  console.log('   1. Start recording: npm run dev (in apps/web)')
  console.log('   2. Record a short message (15-30 seconds)')
  console.log('   3. Check apps/api-socket/tmp/<session-id>/ for audio files')
  console.log('   4. Transcription will happen automatically via Socket.io\n')

  console.log('✨ Test complete!')
}

// Run test
testTranscription().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
