/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage, ChatResponse } from '../src'
import {
    ModelProvider,
    GLMChatModel,
    ChatRoleEnum,
    ChatModelProvider,
    EmbedModelProvider,
    GLMEmbedModel
} from '../interface/Enum'
import { Readable } from 'stream'

const { ZHIPU_AI_API, ZHIPU_AI_KEY } = process.env

const input = 'Hi, who are you? Answer in 10 words!'

let uni: UniAI

beforeAll(() => (uni = new UniAI({ GLM: { key: ZHIPU_AI_KEY.split(','), proxy: ZHIPU_AI_API } })))

describe('GLM Tests', () => {
    test('Test list GLM models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.GLM)[0]
        console.log(provider)
        expect(provider.provider).toEqual('GLM')
        expect(provider.models.length).toEqual(Object.values(GLMChatModel).length)
        expect(provider.value).toEqual(ModelProvider.GLM)
    })

    test('Test chat ZhiPu glm-3-turbo', done => {
        uni.chat(input, { provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_3_TURBO })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat ZhiPu glm-4 stream', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4 }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    }, 60000)

    test('Test chat ZhiPu glm-4-plus', done => {
        uni.chat(input, { provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4_PLUS })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat ZhiPu glm-4-air', done => {
        uni.chat(input, { provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4_AIR })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat ZhiPu glm-4-airx', done => {
        uni.chat(input, { provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4_AIRX })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    /*
    test('Test chat ZhiPu glm-4-alltools', done => {
        uni.chat('今天新闻头条有哪些报道，总结下', { provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4_ALL })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })
            */

    test('Test chat ZhiPu glm-4-flash', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4_FLASH }).then(
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
    }, 30000)

    test('Test chat ZhiPu glm-4-flashx', done => {
        uni.chat('今天新闻头条有哪些报道，总结下', {
            provider: ChatModelProvider.GLM,
            model: GLMChatModel.GLM_4_FLASHX
        })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat ZhiPu glm-4-long', done => {
        const tools = [{ type: 'web_search', web_search: { enable: true, search_result: true } }]
        uni.chat('今天农历是多少？新闻头条有哪些报道，总结下', {
            tools,
            provider: ChatModelProvider.GLM,
            model: GLMChatModel.GLM_4_LONG
        })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat ZhiPu glm-4 vision', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            },
            {
                role: ChatRoleEnum.USER,
                content: '连同当前这幅画，我一共给你传了几张图？分别描述下',
                img: 'https://api.uniai.cas-ll.cn/wechat/file?path=minio/a82db85d-d8e6-4281-8734-bedd54420c0d.jpg&name=IMG_20190208_132658%20(1).jpg'
            }
        ]
        uni.chat(input, { stream: true, provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4V }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    }, 60000)

    test('Test chat ZhiPu glm-4 vision plus', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            },
            {
                role: ChatRoleEnum.USER,
                content: '连同当前这幅画，我一共给你传了几张图？分别描述下',
                img: 'https://api.uniai.cas-ll.cn/wechat/file?path=minio/a82db85d-d8e6-4281-8734-bedd54420c0d.jpg&name=IMG_20190208_132658%20(1).jpg'
            }
        ]
        uni.chat(input, { stream: true, provider: ChatModelProvider.GLM, model: GLMChatModel.GLM_4V_PLUS }).then(
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

    test('Test chat ZhiPu glm-4 with tools', done => {
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
            provider: ChatModelProvider.GLM,
            model: GLMChatModel.GLM_4,
            tools
        })
            .then(r => console.log((r as ChatResponse).tools))
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat ZhiPu glm-4 plus with web search tool', done => {
        const tools = [{ type: 'web_search', web_search: { enable: true, search_result: true } }]
        // 只允许访问国内网站
        uni.chat('总结文中的内容：https://www.chinanews.com.cn/cj/2024/07-05/10246755.shtml', {
            provider: ChatModelProvider.GLM,
            model: GLMChatModel.GLM_4_PLUS,
            tools,
            toolChoice: 'auto'
        })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test GLM/embedding-2 embedding', done => {
        uni.embedding([input, input + 'sss'], { provider: EmbedModelProvider.GLM, model: GLMEmbedModel.EMBED_2 })
            .then(res => {
                expect(res.embedding.length).toBe(2)
            })
            .catch(console.error)
            .finally(done)
    })

    test('Test GLM/embedding-3 embedding', done => {
        uni.embedding([input, input + 'sss'], {
            provider: EmbedModelProvider.GLM,
            model: GLMEmbedModel.EMBED_3,
            dimensions: 768
        })
            .then(res => {
                expect(res.embedding.length).toBe(2)
                expect(res.embedding[0].length).toBe(768)
            })
            .catch(console.error)
            .finally(done)
    })
})
