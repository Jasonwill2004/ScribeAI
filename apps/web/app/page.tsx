import Link from 'next/link'

/**
 * Home page component
 * Landing page for ScribeAI application
 */
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          Welcome to ScribeAI
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-8">
          AI-powered audio transcription for meetings and recordings. 
          Capture, transcribe, and summarize your conversations in real-time.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition">
            Get Started
          </Link>
          <Link href="#features" className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg shadow-md transition">
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}
