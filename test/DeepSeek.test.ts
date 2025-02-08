/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI, { ChatMessage } from '../src'
import { ChatModelProvider, ChatRoleEnum, DeepSeekChatModel, ModelProvider } from '../interface/Enum'
import { Readable } from 'stream'

const { DS_KEY } = process.env

const input: string = 'Hi, who are you? Answer in 10 words!'
const input2: ChatMessage[] = [
    { role: ChatRoleEnum.SYSTEM, content: '你是一个翻译官！翻译中文为英文！' },
    { role: ChatRoleEnum.USER, content: '你好，你是谁？' },
    { role: ChatRoleEnum.ASSISTANT, content: 'Hello, who are you?' },
    { role: ChatRoleEnum.USER, content: '你是一个聪明的模型' }
]

let uni: UniAI

beforeAll(() => (uni = new UniAI({ DeepSeek: { key: DS_KEY.split(',') } })))

describe('DeepSeek tests', () => {
    test('Test list DeepSeek models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.DeepSeek)[0]
        console.log(provider)
        expect(provider.models.length).toEqual(Object.values(DeepSeekChatModel).length)
        expect(provider.provider).toEqual('DeepSeek')
        expect(provider.value).toEqual(ModelProvider.DeepSeek)
    })

    test('Test chat DeepSeek default, deepseek-chat', done => {
        uni.chat(input, { stream: false, provider: ChatModelProvider.DeepSeek })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat DeepSeek reasoning stream', done => {
        uni.chat(input2, {
            stream: true,
            provider: ChatModelProvider.DeepSeek,
            model: DeepSeekChatModel.DEEPSEEK_R1
        }).then(res => {
            expect(res).toBeInstanceOf(Readable)
            const stream = res as Readable
            let data = ''
            stream.on('data', chunk => (data += JSON.parse(chunk.toString()).content))
            stream.on('end', () => console.log(data))
            stream.on('error', e => console.error(e))
            stream.on('close', () => done())
        })
    })
})
