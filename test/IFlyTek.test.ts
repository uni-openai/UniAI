/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage, ChatResponse } from '../src'
import { ModelProvider, IFlyTekChatModel, ChatModelProvider, ChatRoleEnum } from '../interface/Enum'
import { Readable } from 'stream'

const { FLY_API_PASS } = process.env

const input: ChatMessage[] = [
    {
        role: ChatRoleEnum.SYSTEM,
        content: 'Remember, now, You are a translator, you can only translate English to Chinese'
    },
    {
        role: ChatRoleEnum.USER,
        content: 'Hello, bull shit'
    },
    {
        role: ChatRoleEnum.USER,
        content: 'Hello, shiba inu'
    },
    {
        role: ChatRoleEnum.ASSISTANT,
        content: '你好，牛屎'
    },
    {
        role: ChatRoleEnum.ASSISTANT,
        content: '你好，柴犬'
    },
    {
        role: ChatRoleEnum.USER,
        content: 'I am a really good guy, I dont want to go to school'
    },
    {
        role: ChatRoleEnum.USER,
        content: 'Translate all above'
    }
]

let uni: UniAI

beforeAll(() => (uni = new UniAI({ IFlyTek: { apiPassword: FLY_API_PASS } })))

describe('IFlyTek Tests', () => {
    test('Test list IFlyTek models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.IFlyTek)[0]
        console.log(provider)
        expect(provider.provider).toEqual('IFlyTek')
        expect(provider.models.length).toEqual(Object.values(IFlyTekChatModel).length)
        expect(provider.value).toEqual(ModelProvider.IFlyTek)
    })

    test('Test chat iFlyTek spark lite', done => {
        uni.chat(input, { provider: ChatModelProvider.IFlyTek, model: IFlyTekChatModel.SPARK_LITE })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat iFlyTek spark pro', done => {
        uni.chat(input, { provider: ChatModelProvider.IFlyTek, model: IFlyTekChatModel.SPARK_MAX })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat iFlyTek spark ultra', done => {
        uni.chat(input, { provider: ChatModelProvider.IFlyTek, model: IFlyTekChatModel.SPARK_ULTRA })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat IFlyTek spark max stream', done => {
        uni.chat('查询最近5天苏州的气温', {
            stream: true,
            provider: ChatModelProvider.IFlyTek,
            model: IFlyTekChatModel.SPARK_MAX,
            tools: [{ type: 'web_search', web_search: { enable: true } }]
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

    test('Test chat IFlyTek spark ultra stream', done => {
        uni.chat('查询最近5天苏州的气温，用ECharts代码绘制成折线图', {
            stream: true,
            provider: ChatModelProvider.IFlyTek,
            model: IFlyTekChatModel.SPARK_ULTRA,
            tools: [{ type: 'web_search', web_search: { enable: true } }]
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

    test('Test chat IFlyTek spark ultra with tools', done => {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'get_current_weather',
                    description: '返回实时天气',
                    parameters: {
                        type: 'object',
                        properties: {
                            location: {
                                type: 'string',
                                description: '河北省承德市双桥区'
                            },
                            format: {
                                type: 'string',
                                enum: ['celsius', 'fahrenheit'],
                                description: '使用本地区常用的温度单位计量'
                            }
                        },
                        required: ['location', 'format']
                    }
                }
            }
        ]
        uni.chat('今天澳门天气如何？', {
            stream: false,
            provider: ChatModelProvider.IFlyTek,
            model: IFlyTekChatModel.SPARK_ULTRA,
            tools
        })
            .then(r => console.log((r as ChatResponse).tools))
            .catch(console.error)
            .finally(done)
    }, 60000)
})
