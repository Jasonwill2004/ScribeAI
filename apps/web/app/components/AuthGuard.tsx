'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Client-side authentication guard component
 * Protects routes by redirecting unauthenticated users to login
 * 
 * TODO: Replace with Better Auth client-side session check
 * Better Auth provides useSession() hook for client-side auth state
 * 
 * Example Better Auth implementation:
 * ```typescript
 * import { useSession } from '@/lib/auth-client'
 * const { data: session, status } = useSession()
 * if (status === 'unauthenticated') redirect('/login')
 * ```
 */

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * AuthGuard Component
 * Wraps protected content and handles authentication checks
 * 
 * @param children - Content to protect
 * @param fallback - Optional loading state while checking auth
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [pathname])

  async function checkAuth() {
    try {
      // PLACEHOLDER: Check authentication status
      // In production, this should call Better Auth API
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      if (response.ok) {
        const session = await response.json()
        setIsAuthenticated(!!session?.user)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname)
      router.push(`/login?returnUrl=${returnUrl}`)
    }
  }, [isChecking, isAuthenticated, pathname, router])

  // Show loading state while checking auth
  if (isChecking) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    )
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * Loading spinner component for auth checks
 */
export function AuthLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Checking authentication...
      </p>
    </div>
  )
}

/**
 * Unauthorized message component
 */
export function UnauthorizedMessage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🔒 Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be signed in to access this page.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
