'use client'

/**
 * New Session Client Component
 * Client-side component for recording with Recorder
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Recorder from '@/components/Recorder/Recorder'

interface NewSessionClientProps {
  userId: string
}

export default function NewSessionClient({ userId }: NewSessionClientProps) {
  const router = useRouter()
  const [sessionTitle, setSessionTitle] = useState('')

  const handleSessionEnd = (sessionId: string) => {
    // Redirect to session detail page
    router.push(`/sessions/${sessionId}`)
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
          userId={userId}
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
            <li>Wait for AI summary generation to complete</li>
            <li>Download your transcript and summary as a text file</li>
          </ol>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🎤</div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Recording
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              High-quality audio capture with live status updates
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">📝</div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Live Transcription
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              See your words appear in real-time as you speak
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI Summaries
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Automatic key points, action items, and topic extraction
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
