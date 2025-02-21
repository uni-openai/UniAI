/** @format */

import { XAIChatModel } from './Enum'

// 图像URL内容
interface ImageUrlContent {
    url: string // 支持data:image/jpeg;base64格式
    detail?: 'high' | 'low' // 可选的detail字段，示例中为"high"
}

// 消息内容类型
interface MessageContentText {
    type: 'text'
    text: string
}

interface MessageContentImage {
    type: 'image_url'
    image_url: ImageUrlContent
}

type MessageContent = MessageContentText | MessageContentImage

// 单条消息
export interface GrokChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: MessageContent[] | string // 支持数组或简单字符串
}

// Response Format的相关类型
interface ResponseFormatText {
    type: 'text'
}

interface ResponseFormatJson {
    type: 'json_object'
}

interface ResponseFormatJsonSchema {
    type: 'json_schema'
    json_schema: Record<string, any>
}

type ResponseFormat = ResponseFormatText | ResponseFormatJson | ResponseFormatJsonSchema

// Tool相关的类型
interface ToolFunction {
    type: 'function'
    function: {
        name: string
    }
}

export interface GrokTool {
    type: 'function'
    function: Record<string, any> // JSON-schema格式的function定义
}

export type GrokToolChoice = 'none' | 'auto' | 'required' | ToolFunction

// Stream选项
interface StreamOptions {
    include_usage: boolean
}

// 主请求接口
export interface GrokChatRequest {
    messages: GrokChatMessage[] // 必需
    model: XAIChatModel // 必需

    // 可选参数
    deferred?: boolean | null
    frequency_penalty?: number | null // -2 到 2
    logit_bias?: Record<string, number> | null // token ID到bias值的映射
    logprobs?: boolean | null
    max_tokens?: number | null // 默认16384
    n?: number | null // 默认1，最小1
    presence_penalty?: number | null // -2 到 2
    response_format?: ResponseFormat | null
    seed?: number | null
    stop?: string[] | null // 最多4个停止序列
    stream?: boolean | null // 默认false
    stream_options?: StreamOptions | null
    temperature?: number | null // 0 到 2，默认1
    tool_choice?: GrokToolChoice | null
    tools?: GrokTool[] | null // 最多128个工具
    top_logprobs?: number | null // 0 到 8
    top_p?: number | null // 0 到 1，默认1
    user?: string | null // 用户标识符
}

export interface GrokChatResponse {
    id: string
    object: 'chat.completion'
    created: number
    model: string
    choices: Array<{
        index: number
        message: ChoiceMessage
        finish_reason: string
    }>
    usage: Usage
    system_fingerprint: string
}

// Delta内容
interface ChoiceDelta {
    role?: 'assistant' // 示例中显示为"assistant"
    content?: string // 部分内容，可能为空
}

interface ChoiceMessage {
    role: 'assistant' // 示例中显示为"assistant"
    content: string // 部分内容，可能为空
    tool_calls?: Array<{
        id: string
        function: {
            name: string
            arguments: string
        }
        type: string
    }>
    refusal: string | null // 拒绝内容，可能为空
}

// Choice对象
interface Choice {
    index: number // 选项索引
    delta: ChoiceDelta // 增量内容
}

// Prompt Tokens详情
interface PromptTokensDetails {
    text_tokens: number
    audio_tokens: number
    image_tokens: number
    cached_tokens: number
}

// Usage统计
interface Usage {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details: PromptTokensDetails
}

// 主响应接口（chunk形式）
export interface GrokChatResponseChunk {
    id: string // 完成ID
    object: 'chat.completion.chunk' // 对象类型
    created: number // 创建时间戳
    model: string // 模型名称
    choices: Choice[] // 选项数组
    usage: Usage // 使用统计
    system_fingerprint: string // 系统指纹
}
