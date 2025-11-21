'use client'

/**
 * New Session Page
 * Page for starting a new recording session
 */

import { useState } from 'react'
import Recorder from '@/components/Recorder/Recorder'

// TODO: Replace with actual user ID from auth context
const TEMP_USER_ID = 'test-user-123'

export default function NewSessionPage() {
  const [sessionTitle, setSessionTitle] = useState('')

  const handleSessionEnd = (sessionId: string) => {
    // TODO: Redirect to session detail page once it exists
    // router.push(`/sessions/${sessionId}`)
    alert(`Recording complete! Session ID: ${sessionId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            New Recording Session
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Record audio with real-time transcription and AI-powered summaries
          </p>
        </div>

        {/* Session Title Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <label htmlFor="session-title" className="block text-sm font-medium mb-2">
            Session Title (Optional)
          </label>
          <input
            id="session-title"
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="e.g., Team Meeting, Interview, Lecture Notes..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Give your session a descriptive name to easily find it later
          </p>
        </div>

        {/* Recorder Component */}
        <Recorder
          userId={TEMP_USER_ID}
          sessionTitle={sessionTitle || undefined}
          onSessionEnd={handleSessionEnd}
        />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📋 How to use:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Click "Start Recording" to begin capturing audio</li>
            <li>Audio is automatically sent to the server in 15-second chunks</li>
            <li>Use "Pause" to temporarily stop recording, then "Resume" to continue</li>
            <li>Click "Stop" when finished to process the full transcription</li>
            <li>View the live transcript as it's generated in real-time</li>
          </ol>
        </div>

        {/* System Requirements */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            System Requirements
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>✅ Microphone access required</li>
            <li>✅ Modern browser (Chrome, Firefox, Edge, Safari)</li>
            <li>✅ Stable internet connection for real-time streaming</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
