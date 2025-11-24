import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables from root .env
dotenv.config({ path: '../../.env' })

const prisma = new PrismaClient()

async function main() {
  // Create test user with ID 'test-user-123'
  const user = await prisma.user.upsert({
    where: { id: 'test-user-123' },
    update: {},
    create: {
      id: 'test-user-123',
      email: 'test@scribeai.com',
      name: 'Test User',
    },
  })

  console.log('✅ Test user created:', user)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
