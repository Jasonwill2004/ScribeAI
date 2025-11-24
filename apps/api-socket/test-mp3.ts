/**
 * Test Whisper with MP3 file from WhatsApp
 * 
 * Usage:
 *   1. Place your MP3 file in test-audio/ directory
 *   2. Update MP3_FILE_NAME below to match your file name
 *   3. Run: npx tsx test-mp3.ts
 */

import { transcribeAudioChunk } from './src/lib/whisper'
import path from 'path'

// 👇 CHANGE THIS to your MP3 file name
const MP3_FILE_NAME = 'jaon.mp3'

async function testMP3() {
  const audioPath = path.resolve(__dirname, 'test-audio', MP3_FILE_NAME)
  
  console.log('🎤 Testing Whisper with WhatsApp MP3...\n')
  console.log(`📁 File: ${audioPath}\n`)

  try {
    const result = await transcribeAudioChunk(audioPath, {
      language: 'english',
      task: 'transcribe',
      model: 'base', // More accurate than tiny (~150MB vs ~40MB)
    })

    console.log('\n✅ TRANSCRIPTION RESULT:')
    console.log('────────────────────────────────────────────────────────────────────────────────')
    console.log(`Text: ${result.text}`)
    console.log(`Duration: ${result.duration}ms`)
    console.log(`Language: ${result.language}`)
    console.log('────────────────────────────────────────────────────────────────────────────────')
    console.log('\n✅ MP3 test PASSED!')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.log('\nTroubleshooting:')
    console.log('1. Make sure your MP3 file is in test-audio/ directory')
    console.log('2. Update MP3_FILE_NAME in test-mp3.ts to match your file name')
    console.log('3. Check that ffmpeg is installed: ffmpeg -version')
    process.exit(1)
  }
}

testMP3()
