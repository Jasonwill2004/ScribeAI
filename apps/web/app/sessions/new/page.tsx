import Recorder from '../../../components/Recorder/Recorder'

/**
 * New Session Page
 * Create a new audio recording session with real-time transcription
 */
export default function NewSessionPage() {
  // TODO: Get userId from auth session when Better Auth is implemented
  const userId = 'test-user-123'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Recorder 
        userId={userId}
        sessionTitle={`Session ${new Date().toLocaleString()}`}
      />
    </div>
  )
}
