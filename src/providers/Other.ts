/**
 * Other.ts - A class for accessing the Other model's chat and embedding functionality.
 * Such as models from hugging face, text2vec
 *
 * @format by prettier
 * @author devilyouwei
 */

import { decodeStream } from 'iconv-lite'
import { PassThrough, Readable } from 'stream'
import EventSourceStream from '@server-sent-stream/node'
import { OtherEmbedRequest, OtherEmbedResponse } from '../../interface/IOther'
import { ChatModel, ChatRoleEnum, OtherEmbedModel } from '../../interface/Enum'
import { ChatMessage, ChatResponse, EmbeddingResponse } from '../../interface/IModel'
import $ from '../util'
import {
    GPTChatMessage,
    GPTChatRequest,
    GPTChatResponse,
    GPTChatStreamRequest,
    GPTChatStreamResponse
} from '../../interface/IOpenAI'
import { ChatCompletionTool, ChatCompletionToolChoiceOption } from 'openai/resources'

export default class Other {
    private api?: string
    private key?: string | string[]

    /**
     * Constructor for the OpenAI class.
     *
     * @param api - The API endpoint for the model (optional).
     * @param key - The API key for the model (Optional).
     */
    constructor(api?: string, key?: string | string[]) {
        this.api = api
        this.key = key
    }

    /**
     * Fetches embeddings for a prompt.
     *
     * @param prompt - An array of input prompts.
     * @param model - The type of the embed model (default is OtherEmbedModel.LARGE_CHN).
     * @returns A promise resolving to the embedding response.
     */
    async embedding(prompt: string[], model: OtherEmbedModel = OtherEmbedModel.LARGE_CHN): Promise<EmbeddingResponse> {
        if (!this.api) throw new Error('Other embed model API is not set in config')

        const res = await $.post<OtherEmbedRequest, OtherEmbedResponse>(`${this.api}/embedding`, { prompt, model })
        return { embedding: res.data, model, object: 'embedding', promptTokens: 0, totalTokens: 0 } as EmbeddingResponse
    }

    /**
     * Sends messages to the GPT compatible chat model.
     *
     * @param messages - An array of chat messages.
     * @param model - The model to use for chat (default: gpt-3.5-turbo).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: ChatModel = ChatModel.GPT3,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number,
        tools?: ChatCompletionTool[],
        toolChoice?: ChatCompletionToolChoiceOption
    ) {
        if (!this.api) throw new Error('Other chat model API is not set in config')
        const key = Array.isArray(this.key) ? $.getRandomKey(this.key) : this.key

        const res = await $.post<GPTChatRequest | GPTChatStreamRequest, Readable | GPTChatResponse>(
            `${this.api}/v1/chat/completions`,
            {
                model,
                messages: this.formatMessage(messages),
                stream,
                temperature,
                top_p: top,
                max_tokens: maxLength,
                tools,
                tool_choice: toolChoice
            },
            { headers: { Authorization: `Bearer ${key}` }, responseType: stream ? 'stream' : 'json' }
        )

        const data: ChatResponse = {
            content: '',
            model,
            object: '',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
        }

        if (res instanceof Readable) {
            const output = new PassThrough()
            const parser = new EventSourceStream()

            parser.on('data', (e: MessageEvent) => {
                const obj = $.json<GPTChatStreamResponse>(e.data)
                if (obj) {
                    data.content = obj.choices[0]?.delta?.content || ''
                    if (obj.choices[0]?.delta?.tool_calls) data.tools = obj.choices[0]?.delta?.tool_calls
                    data.model = obj.model || model
                    data.object = obj.object || 'chat.completion.chunk'
                    data.promptTokens = obj.usage?.prompt_tokens || 0
                    data.completionTokens = obj.usage?.completion_tokens || 0
                    data.totalTokens = obj.usage?.total_tokens || 0
                    output.write(JSON.stringify(data))
                }
            })
            parser.on('error', e => output.destroy(e))
            parser.on('end', () => output.end())

            res.pipe(decodeStream('utf-8')).pipe(parser)
            return output as Readable
        } else {
            data.content = res.choices[0]?.message?.content || null
            if (res.choices[0]?.message?.tool_calls) data.tools = res.choices[0]?.message?.tool_calls
            data.model = res.model || model
            data.object = res.object || 'chat.completion'
            data.promptTokens = res.usage?.prompt_tokens || 0
            data.completionTokens = res.usage?.completion_tokens || 0
            data.totalTokens = res.usage?.total_tokens || 0
            return data
        }
    }

    /**
     * Formats chat messages according to the GPT model's message format.
     *
     * @param messages - An array of chat messages.
     * @returns Formatted messages compatible with the GPT model.
     */
    private formatMessage(messages: ChatMessage[]) {
        const prompt: GPTChatMessage[] = []

        for (const { role, content, img, tool } of messages) {
            // with image
            switch (role) {
                case ChatRoleEnum.USER:
                    if (img)
                        prompt.push({
                            role,
                            content: [
                                { type: 'text', text: content },
                                { type: 'image_url', image_url: { url: img } }
                            ]
                        })
                    else prompt.push({ role, content })
                    break
                case ChatRoleEnum.TOOL:
                    prompt.push({
                        role,
                        content,
                        tool_call_id: tool || ''
                    })
                    break
                default:
                    prompt.push({ role, content })
                    break
            }
        }

        return prompt
    }
}
