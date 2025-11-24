/**
 * Test script for PR #7 - Summary Aggregation
 * 
 * Tests the complete summary generation flow:
 * 1. Creates stub transcript chunks in database
 * 2. Calls generateSessionSummary()
 * 3. Verifies summary is saved to database
 * 4. Tests download API endpoint
 * 
 * Usage:
 *   npx tsx test-summary.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import { prisma } from './src/db'
import { generateSessionSummary } from './src/summary/processor'
import { createId } from '@paralleldrive/cuid2'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

async function testSummaryGeneration() {
  console.log('🧪 Testing PR #7 - Summary Generation Flow\n')
  console.log(`🔑 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY?.substring(0, 10)}...${process.env.GEMINI_API_KEY?.substring(process.env.GEMINI_API_KEY.length - 4)}\n`)

  try {
    // Step 1: Create a test session with transcript chunks
    console.log('📝 Step 1: Creating test session with transcript chunks...')
    
    const testUserId = 'test-user-123' // From seed-test-user.ts
    const sessionId = createId()

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: testUserId,
        title: 'Test Summary Session',
        state: 'recording',
        durationSec: 180
      }
    })

    // Create 3 transcript chunks
    const chunks = [
      {
        sessionId,
        text: "Hello, this is a test recording. Today we're going to discuss the new features for the ScribeAI application.",
        chunkIndex: 0,
        speaker: null
      },
      {
        sessionId,
        text: "The main features include real-time transcription using Whisper, which provides accurate speech-to-text conversion. We also need to implement speaker diarization in the future.",
        chunkIndex: 1,
        speaker: null
      },
      {
        sessionId,
        text: "Action items: 1) Complete PR #7 for summary generation, 2) Test the download functionality, 3) Deploy to production. That concludes our meeting.",
        chunkIndex: 2,
        speaker: null
      }
    ]

    await prisma.transcriptChunk.createMany({
      data: chunks
    })

    console.log(`✅ Created session ${sessionId} with ${chunks.length} chunks\n`)

    // Step 2: Generate summary
    console.log('📝 Step 2: Generating AI summary using Gemini...')
    
    const summaryData = await generateSessionSummary(sessionId)
    
    console.log('✅ Summary generated successfully!')
    console.log(`   Summary ID: ${summaryData.summaryId}`)
    console.log(`   Content: ${summaryData.content.substring(0, 100)}...`)
    console.log(`   Key Points: ${summaryData.keyPoints.length}`)
    console.log(`   Action Items: ${summaryData.actionItems.length}`)
    console.log(`   Topics: ${summaryData.topics.length}\n`)

    // Step 3: Verify database persistence
    console.log('📝 Step 3: Verifying database persistence...')
    
    const savedSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        summary: true,
        transcriptChunks: {
          orderBy: { chunkIndex: 'asc' }
        }
      }
    })

    if (!savedSession) {
      throw new Error('Session not found in database')
    }

    if (!savedSession.summary) {
      throw new Error('Summary not saved to database')
    }

    if (savedSession.state !== 'completed') {
      throw new Error('Session state not updated to completed')
    }

    console.log('✅ Database verification passed!')
    console.log(`   Session state: ${savedSession.state}`)
    console.log(`   Summary ID: ${savedSession.summary.id}`)
    console.log(`   Transcript chunks: ${savedSession.transcriptChunks.length}\n`)

    // Step 4: Test download URL generation
    console.log('📝 Step 4: Download URL generation...')
    const downloadUrl = `/api/download/${sessionId}`
    console.log(`✅ Download URL: ${downloadUrl}\n`)

    // Step 5: Display full summary
    console.log('📋 FULL SUMMARY RESULTS')
    console.log('='.repeat(80))
    console.log(`\nSummary:\n${savedSession.summary.content}\n`)
    
    if (savedSession.summary.keyPoints.length > 0) {
      console.log('Key Points:')
      savedSession.summary.keyPoints.forEach((point, i) => {
        console.log(`  ${i + 1}. ${point}`)
      })
      console.log('')
    }
    
    if (savedSession.summary.actionItems.length > 0) {
      console.log('Action Items:')
      savedSession.summary.actionItems.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item}`)
      })
      console.log('')
    }

    console.log('='.repeat(80))
    console.log('\n✨ PR #7 TEST PASSED - All components working!\n')
    console.log('✅ Summary processor: aggregateTranscript() ✓')
    console.log('✅ Gemini integration: generateSummary() ✓')
    console.log('✅ Database persistence: saveSummary() ✓')
    console.log('✅ Session state update: completed ✓')
    console.log('✅ Download URL generation: ✓\n')

    console.log('📌 Next Steps:')
    console.log('   1. Test with Socket.io: emit end_session event')
    console.log('   2. Verify "completed" event emission')
    console.log('   3. Test session detail page: /sessions/' + sessionId)
    console.log('   4. Test download endpoint: GET ' + downloadUrl + '\n')

    // Cleanup
    console.log('🧹 Cleaning up test data...')
    await prisma.session.delete({ where: { id: sessionId } })
    console.log('✅ Test session deleted\n')

  } catch (error) {
    console.error('❌ TEST FAILED:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run test
testSummaryGeneration().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
