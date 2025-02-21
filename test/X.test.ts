/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage } from '../src'
import { ChatModelProvider, ChatRoleEnum, ModelProvider, XAIChatModel } from '../interface/Enum'
import { Readable } from 'stream'

const { X_AI_API, X_AI_KEY } = process.env

const input = '今天深圳天气如何？'
const input2: ChatMessage[] = [
    {
        role: ChatRoleEnum.USER,
        content: '描述下这张图片',
        img: 'https://img2.baidu.com/it/u=2595743336,2138195985&fm=253&fmt=auto?w=801&h=800'
    }
]

let uni: UniAI

beforeAll(() => (uni = new UniAI({ XAI: { key: X_AI_KEY, proxy: X_AI_API } })))

describe('X AI Tests', () => {
    test('Test list X AI models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.XAI)[0]
        console.log(provider)
        expect(provider.provider).toEqual('XAI')
        expect(provider.models.length).toEqual(Object.values(XAIChatModel).length)
        expect(provider.value).toEqual(ModelProvider.XAI)
    })

    test('Test chat X AI Grok-2', done => {
        uni.chat(input, {
            provider: ChatModelProvider.XAI,
            model: XAIChatModel.GROK2,
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'get_current_temperature',
                        description: 'Get the current temperature in a given location',
                        parameters: {
                            type: 'object',
                            properties: {
                                location: {
                                    type: 'string',
                                    description: 'The city and state, e.g. San Francisco, CA, in English'
                                },
                                unit: {
                                    type: 'string',
                                    enum: ['celsius', 'fahrenheit'],
                                    default: 'celsius'
                                }
                            },
                            required: ['location']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'get_current_ceiling',
                        description: 'Get the current cloud ceiling in a given location',
                        parameters: {
                            type: 'object',
                            properties: {
                                location: {
                                    type: 'string',
                                    description: 'The city and state, e.g. San Francisco, CA'
                                }
                            },
                            required: ['location']
                        }
                    }
                }
            ],
            toolChoice: 'required'
        })
            .then(console.log)
            .finally(done)
    })

    test('Test chat X AI Grok-2 with vision', done => {
        uni.chat(input2, { stream: true, provider: ChatModelProvider.XAI, model: XAIChatModel.GROK2_VISION }).then(
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
})
