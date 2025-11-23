/**
 * Authentication helper for ScribeAI
 * Simple session-based authentication
 * 
 * Uses secure HTTP-only cookies for session management
 * Credentials: test@scribeai.dev / password123
 */

import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simple credentials (in production, use hashed passwords)
const VALID_CREDENTIALS = {
  email: 'test@scribeai.dev',
  password: 'password123'
}

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
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session-id')?.value

    if (!sessionId) {
      return null
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { id: sessionId }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate credentials
    if (email !== VALID_CREDENTIALS.email || password !== VALID_CREDENTIALS.password) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'test-user-123',
          email: 'test@scribeai.dev',
          name: 'Test User'
        }
      })
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return { success: true }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: 'An error occurred during sign in' }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session-id')
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
