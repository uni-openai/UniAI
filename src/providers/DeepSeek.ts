/** @format */

import { PassThrough, Readable } from 'stream'
import EventSourceStream from '@server-sent-stream/node'
import { decodeStream } from 'iconv-lite'
import { ChatRoleEnum, DeepSeekChatModel } from '../../interface/Enum'
import { ChatMessage, ChatResponse } from '../../interface/IModel'
import $ from '../util'
import { DSChatMessage, DSChatRequest, DSChatResponse } from '../../interface/IDeepSeek'

const API = 'https://api.deepseek.com'

export default class DeepSeek {
    private key?: string | string[]
    private api?: string

    /**
     * Constructor for MoonShot class.
     * @param key - The API key for MoonShot.
     * @param api - The API endpoint for proxy (optional).
     */
    constructor(key?: string | string[], api: string = API) {
        this.key = key
        this.api = api
    }

    /**
     * Sends messages to the Ali QianWen chat model.
     *
     * @param messages - An array of chat messages.
     * @param model - The model to use for chat (default: moonshot-v1-8k).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: DeepSeekChatModel = DeepSeekChatModel.DEEPSEEK_V3,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number
    ) {
        // if (!Object.values(AliChatModel).includes(model)) throw new Error('Qian Wen chat model not found')

        const key = Array.isArray(this.key) ? $.getRandomKey(this.key) : this.key
        if (!key) throw new Error('DeepSeek API key is not set in config')

        if (typeof maxLength === 'number') {
            if (maxLength < 1) maxLength = 1
            if (maxLength > 8192) maxLength = 8192
        }

        // temperature is float in [0,1]
        if (typeof temperature === 'number') {
            if (temperature < 0) temperature = 0
            if (temperature > 2) temperature = 2
        }
        // top is float in [0,1]
        if (typeof top === 'number') {
            if (top <= 0) top = 0.1
            if (top > 1) top = 1.0
        }

        const res = await $.post<DSChatRequest, Readable | DSChatResponse>(
            `${this.api}/chat/completions`,
            {
                model,
                messages: this.formatMessage(messages),
                stream,
                temperature,
                top_p: top,
                max_tokens: maxLength
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
                const obj = $.json<DSChatResponse>(e.data)
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
        const prompt: DSChatMessage[] = []

        for (const { role, content, tool } of messages) {
            // DeepSeek not support develop role
            if (role === ChatRoleEnum.DEV) continue
            else if (role === ChatRoleEnum.TOOL) prompt.push({ role, content, tool_call_id: tool! })
            // DeepSeek not support image, only text
            else prompt.push({ role, content })
        }

        return prompt
    }
}
