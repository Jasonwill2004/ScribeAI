/**
 * Google Gemini API Client for Summaries
 * 
 * Environment Variables Required:
 * - GEMINI_API_KEY: Your Google Gemini API key
 * 
 * This module uses Gemini 2.5 Flash for:
 * - Transcript summarization
 * - Key points extraction
 * - Action items detection
 * - Fast, cost-effective AI summaries
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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * Generate summary from full transcript using Google Gemini 2.5 Flash
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
    console.log(`🎯 Generating summary with Gemini 2.5 Flash (${transcript.length} chars)`)

    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Build prompt
    const prompt = `You are an expert meeting summarizer. Analyze the transcript and provide:
1. A concise summary (max ${maxLength} characters)
${includeKeyPoints ? '2. 3-5 key points as bullet points' : ''}
${includeActionItems ? '3. Action items or decisions (if any)' : ''}
${includeTopics ? '4. Main topics discussed' : ''}

Format your response as JSON with fields: summary, keyPoints, actionItems, topics

Transcript:
${transcript}`

    // Call Gemini API
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    console.log(`✅ Summary generated successfully with Gemini 2.5 Flash`)

    return {
      summary: parsed.summary || 'Summary not available',
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
 * Get supported languages for Gemini (supports 50+ languages)
 */
export function getSupportedLanguages(): string[] {
  return [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh',
    'ar', 'hi', 'tr', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'th', 'vi',
    'id', 'he', 'uk', 'bn', 'ms', 'fa', 'el', 'bg', 'sr', 'hr', 'sk', 'sl',
  ]
}
