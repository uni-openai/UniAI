/** @format */

import { PassThrough, Readable } from 'stream'
import EventSourceStream from '@server-sent-stream/node'
import { decodeStream } from 'iconv-lite'
import {
    BaiduAccessTokenRequest,
    BaiduAccessTokenResponse,
    BaiduChatMessage,
    BaiduChatRequest,
    BaiduChatResponse
} from '../../interface/IBaidu'
import { BaiduChatModel, ChatRoleEnum } from '../../interface/Enum'
import { ChatMessage, ChatResponse } from '../../interface/IModel'
import $ from '../util'

const API = 'https://aip.baidubce.com'
const STORAGE_KEY = 'baidu'

export default class Baidu {
    private key?: string
    private secret?: string
    private api?: string

    constructor(key?: string, secret?: string, api: string = API) {
        this.key = key
        this.secret = secret
        this.api = api
    }
    /**
     * Sends messages to the GLM chat model.
     *
     * @param messages - An array of chat messages.
     * @param model - The submodel to use for chat (default: ERNIE 8K).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: BaiduChatModel = BaiduChatModel.ERNIE_3_5,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number
    ) {
        // temperature is float in (0,1]
        if (typeof temperature === 'number') {
            if (temperature <= 0) temperature = 0.1
            if (temperature > 1) temperature = 1
        }
        // top is float in [0,1]
        if (typeof top === 'number') {
            if (top < 0) top = 0
            if (top > 1) top = 1
        }

        const token = await this.getAccessToken()

        const res = await $.post<BaiduChatRequest, BaiduChatResponse | Readable>(
            `${this.api}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${model}?access_token=${token}`,
            {
                messages: this.formatMessage(messages),
                system: messages[0]?.role === ChatRoleEnum.SYSTEM ? messages[0].content : '',
                stream,
                temperature,
                top_p: top,
                max_output_tokens: maxLength
            },
            { responseType: stream ? 'stream' : 'json' }
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
            parser.on('data', (e: MessageEvent<string>) => {
                const obj = $.json<BaiduChatResponse>(e.data)
                if (obj) {
                    data.content = obj.result || ''
                    data.model = model
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
            if (res.error_code) throw new Error(res.error_msg)
            data.content = res.result || null
            data.model = model
            data.object = res.object
            data.promptTokens = res.usage?.prompt_tokens || 0
            data.completionTokens = res.usage?.completion_tokens || 0
            data.totalTokens = res.usage?.total_tokens || 0
            return data
        }
    }

    // get baidu access token
    private async getAccessToken() {
        if (!this.key) throw new Error('Baidu API key is not set in config')
        if (!this.secret) throw new Error('Baidu API secret is not set in config')

        const now = Date.now()

        // load access token
        const cache = $.getItem<BaiduAccessTokenResponse>(STORAGE_KEY)
        if (cache && cache.expires_in > now) return cache.access_token

        // get new access token
        const res = await $.get<BaiduAccessTokenRequest, BaiduAccessTokenResponse>(`${this.api}/oauth/2.0/token`, {
            grant_type: 'client_credentials',
            client_id: this.key,
            client_secret: this.secret
        })
        if (res.error) throw new Error(res.error_description)

        res.expires_in = now + res.expires_in * 1000

        $.setItem(STORAGE_KEY, res)

        return res.access_token
    }

    // format to baidu message
    private formatMessage(messages: ChatMessage[]) {
        const prompt: BaiduChatMessage[] = []
        let input = ''
        const { USER, ASSISTANT, SYSTEM } = ChatRoleEnum
        for (const { role, content } of messages) {
            if (!content.trim() || role === SYSTEM) continue
            if (role !== ASSISTANT) input += `\n${content}`
            else {
                prompt.push({ role: USER, content: input.trim() || ' ' })
                prompt.push({ role: ASSISTANT, content })
                input = ''
            }
        }
        if (!input.trim()) throw new Error('User input nothing')
        prompt.push({ role: USER, content: input.trim() })
        return prompt
    }
}
