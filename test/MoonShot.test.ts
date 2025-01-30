/** @format */
import 'dotenv/config'
import '../env.d.ts'
import UniAI from '../src'
import { ModelProvider, MoonShotChatModel } from '../interface/Enum'
import { Readable } from 'stream'

const { MOONSHOT_KEY, MOONSHOT_API } = process.env

const input = 'Hi, who are you? Answer in 10 words!'

let uni: UniAI

beforeAll(() => (uni = new UniAI({ MoonShot: { key: MOONSHOT_KEY.split(','), proxy: MOONSHOT_API } })))

describe('MoonShot Tests', () => {
    test('Test list MoonShot models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.MoonShot)[0]
        console.log(provider)
        expect(provider.provider).toEqual('MoonShot')
        expect(provider.models.length).toEqual(Object.values(MoonShotChatModel).length)
        expect(provider.value).toEqual(ModelProvider.MoonShot)
    })

    test('Test chat moonshot moonshot-v1-8k', done => {
        uni.chat(input, { provider: ModelProvider.MoonShot, model: MoonShotChatModel.MOON_V1_8K })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat moonshot moonshot-v1-32k', done => {
        uni.chat(input, { provider: ModelProvider.MoonShot, model: MoonShotChatModel.MOON_V1_32K })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat moonshot moonshot-v1-128k stream', done => {
        uni.chat(input, { stream: true, provider: ModelProvider.MoonShot, model: MoonShotChatModel.MOON_V1_128K }).then(
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
