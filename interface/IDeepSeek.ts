/** @format */

import { DeepSeekChatModel } from './Enum'

// message types
interface SystemMessage {
    role: 'system'
    content: string
    name?: string
}

interface UserMessage {
    role: 'user'
    content: string
    name?: string
}

interface AssistantMessage {
    role: 'assistant'
    content: string | null
    name?: string
    prefix?: boolean // Beta功能
    reasoning_content?: string | null // Beta功能，nullable
}

interface ToolMessage {
    role: 'tool'
    content: string
    tool_call_id: string // 必需字段
}

export type DSChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage

// DS chat request
interface Tool {
    type: 'function'
    function: object
}

type ToolChoice = 'none' | 'auto' | 'required'

export interface DSChatRequest {
    messages: DSChatMessage[]
    model: DeepSeekChatModel
    frequency_penalty?: number
    max_tokens?: number
    presence_penalty?: number
    response_format?: 'text' | 'json_object'
    stop?: string | string[]
    stream?: boolean
    stream_options?: { include_usage: boolean }
    temperature?: number
    top_p?: number
    tools?: Tool[]
    tool_choice?: ToolChoice
    logprobs?: boolean
    top_logprobs?: number
}

// DS Chat response

interface ToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

interface Delta {
    role: 'assistant'
    content?: string | null
    reasoning_content?: string | null
}

interface Message {
    role: 'assistant'
    content: string | null
    reasoning_content?: string | null // 仅针对deepseek-reasoner模型
    tool_calls?: ToolCall[]
}

interface LogProbContent {
    token: string
    logprob: number
    bytes: number[] | null
}

interface LogProbs {
    content: LogProbContent[] | null
    top_logprobs: LogProbContent[]
}

interface Choice {
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'insufficient_system_resource'
    index: number
    message?: Message // 可选字段
    delta?: Delta // 可选字段
    logprobs?: LogProbs | null // 可为null
}

interface Usage {
    completion_tokens: number
    prompt_tokens: number
    prompt_cache_hit_tokens: number
    prompt_cache_miss_tokens: number
    total_tokens: number
    completion_tokens_details?: {
        reasoning_tokens: number
    }
}

export interface DSChatResponse {
    id: string
    choices: Choice[]
    created: number // Unix时间戳
    model: string
    system_fingerprint: string
    object: 'chat.completion'
    usage?: Usage // 可选
}
