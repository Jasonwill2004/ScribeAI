/**
 * Google Gemini API Client for Summaries
 * 
 * Environment Variables Required:
 * - GEMINI_API_KEY: Your Google AI API key (get from https://makersuite.google.com/app/apikey)
 * 
 * Documentation: https://ai.google.dev/gemini-api/docs
 * 
 * This module uses Gemini Flash for:
 * - Transcript summarization
 * - Key points extraction
 * - Action items detection
 * - Speaker attribution (future)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface SummaryResult {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  topics: string[]
  confidence: number | null
}

export interface SummaryOptions {
  maxLength?: number
  includeKeyPoints?: boolean
  includeActionItems?: boolean
  includeTopics?: boolean
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

/**
 * Generate summary from full transcript using Gemini Flash
 * 
 * @param transcript - Full transcript text
 * @param options - Summary generation options
 * @returns Summary with key points, action items, topics
 */
export async function generateSummary(
  transcript: string,
  options: SummaryOptions = {}
): Promise<SummaryResult> {
  const {
    maxLength = 500,
    includeKeyPoints = true,
    includeActionItems = true,
    includeTopics = true,
  } = options

  // Validate API key
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found - using stub response')
    return {
      summary: '[Stub] Summary placeholder - configure GEMINI_API_KEY to enable real summaries',
      keyPoints: ['Stub key point 1', 'Stub key point 2'],
      actionItems: ['Stub action item 1'],
      topics: ['Stub topic'],
      confidence: null,
    }
  }

  try {
    console.log(`🎯 Generating summary with Gemini Flash (${transcript.length} chars)`)

    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Build prompt based on options
    const promptParts: string[] = [
      `Analyze this transcript and provide:`,
      `1. A concise summary (max ${maxLength} chars)`,
    ]

    if (includeKeyPoints) {
      promptParts.push(`2. 3-5 key points as bullet points`)
    }
    if (includeActionItems) {
      promptParts.push(`3. Action items or decisions (if any)`)
    }
    if (includeTopics) {
      promptParts.push(`4. Main topics discussed`)
    }

    promptParts.push(`\nFormat your response as JSON with fields: summary, keyPoints, actionItems, topics`)
    promptParts.push(`\nTranscript:\n${transcript}`)

    const prompt = promptParts.join('\n')

    // Generate summary
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON response
    let parsed: any
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text)
    } catch {
      // Fallback: treat as plain summary
      parsed = { summary: text, keyPoints: [], actionItems: [], topics: [] }
    }

    console.log(`✅ Summary generated successfully`)

    return {
      summary: parsed.summary || text,
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
      topics: parsed.topics || [],
      confidence: null,
    }
  } catch (error) {
    console.error(`❌ Summary generation failed:`, error)
    throw new Error(`Summary generation failed: ${(error as Error).message}`)
  }
}

/**
 * Get supported languages for Gemini Flash
 */
export function getSupportedLanguages(): string[] {
  return [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh',
    'ar', 'hi', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'th', 'vi',
  ]
}
