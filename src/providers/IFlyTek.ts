/** @format */

import { createHmac } from 'crypto'
import { hostname } from 'os'
import { PassThrough, Readable } from 'stream'
import EventSourceStream from '@server-sent-stream/node'
import { decodeStream } from 'iconv-lite'
import { ChatMessage, ChatResponse, TaskResponse } from '../../interface/IModel'
import {
    SparkChatRequest,
    SparkChatResponse,
    SPKChatMessage,
    SPKImagineRequest,
    SPKImagineResponse,
    SPKTool,
    SPKToolChoice
} from '../../interface/IFlyTek'
import { ChatRoleEnum, IFlyTekChatModel, IFlyTekImagineModel, SPKTaskType } from '../../interface/Enum'
import $ from '../util'

const CHAT_API = 'https://spark-api-open.xf-yun.com'
const IMAGINE_API = 'https://spark-api.cn-huabei-1.xf-yun.com'
const STORAGE_KEY = 'task_iflytek'

export default class IFlyTek {
    private pass?: string | string[]
    private key?: string
    private secret?: string
    private appid?: string
    private api?: string

    /**
     * Constructor for IFlyTek class.
     * @param key - The API key for MoonShot.
     * @param api - The API endpoint for proxy (optional).
     */
    constructor(pass?: string | string[], key?: string, secret?: string, appid?: string, api: string = CHAT_API) {
        this.pass = pass
        this.key = key
        this.secret = secret
        this.appid = appid
        this.api = api
    }

    /**
     * Initiates a chat conversation with IFLYTEK Spark API.
     *
     * @param messages - An array of chat messages.
     * @param model - The Spark model version to use (default: SPARK_DEFAULT_MODEL_VERSION).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: IFlyTekChatModel = IFlyTekChatModel.SPARK_LITE,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number,
        tools?: SPKTool[],
        toolChoice?: SPKToolChoice
    ) {
        const key = Array.isArray(this.pass) ? $.getRandomKey(this.pass) : this.pass
        if (!key) throw new Error('IFlyTek Spark API Password is not set in config')

        // top is integer in [1,6]
        if (typeof top === 'number') {
            if (top <= 0) top = 0.1
            if (top > 1) top = 1
        }
        // temperature is float in (0,1]
        if (typeof temperature === 'number') {
            if (temperature < 0) temperature = 0
            if (temperature > 2) temperature = 2
        }

        const res = await $.post<SparkChatRequest, Readable | SparkChatResponse>(
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
                const obj = $.json<SparkChatResponse>(e.data)
                if (obj) {
                    data.content = obj.choices[0]?.delta?.content || ''
                    if (obj.choices[0]?.delta?.tool_calls) data.tools = obj.choices[0]?.delta?.tool_calls
                    data.model = model
                    data.object = 'chat.completion.chunk'
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
            data.model = model
            data.object = 'chat.completion'
            data.promptTokens = res.usage?.prompt_tokens || 0
            data.completionTokens = res.usage?.completion_tokens || 0
            data.totalTokens = res.usage?.total_tokens || 0
            return data
        }
    }

    /**
     * Generate an image based on the given prompt.
     * @param prompt The prompt for image generation.
     * @param width The width of the image, default is 512.
     * @param height The height of the image, default is 512.
     * @param model The model to use for generating the image, default is IFlyTekImagineModel.V2.
     */
    async imagine(
        prompt: string,
        width: number = 512,
        height: number = 512,
        model: IFlyTekImagineModel = IFlyTekImagineModel.V2
    ) {
        if (!this.appid) throw new Error('IFlyTek APP ID is not set in config')
        // get specific generated URL
        const url = this.getImagineURL(model)
        const res = await $.post<SPKImagineRequest, SPKImagineResponse>(url, {
            header: { app_id: this.appid },
            payload: { message: { text: [{ role: 'user', content: prompt }] } },
            parameter: { chat: { domain: 'general', width, height } }
        })
        if (res.header.code !== 0) throw new Error(res.header.message)
        if (!res.payload) throw new Error('Fail to generate image, empty payload')

        const id = $.getRandomId()
        const imgs: string[] = []
        for (const i in res.payload.choices.text)
            imgs.push(await $.writeFile(res.payload.choices.text[i].content, `${id}-${i}.png`))

        const time = Date.now()
        const task: TaskResponse = {
            id,
            type: SPKTaskType.GENERATION,
            info: 'success',
            progress: 100,
            imgs,
            fail: '',
            created: time,
            model
        }

        const tasks: TaskResponse[] = $.getItem(STORAGE_KEY) || []
        tasks.push(task)
        $.setItem(STORAGE_KEY, tasks)
        return { taskId: task.id, time }
    }

    /**
     * Simulate tasks.
     *
     * @param id - The task ID to retrieve (optional).
     * @returns An array of task responses or a specific task by ID.
     */
    task(id?: string) {
        const tasks: TaskResponse[] = $.getItem(STORAGE_KEY) || []

        if (id) return tasks.filter(v => v.id === id)
        else return tasks
    }

    /**
     * Generates the Imagine API URL.
     *
     * @param model - The Spark imagine model.
     */
    private getImagineURL(model: IFlyTekImagineModel) {
        if (!this.secret) throw new Error('IFlyTek API secret is not set in config')
        if (!this.key) throw new Error('IFlyTek API key is not set in config')

        const host = hostname()
        const date = new Date().toUTCString()
        const algorithm = 'hmac-sha256'
        const headers = 'host date request-line'
        const signatureOrigin = `host: ${host}\ndate: ${date}\nPOST /${model}/tti HTTP/1.1`
        const signatureSha = createHmac('sha256', this.secret).update(signatureOrigin).digest('hex')
        const signature = Buffer.from(signatureSha, 'hex').toString('base64')
        const authorizationOrigin = `api_key="${this.key}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
        const authorization = Buffer.from(authorizationOrigin).toString('base64')
        return `${IMAGINE_API}/${model}/tti?authorization=${authorization}&date=${date}&host=${host}`
    }

    /**
     * Format the chat message for IFlyTek Spark model.
     *
     * @param messages - Original chat messages
     */
    private formatMessage(messages: ChatMessage[]) {
        const prompt: SPKChatMessage[] = []

        for (const { role, content } of messages) {
            if (role === ChatRoleEnum.DEV) continue
            prompt.push({ role, content })
        }

        return prompt
    }
}
