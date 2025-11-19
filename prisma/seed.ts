import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed database with initial data for development
 */
async function main() {
  console.log('🌱 Starting database seed...')

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@scribeai.dev' },
    update: {},
    create: {
      email: 'test@scribeai.dev',
      name: 'Test User',
    },
  })

  console.log('✅ Created test user:', user.email)

  // Create sample completed session
  const completedSession = await prisma.session.create({
    data: {
      userId: user.id,
      title: 'Sample Team Meeting',
      startedAt: new Date('2025-11-19T10:00:00Z'),
      endedAt: new Date('2025-11-19T10:45:00Z'),
      durationSec: 2700, // 45 minutes
      state: 'completed',
      transcriptChunks: {
        create: [
          {
            text: 'Welcome everyone to today\'s team meeting. Let\'s start with the project updates.',
            speaker: 'John',
            chunkIndex: 0,
            timestamp: new Date('2025-11-19T10:00:30Z'),
          },
          {
            text: 'Thanks John. I\'ve completed the frontend redesign and it\'s ready for review.',
            speaker: 'Sarah',
            chunkIndex: 1,
            timestamp: new Date('2025-11-19T10:02:00Z'),
          },
          {
            text: 'Great work! Can we schedule the deployment for next Tuesday?',
            speaker: 'John',
            chunkIndex: 2,
            timestamp: new Date('2025-11-19T10:03:30Z'),
          },
        ],
      },
      summary: {
        create: {
          content: 'Team discussed project updates. Sarah completed the frontend redesign. Deployment scheduled for next Tuesday.',
          keyPoints: [
            'Frontend redesign completed',
            'Code review pending',
            'Deployment planned for next Tuesday',
          ],
          actionItems: [
            'Review Sarah\'s frontend changes',
            'Schedule deployment for Tuesday',
            'Update project timeline',
          ],
        },
      },
    },
  })

  console.log('✅ Created sample session:', completedSession.id)

  // Create an active recording session
  const activeSession = await prisma.session.create({
    data: {
      userId: user.id,
      title: 'Product Planning Session',
      startedAt: new Date(),
      state: 'recording',
      transcriptChunks: {
        create: [
          {
            text: 'Let\'s discuss the Q1 roadmap and prioritize our features.',
            speaker: null,
            chunkIndex: 0,
            timestamp: new Date(),
          },
        ],
      },
    },
  })

  console.log('✅ Created active session:', activeSession.id)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
