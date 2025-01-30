/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage, ChatResponse } from '../src'
import {
    ChatModelProvider,
    ChatRoleEnum,
    EmbedModelProvider,
    ModelProvider,
    OpenAIChatModel,
    OpenAIEmbedModel
} from '../interface/Enum'
import { Readable } from 'stream'

const { OPENAI_KEY, OPENAI_API } = process.env

const input: string = 'Hi, who are you? Answer in 10 words!'
const input2: ChatMessage[] = [
    {
        role: ChatRoleEnum.USER,
        content: '描述下这张图片',
        img: 'https://img2.baidu.com/it/u=2595743336,2138195985&fm=253&fmt=auto?w=801&h=800'
    }
]
const input3: ChatMessage[] = [
    { role: ChatRoleEnum.SYSTEM, content: '你是一个翻译官！翻译中文为英文！' },
    { role: ChatRoleEnum.USER, content: '你好，你是谁？' },
    { role: ChatRoleEnum.ASSISTANT, content: 'Hello, who are you?' },
    { role: ChatRoleEnum.USER, content: '你是一个聪明的模型' }
]

let uni: UniAI

beforeAll(() => (uni = new UniAI({ OpenAI: { key: OPENAI_KEY.split(','), proxy: OPENAI_API } })))

describe('OpenAI tests', () => {
    test('Test list OpenAI models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.OpenAI)[0]
        console.log(provider)
        expect(provider.models.length).toEqual(Object.values(OpenAIChatModel).length)
        expect(provider.provider).toEqual('OpenAI')
        expect(provider.value).toEqual(ModelProvider.OpenAI)
    })

    test('Test chat openai default, gpt-3.5-turbo', done => {
        uni.chat().then(console.log).catch(console.error).finally(done)
    })

    test('Test chat openai gpt-4o', done => {
        uni.chat(input2, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT_4O })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai gpt-4o-mini', done => {
        uni.chat(input2, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT_4O_MINI })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai chatgpt-4o-latest', done => {
        uni.chat(input2, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.CHAT_GPT_4O })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai gpt-4 stream', done => {
        uni.chat(input3, { stream: true, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT4 }).then(
            res => {
                expect(res).toBeInstanceOf(Readable)
                const stream = res as Readable
                let data = ''
                stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
                stream.on('end', () => console.log(data))
                stream.on('error', e => console.error(e))
                stream.on('close', () => done())
            }
        )
    })

    test('Test chat openai gpt-4 turbo with vision', done => {
        uni.chat(input2, { stream: true, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT4_TURBO }).then(
            res => {
                expect(res).toBeInstanceOf(Readable)
                const stream = res as Readable
                let data = ''
                stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
                stream.on('end', () => console.log(data))
                stream.on('error', e => console.error(e))
                stream.on('close', () => done())
            }
        )
    }, 60000)

    test('Test chat openai o1', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.O1 }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    }, 10000)

    test('Test chat openai o1-preview', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.O1_PRE }).then(
            res => {
                expect(res).toBeInstanceOf(Readable)
                const stream = res as Readable
                let data = ''
                stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
                stream.on('end', () => console.log(data))
                stream.on('error', e => console.error(e))
                stream.on('close', () => done())
            }
        )
    }, 10000)

    test('Test chat openai o1-mini', done => {
        uni.chat(input, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.O1_MINI })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai gpt-4o-mini with tools', done => {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'get_weather',
                    description: 'Get current temperature for a given location.',
                    parameters: {
                        type: 'object',
                        properties: {
                            location: {
                                type: 'string',
                                description: 'City and country e.g. Bogotá, Colombia, should in English'
                            }
                        },
                        required: ['location'],
                        additionalProperties: false
                    },
                    strict: true
                }
            }
        ]
        uni.chat('今天澳门天气如何？', {
            stream: false,
            provider: ChatModelProvider.OpenAI,
            model: OpenAIChatModel.GPT_4O_MINI,
            tools
        })
            .then(r => console.log((r as ChatResponse).tools))
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test OpenAI/text-embedding-ada2 embedding', done => {
        uni.embedding(input, { provider: EmbedModelProvider.OpenAI, model: OpenAIEmbedModel.ADA })
            .then(res => expect(res.embedding.length).toBe(1))
            .catch(console.error)
            .finally(done)
    })

    test('Test OpenAI/text-embedding-3-large embedding', done => {
        uni.embedding(input, { provider: EmbedModelProvider.OpenAI, model: OpenAIEmbedModel.LARGE })
            .then(res => expect(res.embedding.length).toBe(1))
            .catch(console.error)
            .finally(done)
    })

    test('Test OpenAI/text-embedding-3-small embedding', done => {
        uni.embedding(input, { provider: EmbedModelProvider.OpenAI, model: OpenAIEmbedModel.SMALL })
            .then(res => expect(res.embedding.length).toBe(1))
            .catch(console.error)
            .finally(done)
    })
})
