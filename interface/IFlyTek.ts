/** @format */

import { IFlyTekChatModel } from './Enum'

export interface SPKImagineRequest {
    header: {
        app_id: string
        uid?: string
    }
    parameter: {
        chat: {
            domain: string
            width: number
            height: number
        }
    }
    payload: {
        message: {
            text: {
                role: string
                content: string
            }[]
        }
    }
}

// 错误码	错误信息
// 0	成功
// 10003	用户的消息格式有错误
// 10004	用户数据的schema错误
// 10005	用户参数值有错误
// 10008	服务容量不足
// 10021	输入审核不通过
// 10022	模型生产的图片涉及敏感信息，审核不通过

export interface SPKImagineResponse {
    header: {
        code: number
        message: string
        sid: string
        status: number
    }
    payload?: {
        choices: {
            status: number
            seq: number
            text: [
                {
                    content: string
                    index: number
                    role: string
                }
            ]
        }
    }
}

export interface SPKTool {
    type: 'function' | 'web_search'
    function?: FunctionTool
    web_search?: WebSearchTool
}

interface FunctionTool {
    name: string
    description?: string
    parameters?: object
}

interface WebSearchTool {
    enable?: boolean
    show_ref_label?: boolean
}

interface SystemMessage {
    role: 'system'
    content: string
}

interface UserMessage {
    role: 'user'
    content: string
}

interface AssistantMessage {
    role: 'assistant'
    content: string
}
interface ToolMessage {
    role: 'tool'
    content: string
}

export type SPKChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage
/**
 * Request Parameters
 */
export interface SparkChatRequest {
    model: IFlyTekChatModel
    user?: string // Unique user ID
    messages: SPKChatMessage[]
    temperature?: number // Sampling threshold, range [0, 2], default 1.0
    top_k?: number // Number of candidates to randomly select from, range [1, 6], default 4
    top_p?: number // Probability threshold for sampling, range (0, 1], default 1
    presence_penalty?: number // Penalty for repetition, range [-2.0, 2.0], default 0
    frequency_penalty?: number // Penalty for frequency, range [-2.0, 2.0], default 0
    stream?: boolean // Whether to stream the response, default false
    max_tokens?: number // Maximum tokens, range [1, 4096] for Lite/Pro-128K, [1, 8192] for others
    response_format?: { type: 'text' | 'json_object' }
    tools?: SPKTool[] // List of tools
    tool_choice?: SPKToolChoice // Tool invocation strategy
    suppress_plugin?: string[] // List of disabled plugins
}
export type SPKToolChoice = 'auto' | 'none' | 'required'

// ==================== Response Section ====================

/**
 * Non-Streaming Response
 */
export interface SparkChatResponse {
    code: number // Error code
    message: string // Error message
    sid: string // Unique request ID
    choices: Array<{
        message?: {
            role: 'assistant' // Role
            content: string | null // Content
            tool_calls?: object[]
        }
        delta?: {
            role: 'assistant' // Role
            content: string | null // Content
            tool_calls?: object[]
        }
        index: number // Result index
        finish_reason: string
    }>
    usage?: {
        prompt_tokens: number // Input tokens
        completion_tokens: number // Output tokens
        total_tokens: number // Total tokens
    }
}
