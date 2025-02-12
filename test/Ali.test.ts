/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage } from '../src'
import {
    AliChatModel,
    AliEmbedModel,
    ChatModelProvider,
    ChatRoleEnum,
    EmbedModelProvider,
    ModelProvider
} from '../interface/Enum'
import { Readable } from 'stream'

const { ALI_KEY, ALI_API } = process.env

const input = 'Hi, who are you? Answer in 10 words!'

let uni: UniAI

beforeAll(() => (uni = new UniAI({ AliYun: { key: ALI_KEY.split(','), proxy: ALI_API } })))

describe('AliYun QWen Tests', () => {
    test('Test list Ali QWen models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.AliYun)[0]
        console.log(provider)
        expect(provider.provider).toEqual('AliYun')
        expect(provider.models.length).toEqual(Object.values(AliChatModel).length)
        expect(provider.value).toEqual(ModelProvider.AliYun)
    })

    test('Test chat AliYun QWen Max', done => {
        uni.chat(input, { provider: ChatModelProvider.AliYun, model: AliChatModel.QWEN_MAX })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat AliYun QWen Plus stream', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.AliYun, model: AliChatModel.QWEN_PLUS }).then(
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

    test('Test chat AliYun QWen Turbo', done => {
        uni.chat(input, { provider: ChatModelProvider.AliYun, model: AliChatModel.QWEN_TURBO })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat AliYun QWen Code', done => {
        uni.chat(`Use ruby to write hello world`, { provider: ChatModelProvider.AliYun, model: AliChatModel.QWEN_CODE })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat AliYun QWen Math stream', done => {
        uni.chat(`Latex给出爱因斯坦的质能方程式`, {
            stream: true,
            provider: ChatModelProvider.AliYun,
            model: AliChatModel.QWEN_MATH
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

    test('Test chat AliYun QWen with vision plus', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            }
        ]
        uni.chat(input, { stream: true, provider: ChatModelProvider.AliYun, model: AliChatModel.QWEN_VL_PLUS }).then(
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

    test('Test chat AliYun QWen with vision max', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            }
        ]
        uni.chat(input, { provider: ChatModelProvider.AliYun, model: AliChatModel.QWEN_VL_MAX })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test Ali/text-embedding-v3 embedding', done => {
        uni.embedding([input, input + 'sss'], {
            provider: EmbedModelProvider.AliYun,
            model: AliEmbedModel.V3,
            dimensions: 512
        })
            .then(res => {
                expect(res.embedding.length).toBe(2)
                expect(res.embedding[0].length).toBe(512)
            })
            .catch(console.error)
            .finally(done)
    })

    test.only('Test Ali/text-embedding-v2 embedding', done => {
        uni.embedding([input, input + 'sss'], {
            provider: EmbedModelProvider.AliYun,
            model: AliEmbedModel.V2,
            dimensions: 768
        })
            .then(res => {
                expect(res.embedding.length).toBe(2)
                expect(res.embedding[0].length).toBe(1536)
            })
            .catch(console.error)
            .finally(done)
    })
})
