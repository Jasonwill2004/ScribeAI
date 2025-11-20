import { AuthGuard, AuthLoadingSpinner } from '@/app/components/AuthGuard'

/**
 * Protected route group layout
 * All routes under /app/(protected) require authentication
 * 
 * Route groups in Next.js App Router:
 * - Folder names in parentheses (protected) don't affect the URL
 * - This layout wraps all pages in this group
 * - Users must be authenticated to access these pages
 * 
 * Protected pages will be under:
 * - /dashboard
 * - /sessions
 * - /sessions/[id]
 * - /settings
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard fallback={<AuthLoadingSpinner />}>
      {children}
    </AuthGuard>
  )
}
