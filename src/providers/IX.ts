/**
 * Utility for connecting to the OpenAI model API.
 *
 * @format prettier
 * @author devilyouwei
 */

import { PassThrough, Readable } from 'stream'
import EventSourceStream from '@server-sent-stream/node'
import { decodeStream } from 'iconv-lite'
import { ChatRoleEnum, XAIChatModel } from '../../interface/Enum'
import { ChatMessage, ChatResponse } from '../../interface/IModel'
import {
    GrokChatMessage,
    GrokChatRequest,
    GrokChatResponse,
    GrokChatResponseChunk,
    GrokTool,
    GrokToolChoice
} from '../../interface/IX'
import $ from '../util'

const API = 'https://api.x.ai'
const VER = 'v1'

export default class XAI {
    private api: string
    private key?: string | string[]

    /**
     * Constructor for the OpenAI class.
     *
     * @param key - The API key for OpenAI.
     * @param api - The API endpoint for proxy (optional).
     */
    constructor(key?: string | string[], api: string = API) {
        this.key = key
        this.api = api
    }

    /**
     * Sends messages to the GPT chat model.
     *
     * @param messages - An array of chat messages.
     * @param model - The model to use for chat (default: gpt-3.5-turbo).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @param tools - Tools for model to use (optional).
     * @param toolChoice - Controls which (if any) tool is called by the model: none, required, auto (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: XAIChatModel = XAIChatModel.GROK2,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number,
        tools?: GrokTool[],
        toolChoice?: GrokToolChoice
    ) {
        const key = Array.isArray(this.key) ? $.getRandomKey(this.key) : this.key
        if (!key) throw new Error('X AI API key is not set in config')

        // remove imgs for not vision model
        if (![XAIChatModel.GROK2_VISION].includes(model))
            messages = messages.map(({ role, content }) => ({ role, content }))

        // temperature is float in [0,1]
        if (typeof temperature === 'number') {
            if (temperature < 0) temperature = 0
            if (temperature > 2) temperature = 2
        }
        // top is float in [0,1]
        if (typeof top === 'number') {
            if (top < 0) top = 0
            if (top > 1) top = 1
        }

        const res = await $.post<GrokChatRequest, Readable | GrokChatResponse>(
            `${this.api}/${VER}/chat/completions`,
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
                const obj = $.json<GrokChatResponseChunk>(e.data)
                if (obj) {
                    data.content = obj.choices[0]?.delta?.content || ''
                    data.model = obj.model
                    data.object = obj.object
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
            data.content = res.choices[0]?.message?.content || ''
            if (res.choices[0]?.message?.tool_calls) data.tools = res.choices[0]?.message?.tool_calls
            data.model = res.model
            data.object = res.object
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
        const prompt: GrokChatMessage[] = []

        for (const { role, content, img } of messages) {
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
                case ChatRoleEnum.ASSISTANT || ChatRoleEnum.SYSTEM:
                    prompt.push({ role, content })
                    break
                default:
                    break
            }
        }

        return prompt
    }
}
