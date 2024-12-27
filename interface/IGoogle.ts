/** @format */

import { GEMChatRoleEnum } from './Enum'

export interface GEMChatRequest {
    contents: GEMChatMessage[]
    safetySettings?: SafetySetting[]
    generationConfig?: GenerationConfig
    system_instruction?: GemSystemInstruction
}

export interface GEMChatMessage {
    role: GEMChatRoleEnum
    parts: Part[]
}

export interface GemSystemInstruction {
    parts: Part
}

export interface GoogleEmbedRequest {
    model: string
    content: {
        parts: { text: string }[]
    }
}

export interface GoogleEmbedResponse {
    embedding: {
        values: number[]
    }
}

interface Part {
    text?: string
    inline_data?: InlineData
}

interface InlineData {
    mime_type: string // 'image/png' | 'image/jpeg' | 'image/webp' | 'image/heic' | 'image/heif'
    data: string
}

interface SafetySetting {
    category: string
    threshold: string
}

interface GenerationConfig {
    stopSequences?: string[]
    temperature?: number
    maxOutputTokens?: number
    topP?: number
    topK?: number
}

export interface GEMChatResponse {
    candidates?: Candidate[]
    promptFeedback?: Feedback
}

interface Candidate {
    content?: GEMChatMessage
    finishReason: string
    index: number
    safetyRatings: Rating[]
}

interface Feedback {
    blockReason?: string
    safetyRatings: Rating[]
}

interface Rating {
    category: string
    probability: string
}
