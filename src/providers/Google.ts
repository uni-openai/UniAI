/** @format */

import { PassThrough, Readable } from 'stream'
import { JSONParser } from '@streamparser/json-node'
import { decodeStream } from 'iconv-lite'
import { GEMChatRequest, GEMChatResponse, GEMChatMessage } from '../../interface/IGoogle'
import { ChatRoleEnum, GEMChatRoleEnum, GoogleChatModel } from '../../interface/Enum'
import { ChatMessage, ChatResponse } from '../../interface/IModel'
import $ from '../util'

const API = 'https://generativelanguage.googleapis.com'
const SAFE_SET = [
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE'
    },
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE'
    },
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE'
    }
]

export default class Google {
    private key?: string | string[]
    private api: string

    constructor(key?: string | string[], api: string = API) {
        this.key = key
        this.api = api
    }

    /**
     * Sends messages to the Google Gemini chat model.
     *
     * @param messages - An array of chat messages.
     * @param model - The model to use for chat (default: gemini-pro).
     * @param stream - Whether to use stream response (default: false).
     * @param top - Top probability to sample (optional).
     * @param temperature - Temperature for sampling (optional).
     * @param maxLength - Maximum token length for response (optional).
     * @returns A promise resolving to the chat response or a stream.
     */
    async chat(
        messages: ChatMessage[],
        model: GoogleChatModel = GoogleChatModel.GEM_PRO,
        stream: boolean = false,
        top?: number,
        temperature?: number,
        maxLength?: number
    ) {
        const key = Array.isArray(this.key) ? $.getRandom(this.key) : this.key
        if (!key) throw new Error('Google AI API key is not set in config')

        const res = await $.post<GEMChatRequest, GEMChatResponse | Readable>(
            `${this.api}/v1beta/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${key}`,
            {
                contents: this.formatMessage(messages),
                generationConfig: { topP: top, temperature, maxOutputTokens: maxLength },
                safetySettings: SAFE_SET
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
            const parser = new JSONParser({ stringBufferSize: undefined })

            parser.on('data', ({ value }) => {
                if (value.candidates || value.promptFeedback) {
                    const obj = value as GEMChatResponse
                    const block = obj.promptFeedback?.blockReason
                    if (block) output.destroy(new Error(block))
                    else {
                        const content = obj.candidates![0].content?.parts[0].text || ''
                        if (content) data.content = content
                        else data.content = obj.candidates![0].finishReason || 'Error'
                        data.object = `chat.completion.chunk`
                        output.write(JSON.stringify(data))
                    }
                }
            })

            parser.on('error', e => output.destroy(e))
            parser.on('end', () => output.end())

            res.pipe(decodeStream('utf-8')).pipe(parser)
            return output as Readable
        } else {
            const block = res.promptFeedback?.blockReason
            if (block) throw new Error(block)
            const candidate = res.candidates![0]
            data.content = candidate.content!.parts[0].text || candidate.finishReason
            data.object = `chat.completion`
            return data
        }
    }

    /**
     * Formats chat messages into GEMChatMessage format.
     *
     * @param messages - An array of chat messages.
     * @returns A formatted array of GEMChatMessage.
     */
    private formatMessage(messages: ChatMessage[]) {
        const prompt: GEMChatMessage[] = []
        let input = ''
        for (const { role, content } of messages) {
            if (!content) continue
            if (role !== ChatRoleEnum.ASSISTANT) input += `\n${content}`
            else {
                prompt.push({ role: GEMChatRoleEnum.USER, parts: [{ text: input.trim() || ' ' }] })
                prompt.push({ role: GEMChatRoleEnum.MODEL, parts: [{ text: content }] })
                input = ''
            }
        }
        if (!input.trim()) throw new Error('User input nothing')
        prompt.push({ role: GEMChatRoleEnum.USER, parts: [{ text: input.trim() }] })
        return prompt
    }
}
