/**
 * Authentication helper for ScribeAI
 * Server-side authentication utilities
 * 
 * TODO: Replace placeholder implementation with Better Auth
 * Better Auth documentation: https://www.better-auth.com/docs
 * 
 * Integration steps:
 * 1. Install Better Auth: npm install better-auth
 * 2. Configure Better Auth client in lib/auth-client.ts
 * 3. Replace getCurrentUser with Better Auth session retrieval
 * 4. Update signIn/signOut to use Better Auth methods
 */

import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * User type from Prisma schema
 */
export type User = {
  id: string
  email: string
  name: string | null
  betterAuthId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Session data structure
 */
export type Session = {
  user: User
  expiresAt: Date
}

/**
 * Get the current authenticated user from the session
 * 
 * @returns User object if authenticated, null otherwise
 * 
 * TODO: Replace with Better Auth session retrieval
 * Example Better Auth implementation:
 * ```typescript
 * import { auth } from '@/lib/auth-client'
 * const session = await auth.getSession()
 * return session?.user ?? null
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // PLACEHOLDER: Read auth token from cookies
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return null
    }

    // PLACEHOLDER: In production, verify JWT and extract user ID
    // For now, return test user for development
    const user = await prisma.user.findUnique({
      where: { email: 'test@scribeai.dev' }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get the current session
 * 
 * @returns Session object if authenticated, null otherwise
 */
export async function getSession(): Promise<Session | null> {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  return {
    user,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}

/**
 * Check if user is authenticated
 * 
 * @returns true if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in Server Components that require auth
 * 
 * @throws Error if user is not authenticated
 * @returns User object
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized - Please sign in to continue')
  }
  
  return user
}

/**
 * Sign in placeholder
 * 
 * TODO: Replace with Better Auth sign in
 * Example:
 * ```typescript
 * import { signIn } from '@/lib/auth-client'
 * await signIn.email({ email, password })
 * ```
 */
export async function signIn(email: string, password: string) {
  // PLACEHOLDER: Implement Better Auth sign in
  console.log('Sign in called with:', email)
  throw new Error('Sign in not implemented - Please configure Better Auth')
}

/**
 * Sign out placeholder
 * 
 * TODO: Replace with Better Auth sign out
 * Example:
 * ```typescript
 * import { signOut } from '@/lib/auth-client'
 * await signOut()
 * ```
 */
export async function signOut() {
  // PLACEHOLDER: Implement Better Auth sign out
  console.log('Sign out called')
  throw new Error('Sign out not implemented - Please configure Better Auth')
}
