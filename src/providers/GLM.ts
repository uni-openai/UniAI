/** @format */

import jwt from 'jsonwebtoken'
import { PassThrough, Readable } from 'stream'
import EventSourceStream from '@server-sent-stream/node'
import { decodeStream } from 'iconv-lite'
import {
    GLMChatMessage,
    GLMChatRequest,
    GLMChatResponse,
    GLMEmbedRequest,
    GLMEmbedResponse,
    GLMTokenCache
} from '../../interface/IGLM'
import { ChatRoleEnum, GLMChatModel, GLMEmbedModel } from '../../interface/Enum'
import { ChatMessage, ChatResponse, EmbeddingResponse } from '../../interface/IModel'
import $ from '../util'
import { AxiosHeaders } from 'axios'

const EXPIRE = 3 * 60 * 1000
const API = 'https://open.bigmodel.cn'
const STORAGE_KEY = 'glm'

export default class GLM {
    private key?: string | string[]
    private localAPI?: string
    private proxyAPI: string

    constructor(key?: string | string[], localAPI?: string, proxyAPI: string = API) {
        this.key = key
        this.localAPI = localAPI
        this.proxyAPI = proxyAPI
    }

    /**
     * Fetches embeddings for input text.
     *
     * @param input - An array of input strings.
     * @param model - The model to use for embeddings (default: text-embedding-ada-002).
     * @returns A promise resolving to the embedding response.
     */
    async embedding(input: string[], model: GLMEmbedModel = GLMEmbedModel.EMBED_2, dimensions = 1024) {
        const url = `${this.proxyAPI || API}/api/paas/v4/embeddings`
        const headers = new AxiosHeaders()
        const key = Array.isArray(this.key) ? $.getRandomKey(this.key) : this.key
        if (!key) throw new Error('ZhiPu GLM API key is not set in config')
        headers['Authorization'] = this.generateToken(key)

        const res = await $.post<GLMEmbedRequest, GLMEmbedResponse>(url, { model, input, dimensions }, { headers })

        return {
            embedding: res.data.map(v => v.embedding),
            object: 'embedding',
            model,
            promptTokens: res.usage.prompt_tokens,
            totalTokens: res.usage.total_tokens
        } as EmbeddingResponse
    }

    /**
     * Sends messages to the GLM chat model.
     *
     * @param messages - An array of chat messages.
     * @param model - The model to use for chat (default: GLM_6B a local deployed chatglm3-6b-32k).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: GLMChatModel = GLMChatModel.GLM_6B,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number
    ) {
        // filter images
        if (![GLMChatModel.GLM_4V, GLMChatModel.GLM_4V_PLUS].includes(model))
            messages = messages.map(({ role, content }) => ({ role, content }))

        // temperature is float in (0,1]
        if (typeof temperature === 'number') {
            if (temperature <= 0) temperature = 0.1
            if (temperature > 1) temperature = 1
        }
        // top is float in (0,1)
        if (typeof top === 'number') {
            if (top <= 0) top = 0.1
            if (top >= 1) top = 0.9
        }

        const data: ChatResponse = {
            content: '',
            model,
            object: '',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
        }

        // ZhiPu GLM official API
        let url = `${this.proxyAPI}/api/paas/v4/chat/completions`
        const headers = new AxiosHeaders()
        if ([GLMChatModel.GLM_6B, GLMChatModel.GLM_9B].includes(model)) {
            // use local deployed open source GLM API, 6B and 9B
            if (!this.localAPI) throw new Error('Local GLM API is not set in config')
            url = `${this.localAPI}/chat`
        } else {
            const key = Array.isArray(this.key) ? $.getRandomKey(this.key) : this.key
            if (!key) throw new Error('ZhiPu GLM API key is not set in config')
            headers['Authorization'] = this.generateToken(key)
        }

        const res = await $.post<GLMChatRequest, Readable | GLMChatResponse>(
            url,
            { model, messages: this.formatMessage(messages), stream, temperature, top_p: top, max_tokens: maxLength },
            { headers, responseType: stream ? 'stream' : 'json' }
        )
        if (res instanceof Readable) {
            const output = new PassThrough()
            const parser = new EventSourceStream()

            parser.on('data', (e: MessageEvent) => {
                const obj = $.json<GLMChatResponse>(e.data)
                if (obj) {
                    data.content = obj.choices[0].delta?.content || ''
                    data.model = obj.model
                    data.object = obj.object || 'chat.completion.chunk'
                    data.promptTokens = obj.usage?.prompt_tokens || 0
                    data.completionTokens = obj.usage?.completion_tokens || 0
                    data.totalTokens = obj.usage?.total_tokens || 0
                    if (data.content) output.write(JSON.stringify(data))
                }
            })

            parser.on('error', e => output.destroy(e))
            parser.on('end', () => output.end())

            res.pipe(decodeStream('utf-8')).pipe(parser)
            return output as Readable
        } else {
            data.content = res.choices[0].message?.content || ''
            data.model = res.model
            data.object = res.object || 'chat.completion'
            data.promptTokens = res.usage?.prompt_tokens || 0
            data.completionTokens = res.usage?.completion_tokens || 0
            data.totalTokens = res.usage?.total_tokens || 0
            return data
        }
    }

    /**
     * Generates a JWT token for authorization.
     *
     * @param key - The API key.
     * @param expire - Token expiration time in milliseconds.
     * @returns The generated JWT token.
     */
    private generateToken(key: string, expire: number = EXPIRE) {
        const [id, secret] = key.split('.')
        const timestamp = Date.now()

        // check existed token cache
        const cache = $.getItem<GLMTokenCache>(STORAGE_KEY)
        if (cache && timestamp - cache.timestamp < expire) return cache.token

        /// @ts-ignore
        const token = jwt.sign({ api_key: id, timestamp, exp: timestamp + expire }, secret, {
            header: { alg: 'HS256', sign_type: 'SIGN' }
        })

        $.setItem(STORAGE_KEY, { token, timestamp })
        return token
    }

    /**
     * Formats chat messages according to the GLM model's message format.
     *
     * @param messages - An array of chat messages.
     * @returns Formatted messages compatible with the GLM model.
     */
    private formatMessage(messages: ChatMessage[]) {
        const prompt: GLMChatMessage[] = []

        for (const { role, content, img } of messages) {
            // GLM not support function role
            if (role === ChatRoleEnum.FUNCTION) continue

            // with image
            if (img) {
                if (!img.startsWith('http')) throw new Error('Invalid img HTTP URL')
                prompt.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: content },
                        { type: 'image_url', image_url: { url: img } }
                    ]
                })
            }
            // only text
            else prompt.push({ role, content })
        }

        return prompt
    }
}
