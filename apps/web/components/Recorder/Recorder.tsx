'use client'

/**
 * Recorder Component
 * MediaRecorder-based audio recorder with Socket.io streaming
 * Features: chunked recording, pause/resume, live transcript display
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { socket } from '@/lib/socket'
import {
  startSession,
  sendAudioChunk,
  pauseSession,
  resumeSession,
  endSession,
  TranscriptEvent,
  SessionStatusEvent,
} from '@/lib/socketClient'

// Configuration
const CHUNK_DURATION_MS = parseInt(process.env.NEXT_PUBLIC_CHUNK_DURATION_MS || '15000') // 15 seconds default

type RecorderState = 'idle' | 'recording' | 'paused' | 'processing' | 'error'
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface RecorderProps {
  userId: string
  sessionTitle?: string
  onSessionEnd?: (sessionId: string) => void
}

interface TranscriptLine {
  chunkIndex: number
  text: string
  timestamp: string
}

export default function Recorder({ userId, sessionTitle, onSessionEnd }: RecorderProps) {
  // State
  const [recorderState, setRecorderState] = useState<RecorderState>('idle')
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [chunkCount, setChunkCount] = useState(0)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunkIndexRef = useRef(0)
  const sessionIdRef = useRef<string | null>(null)
  const onSessionEndRef = useRef(onSessionEnd)
  const isStoppingRef = useRef(false) // Prevent chunks after stop

  // Keep onSessionEnd ref updated
  useEffect(() => {
    onSessionEndRef.current = onSessionEnd
  }, [onSessionEnd])

  // Sync sessionId state with ref
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  /**
   * Initialize Socket.io event listeners
   */
  useEffect(() => {
    // Connection state handlers
    const handleConnect = () => setConnectionState('connected')
    const handleDisconnect = () => setConnectionState('disconnected')
    const handleReconnect = () => setConnectionState('connected')
    const handleReconnecting = () => setConnectionState('reconnecting')

    // Transcript event handler
    const handleTranscript = (data: TranscriptEvent) => {
      console.log('📝 Transcript received:', data)
      setTranscriptLines((prev) => [
        ...prev,
        {
          chunkIndex: data.chunkIndex,
          text: data.text,
          timestamp: data.timestamp,
        },
      ])
    }

    // Session status handler
    const handleSessionStatus = (data: SessionStatusEvent) => {
      console.log('📡 Session status:', data.status)
      if (data.status === 'processing') {
        setRecorderState('processing')
      } else if (data.status === 'completed') {
        setRecorderState('idle')
        // Reset session for next recording
        setSessionId(null)
        setChunkCount(0)
        setTranscriptLines([])
        chunkIndexRef.current = 0
        
        if (onSessionEndRef.current) {
          onSessionEndRef.current(data.sessionId)
        }
      }
    }

    // Error handler
    const handleError = (errorData: { message: string }) => {
      setError(errorData.message)
      setRecorderState('error')
    }

    // Register event listeners
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('reconnect', handleReconnect)
    socket.on('reconnecting', handleReconnecting)
    socket.on('transcript', handleTranscript)
    socket.on('session:status', handleSessionStatus)
    socket.on('error', handleError)

    // Set initial connection state
    setConnectionState(socket.connected ? 'connected' : 'disconnected')

    // Cleanup: remove event listeners only, do NOT disconnect
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('reconnect', handleReconnect)
      socket.off('reconnecting', handleReconnecting)
      socket.off('transcript', handleTranscript)
      socket.off('session:status', handleSessionStatus)
      socket.off('error', handleError)
    }
  }, []) // Empty dependency array - only run once on mount

  /**
   * Heartbeat sender - keeps connection alive
   * Sends heartbeat every 10 seconds to prevent server timeout
   */
  useEffect(() => {
    const sendHeartbeat = () => {
      if (socket.connected) {
        socket.emit('heartbeat', { clientTime: Date.now() })
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Send heartbeat every 10 seconds
    const interval = setInterval(sendHeartbeat, 10000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Request microphone access
   */
  const requestMicrophone = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      })
      return stream
    } catch (err) {
      console.error('❌ Microphone access denied:', err)
      throw new Error('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [])

  /**
   * Start recording
   */
  const handleStart = useCallback(async () => {
    try {
      setError(null)

      // Check socket connection
      if (!socket?.connected) {
        throw new Error('Socket not connected. Please refresh and try again.')
      }

      // Start session on server
      const response = await startSession(
        userId,
        sessionTitle || `Session ${new Date().toLocaleString()}`
      )

      if (!response.success || !response.sessionId) {
        throw new Error(response.error || 'Failed to start session')
      }

      setSessionId(response.sessionId)
      chunkIndexRef.current = 0
      setChunkCount(0)
      setTranscriptLines([])

      // Request microphone
      const stream = await requestMicrophone()
      mediaStreamRef.current = stream

      // Determine mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      })

      mediaRecorderRef.current = mediaRecorder

      // Handle data available event (chunk ready)
      mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        // Skip if we're stopping (prevents final chunk after stop)
        if (isStoppingRef.current) {
          console.log('⏭️ Skipping chunk - recorder is stopping')
          return
        }

        if (event.data.size > 0 && socket?.connected && response.sessionId) {
          const arrayBuffer = await event.data.arrayBuffer()
          const currentChunkIndex = chunkIndexRef.current++

          console.log(`📤 Sending chunk ${currentChunkIndex} (${event.data.size} bytes)`)

          try {
            const chunkResponse = await sendAudioChunk(
              response.sessionId,
              currentChunkIndex,
              arrayBuffer
            )

            if (chunkResponse.success) {
              setChunkCount((prev) => prev + 1)
              console.log(`✅ Chunk ${currentChunkIndex} acknowledged`)
            } else {
              console.error(`❌ Chunk ${currentChunkIndex} failed:`, chunkResponse.error)
              setError(`Failed to send chunk ${currentChunkIndex}`)
            }
          } catch (error) {
            console.error(`❌ Error sending chunk ${currentChunkIndex}:`, error)
            setError(`Network error sending chunk ${currentChunkIndex}`)
          }
        } else if (event.data.size > 0 && !socket?.connected) {
          console.warn(`⚠️ Cannot send chunk - socket disconnected`)
          setError('Connection lost while recording')
        }
      }

      // Handle errors
      mediaRecorder.onerror = (event: Event) => {
        console.error('❌ MediaRecorder error:', event)
        setError('Recording error occurred')
        setRecorderState('error')
      }

      // Handle stop
      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped')
        // Clean up stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }
      }

      // Start recording with time slices
      // Add small delay to ensure session is ready on server
      await new Promise(resolve => setTimeout(resolve, 500))
      mediaRecorder.start(CHUNK_DURATION_MS)
      setRecorderState('recording')
      console.log(`🎙️ Recording started with ${CHUNK_DURATION_MS}ms chunks`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording'
      setError(errorMessage)
      setRecorderState('error')
      console.error('❌ Start recording error:', err)
    }
  }, [userId, sessionTitle, requestMicrophone])

  /**
   * Pause recording
   */
  const handlePause = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setRecorderState('paused')

      if (sessionId) {
        await pauseSession(sessionId)
      }

      console.log('⏸️ Recording paused')
    }
  }, [sessionId])

  /**
   * Resume recording
   */
  const handleResume = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setRecorderState('recording')

      if (sessionId) {
        await resumeSession(sessionId)
      }

      console.log('▶️ Recording resumed')
    }
  }, [sessionId])

  /**
   * Stop recording
   */
  const handleStop = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const currentSessionId = sessionId
      
      // Set flag to prevent chunks after stop
      isStoppingRef.current = true
      
      mediaRecorderRef.current.stop()
      setRecorderState('processing')

      if (currentSessionId) {
        try {
          await endSession(currentSessionId)
          console.log('⏹️ Recording stopped, session ended')
        } catch (error) {
          console.error('❌ Error ending session:', error)
        }
        
        // Wait for server to process, then reset for next recording
        // Use a longer timeout to ensure all chunks are processed
        setTimeout(() => {
          setRecorderState('idle')
          setConnectionState('connected') // Restore connected state
          setSessionId(null)
          setChunkCount(0)
          setTranscriptLines([])
          chunkIndexRef.current = 0
          setError(null) // Clear any errors
          isStoppingRef.current = false // Reset flag for next recording
          
          if (onSessionEnd) {
            onSessionEnd(currentSessionId)
          }
        }, 5000) // Give server 5 seconds to process all chunks
      } else {
        console.log('⏹️ MediaRecorder stopped (no session)')
      }
    }
  }, [sessionId, onSessionEnd])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Audio Recorder</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Record audio with real-time transcription
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connectionState === 'connected'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : connectionState === 'reconnecting'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {connectionState}
          </span>
        </div>
        {sessionId && (
          <div className="mt-2 text-xs text-gray-500">
            Session ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{sessionId}</code>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center gap-4">
          {recorderState === 'idle' && (
            <button
              onClick={handleStart}
              disabled={connectionState !== 'connected'}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed"
            >
              🎙️ Start Recording
            </button>
          )}

          {recorderState === 'recording' && (
            <>
              <button
                onClick={handlePause}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                ⏸️ Pause
              </button>
              <button
                onClick={handleStop}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                ⏹️ Stop
              </button>
            </>
          )}

          {recorderState === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                ▶️ Resume
              </button>
              <button
                onClick={handleStop}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                ⏹️ Stop
              </button>
            </>
          )}

          {recorderState === 'processing' && (
            <div className="px-8 py-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-semibold">
              ⚙️ Processing...
            </div>
          )}
        </div>

        {/* Stats */}
        {(recorderState === 'recording' || recorderState === 'paused') && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Chunks sent: <span className="font-bold">{chunkCount}</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-red-800 dark:text-red-200 font-medium">❌ Error: {error}</span>
          </div>
        </div>
      )}

      {/* Live Transcript */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Live Transcript</h3>
        <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
          {transcriptLines.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
              Transcript will appear here as you speak...
            </p>
          ) : (
            transcriptLines.map((line, index) => (
              <div
                key={index}
                className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Chunk {line.chunkIndex} • {new Date(line.timestamp).toLocaleTimeString()}
                </div>
                <p className="text-gray-900 dark:text-gray-100">{line.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
