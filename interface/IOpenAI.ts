/** @format */

import {
    ChatCompletion,
    ChatCompletionChunk,
    EmbeddingCreateParams,
    CreateEmbeddingResponse,
    ImageGenerateParams,
    ImagesResponse,
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionCreateParamsStreaming,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
    ChatCompletionAssistantMessageParam,
    ChatCompletionToolMessageParam,
    ChatCompletionDeveloperMessageParam
} from 'openai/resources'

export interface GPTChatResponse extends ChatCompletion {}
export interface GPTChatStreamResponse extends ChatCompletionChunk {}

export interface OpenAIEmbedRequest extends EmbeddingCreateParams {}
export interface OpenAIEmbedResponse extends CreateEmbeddingResponse {}

export interface GPTChatRequest extends ChatCompletionCreateParamsNonStreaming {}
export interface GPTChatStreamRequest extends ChatCompletionCreateParamsStreaming {}

export interface OpenAIImagineRequest extends ImageGenerateParams {}
export interface OpenAIImagineResponse extends ImagesResponse {}

// equal to original ChatCompletionMessage
export type GPTChatMessage =
    | ChatCompletionSystemMessageParam
    | ChatCompletionUserMessageParam
    | ChatCompletionAssistantMessageParam
    | ChatCompletionToolMessageParam
    | ChatCompletionDeveloperMessageParam

export type GPTImagineSize = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | null
