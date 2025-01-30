/** @format */

import { ChatCompletionContentPart } from 'openai/resources'
import { GLMChatModel, GLMEmbedModel } from './Enum'

export interface GLMChatRequest {
    model?: GLMChatModel
    messages: GLMChatMessage[]
    stream?: boolean
    temperature?: number
    top_p?: number
    max_tokens?: number
    request_id?: string
    do_sample?: boolean
    stop?: string[]
    tools?: GLMTool[]
    tool_choice?: GLMToolChoice
}

export type GLMToolChoice = 'auto'

export interface GLMEmbedRequest {
    model: GLMEmbedModel
    input: string | string[]
    dimensions?: number
}

export interface GLMEmbedResponse {
    model: string
    data: {
        index: number
        object: string
        embedding: number[]
    }[]
    index: number
    object: string
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

interface SystemMessage {
    role: 'system'
    content: string
}

interface UserMessage {
    role: 'user'
    content: string | Array<ChatCompletionContentPart>
}

interface AssistantMessage {
    role: 'assistant'
    content?: string
    tool_calls?: ToolCall[]
}

interface ToolCall {
    id: string
    type: 'web_search' | 'retrieval' | 'function'
    function?: FunctionToolCall
}

interface FunctionToolCall {
    name: string
    arguments: string // JSON 格式的参数列表
}

interface ToolMessage {
    role: 'tool'
    content: string
    tool_call_id: string
}

export type GLMChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage

export interface GLMTool {
    type: 'function' | 'retrieval' | 'web_search'
    function?: FunctionTool
    retrieval?: RetrievalTool
    web_search?: WebSearchTool
}

interface FunctionTool {
    name: string
    description: string
    parameters?: {
        type: string
        properties: object
        required?: string[]
    }
}

interface RetrievalTool {
    knowledge_id: string
    prompt_template?: string
}

interface WebSearchTool {
    enable?: boolean
    search_query?: string
    search_result?: boolean
}

// Stream response

export interface GLMChatResponse {
    id: string
    model: string
    object?: string
    created: number
    choices: Choice[]
    usage: Usage
    web_search?: WebSearch[]
}

interface Choice {
    index: number
    finish_reason: 'stop' | 'tool_calls' | 'length' | 'sensitive' | 'network_error'
    delta?: Message
    message?: Message
}

interface Message {
    role: 'assistant'
    content: string | null
    tool_calls?: object[]
}

interface Usage {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
}

interface WebSearch {
    icon: string
    title: string
    link: string
    media: string
    content: string
}
