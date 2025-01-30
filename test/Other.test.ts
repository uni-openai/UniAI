/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage, ChatResponse } from '../src'
import {
    ChatModelProvider,
    ChatRoleEnum,
    EmbedModelProvider,
    GoogleChatModel,
    ModelProvider,
    OpenAIChatModel,
    OtherEmbedModel
} from '../interface/Enum'
import { Readable } from 'stream'

const { GLM_API, OTHER_API, OTHER_KEY } = process.env

const input = 'Hi, who are you? Answer in 10 words!'
const input2: ChatMessage[] = [
    {
        role: ChatRoleEnum.USER,
        content: '描述下这张图片，是个男人还是女人，她在做什么？',
        img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
    }
]

describe('Other Tests', () => {
    test('Test list Other models', () => {
        const uni = new UniAI()
        const provider = uni.models.filter(v => v.value === EmbedModelProvider.Other)[0]
        console.log(provider)
        expect(provider.provider).toEqual('Other')
        expect(provider.value).toEqual(ModelProvider.Other)
    })

    test('Test chat other Gemini flash 2 think exp with vision', done => {
        const uni = new UniAI({ Other: { api: OTHER_API, key: OTHER_KEY } })
        uni.chat(input, { stream: false, provider: ChatModelProvider.Other, model: GoogleChatModel.GEM_FLASH_2_EXP })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat other GPT4 turbo with vision', done => {
        const uni = new UniAI({ Other: { api: OTHER_API, key: OTHER_KEY } })
        uni.chat(input2, { stream: false, provider: ChatModelProvider.Other, model: OpenAIChatModel.GPT4_TURBO })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat other GPT O1 mini', done => {
        const uni = new UniAI({ Other: { api: OTHER_API, key: OTHER_KEY } })
        uni.chat(input, { stream: false, provider: ChatModelProvider.Other, model: OpenAIChatModel.O1_MINI })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat other openai gpt-4o-mini stream', done => {
        const uni = new UniAI({ Other: { api: OTHER_API, key: OTHER_KEY } })
        uni.chat(input2, {
            stream: true,
            provider: ChatModelProvider.Other,
            model: GoogleChatModel.GEM_FLASH_2_EXP
        }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    }, 60000)

    test('Test chat local deployed glm-4-9b-chat stream', done => {
        const uni = new UniAI({ Other: { api: GLM_API } })
        uni.chat(input, { stream: true, provider: ChatModelProvider.Other, model: 'glm-4-9b-chat' }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    }, 60000)

    test('Test chat local deployed glm-4-9b-chat with tools', done => {
        const uni = new UniAI({ Other: { api: GLM_API } })
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
            provider: ChatModelProvider.Other,
            model: 'glm-4-9b-chat',
            tools
        })
            .then(r => console.log((r as ChatResponse).tools))
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test Other text2vec-large-chinese embedding', done => {
        const uni = new UniAI({ Other: { api: GLM_API } })
        uni.embedding([input, input], { provider: ModelProvider.Other, model: OtherEmbedModel.LARGE_CHN })
            .then(res => expect(res.embedding.length).toBe(2))
            .catch(console.error)
            .finally(done)
    })
})
