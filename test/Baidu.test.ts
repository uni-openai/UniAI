/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI from '../src'
import { ModelProvider, BaiduChatModel, ChatModelProvider, ChatRoleEnum } from '../interface/Enum'
import { Readable } from 'stream'

const { BAIDU_API_KEY, BAIDU_SECRET_KEY, BAIDU_API } = process.env

const input = 'Hi, who are you? Answer in 10 words!'

let uni: UniAI

beforeAll(() => (uni = new UniAI({ Baidu: { apiKey: BAIDU_API_KEY, secretKey: BAIDU_SECRET_KEY, proxy: BAIDU_API } })))

describe('Baidu Tests', () => {
    test('Test list Baidu models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.Baidu)[0]
        console.log(provider)
        expect(provider.provider).toEqual('Baidu')
        expect(provider.models.length).toEqual(Object.values(BaiduChatModel).length)
        expect(provider.value).toEqual(ModelProvider.Baidu)
    })

    test('Test chat Baidu ernie3', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_3_5 })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie3 preview', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_3_5_PRE })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie3 128k', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_3_5_128K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie4 8k', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_4_0_8K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie4 latest', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_4_0_LATEST })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie4 preview', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_4_0_PREVIEW })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie4 turbo', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_4_0_TURBO_LATEST })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie tiny stream', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_TINY_8K }).then(
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

    test('Test chat Baidu ernie lite stream', done => {
        uni.chat(input, { stream: true, provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_LITE_8K }).then(
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

    test('Test chat Baidu lite pro 128k', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_LITE_PRO_128K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie speed', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_SPEED_8K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie speed 128k', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_SPEED_128K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie speed pro 128k', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_SPEED_PRO_128K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie novel', done => {
        uni.chat(input, { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_NOVEL_8K })
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu ernie character', done => {
        uni.chat(
            [
                {
                    role: ChatRoleEnum.SYSTEM,
                    content: '你现在是一个严肃的新闻记者，叫做鲁豫，请模拟新闻记者报道的口吻回答问题'
                },
                {
                    role: ChatRoleEnum.USER,
                    content: '你好，who are U? Bro'
                }
            ],
            { provider: ChatModelProvider.Baidu, model: BaiduChatModel.ERNIE_CHAR_8K }
        )
            .then(console.log)
            .finally(done)
    })

    test('Test chat Baidu QianFan Dynamic', done => {
        uni.chat(
            [
                {
                    role: ChatRoleEnum.SYSTEM,
                    content: '你现在是三体中的三体星人，用户是地球人，你将入侵地球，请以三体人的角色回答用户问题。'
                },
                {
                    role: ChatRoleEnum.USER,
                    content: '你们是谁？为什么要入侵地球？'
                }
            ],
            {
                provider: ChatModelProvider.Baidu,
                model: BaiduChatModel.ERNIE_CHAR_FICTION_8K
            }
        )
            .then(console.log)
            .finally(done)
    })
})
