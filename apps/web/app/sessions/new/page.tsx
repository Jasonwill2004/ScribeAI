/**
 * New Session Page
 * Page for starting a new recording session
 */

import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewSessionClient from './NewSessionClient'

export default async function NewSessionPage() {
  // Get current user - required for session creation
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return <NewSessionClient userId={user.id} />
}
