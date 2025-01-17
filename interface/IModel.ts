/** @format */

import {
    EmbedModel,
    ChatModel,
    ChatRoleEnum,
    ModelProvider,
    ImagineModel,
    ChatModelProvider,
    ImagineModelProvider,
    ImgTaskType,
    ModelModel,
    EmbedModelProvider
} from './Enum'

export interface ChatMessage {
    role: ChatRoleEnum
    content: string
    img?: string // url or base64
    tool?: string // tool_call_id
}

export interface EmbeddingResponse {
    embedding: number[][]
    model: EmbedModel
    object: 'embedding'
    promptTokens: number
    totalTokens: number
}

export interface ChatResponse {
    content: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    model: ChatModel | string
    object: string
    tools?: {
        id?: string
        function?: {
            arguments?: string
            name?: string
        }
        type?: string
    }[]
}

export interface ChatOption {
    stream?: boolean
    provider?: ChatModelProvider
    model?: ChatModel
    top?: number
    temperature?: number
    maxLength?: number
    tools?: {
        type: string
        [key: string]: any
    }[]
    toolChoice?: string
}

export interface EmbedOption {
    provider?: EmbedModelProvider
    model?: EmbedModel
    dimensions?: number
}

export type ModelList = Provider[]

export interface Provider {
    provider: keyof typeof ModelProvider
    value: ModelProvider
    models: ModelModel[]
}

export interface ImagineOption {
    provider?: ImagineModelProvider
    model?: ImagineModel
    negativePrompt?: string
    height?: number
    width?: number
    num?: number
}

export interface ImagineResponse {
    taskId: string
    time: number
}

export interface TaskResponse {
    id: string
    type: ImgTaskType
    imgs: string[]
    info: string
    fail: string
    progress: number
    created: number
    model: ImagineModel
}
