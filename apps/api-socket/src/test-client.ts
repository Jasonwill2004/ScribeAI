/**
 * Simple Socket.io test client
 * Tests the socket events: start_session, audio_chunk, pause, resume, end_session
 * 
 * Run with: npm run test-client
 */

import { io } from 'socket.io-client'
import { randomUUID } from 'crypto'

const SOCKET_URL = 'http://localhost:4001'

// Test user ID (from seed data)
const TEST_USER_ID = 'test-user-123'

async function testSocketEvents() {
  console.log('🔌 Connecting to socket server:', SOCKET_URL)
  
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    timeout: 20000,
    reconnection: false
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message)
    console.error('  Error details:', error)
    process.exit(1)
  })

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error)
  })

  socket.on('connect', async () => {
    console.log('✅ Connected to socket server\n')

    try {
      // Test 1: Start session
      console.log('📝 Test 1: Starting session...')
      const startResponse = await new Promise((resolve) => {
        socket.emit('start_session', {
          userId: TEST_USER_ID,
          title: 'Test Session'
        }, resolve)
      })
      console.log('  Response:', startResponse)
      const { sessionId } = startResponse as any

      if (!sessionId) {
        throw new Error('No sessionId returned')
      }

      // Test 2: Send audio chunk
      console.log('\n🎵 Test 2: Sending audio chunk...')
      const audioData = Buffer.from('fake audio data').toString('base64')
      const chunkResponse = await new Promise((resolve) => {
        socket.emit('audio_chunk', {
          sessionId,
          chunkIndex: 0,
          audioData,
          speaker: 'Test Speaker'
        }, resolve)
      })
      console.log('  Response:', chunkResponse)

      // Test 3: Pause session
      console.log('\n⏸️  Test 3: Pausing session...')
      const pauseResponse = await new Promise((resolve) => {
        socket.emit('pause', { sessionId }, resolve)
      })
      console.log('  Response:', pauseResponse)

      // Test 4: Resume session
      console.log('\n▶️  Test 4: Resuming session...')
      const resumeResponse = await new Promise((resolve) => {
        socket.emit('resume', { sessionId }, resolve)
      })
      console.log('  Response:', resumeResponse)

      // Test 5: Send another chunk
      console.log('\n🎵 Test 5: Sending second audio chunk...')
      const chunk2Response = await new Promise((resolve) => {
        socket.emit('audio_chunk', {
          sessionId,
          chunkIndex: 1,
          audioData,
          speaker: 'Test Speaker'
        }, resolve)
      })
      console.log('  Response:', chunk2Response)

      // Test 6: End session
      console.log('\n⏹️  Test 6: Ending session...')
      const endResponse = await new Promise((resolve) => {
        socket.emit('end_session', { sessionId }, resolve)
      })
      console.log('  Response:', endResponse)

      console.log('\n✅ All tests passed!')
      console.log(`\n📊 Session ID: ${sessionId}`)
      console.log('  Check database for:')
      console.log('  - Session record with state: processing → completed')
      console.log('  - 2 TranscriptChunk records')
      console.log(`  - Audio files in apps/api-socket/tmp/${sessionId}/`)
      
      setTimeout(() => {
        socket.disconnect()
        process.exit(0)
      }, 2000)
    } catch (error) {
      console.error('\n❌ Test failed:', error)
      socket.disconnect()
      process.exit(1)
    }
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message)
    process.exit(1)
  })

  socket.on('session:status', (data) => {
    console.log('  📡 Session status event:', data)
  })

  socket.on('audio:received', (data) => {
    console.log('  📡 Audio received event:', data)
  })

  socket.on('error', (data) => {
    console.error('  ❌ Error event:', data)
  })
}

testSocketEvents()
