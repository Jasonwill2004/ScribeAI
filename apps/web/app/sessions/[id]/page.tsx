/**
 * Session Detail Page
 * Displays transcript chunks, AI-generated summary, and download functionality
 */

import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

interface SessionDetailProps {
  params: {
    id: string
  }
}

export default async function SessionDetailPage({ params }: SessionDetailProps) {
  const { id } = params

  // Fetch session with transcript chunks and summary
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      transcriptChunks: {
        orderBy: { chunkIndex: 'asc' }
      },
      summary: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!session) {
    notFound()
  }

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/sessions"
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block"
          >
            ← Back to Sessions
          </Link>
          
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {session.title || 'Untitled Session'}
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Started: {formatDate(session.startedAt)}</p>
                  {session.endedAt && <p>Ended: {formatDate(session.endedAt)}</p>}
                  <p>Duration: {formatDuration(session.durationSec)}</p>
                  <p>Status: <span className="capitalize font-medium">{session.state}</span></p>
                </div>
              </div>
              
              <a
                href={`/api/download/${session.id}`}
                download
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Transcript
              </a>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {session.summary && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">AI Summary</h2>
              {session.summary.content.startsWith('⚠️') && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                  AI Unavailable - Fallback Summary
                </span>
              )}
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-6 whitespace-pre-wrap">{session.summary.content}</p>
              
              {session.summary.keyPoints.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Points</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {session.summary.keyPoints.map((point, index) => (
                      <li key={index} className="text-gray-700">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {session.summary.actionItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Action Items</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {session.summary.actionItems.map((item, index) => (
                      <li key={index} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcript Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Transcript</h2>
          
          {session.transcriptChunks.length === 0 ? (
            <p className="text-gray-500 italic">No transcript available</p>
          ) : (
            <div className="space-y-4">
              {session.transcriptChunks.map((chunk) => (
                <div key={chunk.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="text-xs text-gray-500 mb-1">
                    Chunk #{chunk.chunkIndex + 1} • {formatDate(chunk.timestamp)}
                    {chunk.speaker && ` • Speaker: ${chunk.speaker}`}
                  </div>
                  <p className="text-gray-800">{chunk.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processing State */}
        {session.state === 'processing' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="animate-spin h-8 w-8 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-medium text-yellow-900">Processing summary...</span>
            </div>
            <p className="text-yellow-700">The AI is generating a summary of your session. This page will update automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
