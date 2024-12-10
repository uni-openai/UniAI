/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage } from '../src'
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

const input = 'Hi, who are you? Answer in 10 words!'

let uni: UniAI

beforeAll(() => (uni = new UniAI({ OpenAI: { key: OPENAI_KEY.split(','), proxy: OPENAI_API } })))

describe('OpenAI Tests', () => {
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
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            }
        ]
        uni.chat(input, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT_4O })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai gpt-4o-mini', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            }
        ]
        uni.chat(input, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT_4O_MINI })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 10000)

    test('Test chat openai chatgpt-4o-latest', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            }
        ]
        uni.chat(input, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.CHAT_GPT_4O })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai gpt-4 stream', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT4 }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    })

    test('Test chat openai gpt-4 turbo with vision', done => {
        const input: ChatMessage[] = [
            {
                role: ChatRoleEnum.USER,
                content: '描述下这张图片，是个男人还是女人，她在做什么？',
                img: 'https://pics7.baidu.com/feed/1f178a82b9014a903fcc22f1e98d931fb11bee90.jpeg@f_auto?token=d5a33ea74668787d60d6f61c7b8f9ca2'
            }
        ]
        uni.chat(input, { stream: true, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.GPT4_TURBO }).then(
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

    test('Test chat openai o1-preview', done => {
        uni.chat(input, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.O1_PRE })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat openai o1-mini', done => {
        uni.chat(input, { stream: false, provider: ChatModelProvider.OpenAI, model: OpenAIChatModel.O1_MINI })
            .then(console.log)
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
