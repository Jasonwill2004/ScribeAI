import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/**
 * GET /api/auth/session
 * 
 * Returns the current user session if authenticated.
 * Used by AuthGuard to check auth status client-side.
 * 
 * TODO: Replace with Better Auth session endpoint
 * Better Auth provides its own /api/auth/* routes
 * 
 * @returns {Object} Session object or null
 */
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
