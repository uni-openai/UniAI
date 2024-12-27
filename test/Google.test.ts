/** @format */
import 'dotenv/config'
import UniAI, { ChatMessage } from '../src'
import {
    ModelProvider,
    GoogleChatModel,
    ChatRoleEnum,
    EmbedModelProvider,
    EmbedModel,
    ChatModelProvider
} from '../interface/Enum'
import { Readable } from 'stream'
// import { readFileSync } from 'fs'

const { GOOGLE_AI_API, GOOGLE_AI_KEY } = process.env

const input = 'Hi, who are you? Answer in 10 words!'

let uni: UniAI

beforeAll(() => (uni = new UniAI({ Google: { key: GOOGLE_AI_KEY.split(','), proxy: GOOGLE_AI_API } })))

describe('Google Tests', () => {
    test('Test list Google models', () => {
        const provider = uni.models.filter(v => v.value === ModelProvider.Google)[0]
        console.log(provider)
        expect(provider.provider).toEqual('Google')
        expect(provider.models.length).toEqual(Object.values(GoogleChatModel).length)
        expect(provider.value).toEqual(ModelProvider.Google)
    })

    test('Test chat Google Gemini 1.5 Flash stream', done => {
        uni.chat(input, {
            stream: true,
            provider: ChatModelProvider.Google,
            model: GoogleChatModel.GEM_FLASH_1_5
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

    test('Test chat Google Gemini 1.5 Pro', done => {
        // web browser base64 with mime
        const img =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAMAAAANIilAAAABNVBMVEUAAAD///////////////////8hULfX8f8fT7caSrUXSLQdTbb8/P4cTLUVRrMsWbsSRLIkUrj6+/73+f39/v/z9vtQdcY4Yr9khc3j6fbe5fTT3PFegMtUecgnVbnf9//a8//t8fna4vOzw+adsuCXrd6Ko9mDntc1YL0yXr0wXLzv8vrm6/fH0+11ktJxkNJYe8lEbMI9ZsDo7fi5yOmqvORpic/x9PrM1+/Azeu8yulig8xJcMQ/acIpV7qwwOaQqNx4ldNbfsrI4/nq7/jY4PLQ2vDK1e6ty+7E0ey2xeitv+WluOKhteGar96TqtzU7f3R6vyHoNh6mNZCbsXj+//c9P/g5vWiwep+mtVags9KdMgLP7GYueaQsuNafcrN5/nB3PW82fS92POMruB9otxljNLQKbZ2AAAABXRSTlMA8rQvcoBEpiwAAARLSURBVEjHnZdnf9owEMZpUhlL3gY8AEPYe4+wITR70Tajzege3/8jFGM3RsYG2ueVpJ//nO50OnEej2d35xX4Z73a2fXM9Rr8p17P7YL/1q5nBzhKbJyn1A3wjsfZ32BZYOB4eeX4Mnkes/ntcWQ7HJU5ionWQiEMKeE5A3A5wrQsx7GFQo15f6SeFbeBT9gx/mMPKGEON8MXfAibq0QGbA1fskfYfEap28Nj/hib16q+7eES21ueFmEKbA8HiaQRKF9gLjoBexth8UMoSC9G/twBKIQSs5v2VJO0/oDIdFX/Wjg5GAkRqbkYh7PtukCQhiiSIAROS+27wqrGMwRBMMwFEOPpPANJAhdEQqZIO8LFATS+IeVEZcRShININp+OOcEKWvrIMorDBEkN1FX4GBGbRHJyniRh/ngFftgCPtsPtjQI8x07PGU2slnd3UCKYmoFGxyGm2CqGgC6EiNescFpdiP8njZTl+OvcPhQoDbAQukv0aKyKn5UY4Ei17FM1QpTmU3hMDhTsmtoSohbsG9YC+AwEFvIPdQQq0I91LHBoApdWWLix8phvmyDYyO3mCEuibFAVOo2uMS7sVIc2JRCDRy+doRJikvRdpZuoiYOH0CHA0JyOojvOCSCw0pCmOBwH66i2VTBD+jQ3HQzDoBvEgQhsgVKz5dcBYfDDL5fUpBa9OK6MiXQYMoAxOqReCwv0RnqJBdeZxnlbk5MXw9z4diM1+tniKsXknydVfy5qs1ntJxRZatc+ZMowrcXwy5K0xfhSQBkbXCSX/L2Cxalq3bKb/pmJKaYm+Jwh7Vg9B44av9LfQEXOAWHfVkrYrDihPoyOdbItWDkBodBGVkua3bOp9cgzXwSQIiYWbC5Qr6ckxzDUyo97S6/F100tsG+PmXVjRPccpNjc1L/mv6byqxqg0FXsFIkQ9tClawOsxWfaUarrT6xFdbadwPYFTgUzVEJXa7CooTWH5ZpWK7tr8KgWH9xG564saICzx3/GYTqSL/D+mnJQRe7FT7t8rfiUGOJEQd1twcxJ/aDBLGij4lWqGy3qldxVFu1XbgUImH+wg0ODjmyCbplGUHITfCYx1NDpHSq2YAbLOVPOUUEdGMsQUQtVaHixVRgpTOQZnvABW7xn+9+QeNdOjrIU4gcHFz1etftGsHn2x395j7QLrBfyn31vhvm4qa1NqRYnmVhZMhxiSIA9BUKB4ALrBK/o969U0I+MmNLPH769PH025t7baDnZofp+4AbXII/77ze6Oko0jJycfgYjd7veb33t319ocEdLH+OtwnnzMeod07/eHo2njbt6a13rr23coXW3cow8aU2AW9QEtRpdPHxY8RIX+X23WL+jjPuWYgpLzcouw6W974zE2OhbcJvImmjBk5H1tnv4k3ZGfy82HYloprl8vatARMzA26yLaspw9vBOLy5W9gpm4cpPZkwc20eZl0RX9rBP04YsF7fSMfEAAAAAElFTkSuQmCC'
        /*
        // pure base64 data
        const img = readFileSync('./icon/logo.png').toString('base64')
        // local file path
        const img = './icon/logo.png'
            */
        const input: ChatMessage[] = [
            { role: ChatRoleEnum.USER, content: 'FileName: a.png, FileSize: 10000 bytes', img },
            { role: ChatRoleEnum.USER, content: '用一首诗描述下图片' },
            { role: ChatRoleEnum.ASSISTANT, content: '这是一只可爱的小蜜蜂' },
            { role: ChatRoleEnum.USER, content: '重新用一首诗描述下图片', img }
        ]
        uni.chat(input, { provider: ChatModelProvider.Google, model: GoogleChatModel.GEM_PRO_1_5 })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    }, 60000)

    test('Test chat Google Gemini 1.5 Flash 8B', done => {
        uni.chat(
            [
                { role: ChatRoleEnum.SYSTEM, content: 'Now, you are spiderman!' },
                { role: ChatRoleEnum.USER, content: input }
            ],
            { provider: ChatModelProvider.Google, model: GoogleChatModel.GEM_FLASH_1_5_8B }
        )
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat Google Gemini 2.0 Flash Exp', done => {
        // http image url
        const img =
            'https://pics1.baidu.com/feed/b8014a90f603738dfa1a8f19fe77005cf819ec37.jpeg@f_auto?token=27364f8c08104481dac7d3b7665c9179'
        uni.chat([{ role: ChatRoleEnum.USER, content: '描述下这张图片', img }], {
            provider: ChatModelProvider.Google,
            model: GoogleChatModel.GEM_FLASH_1_5_8B
        })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test chat Google Gemini 2.0 Flash Thinking Exp', done => {
        uni.chat(input, { provider: ChatModelProvider.Google, model: GoogleChatModel.GEM_FLASH_2_THINK_EXP })
            .then(console.log)
            .catch(console.error)
            .finally(done)
    })

    test('Test Google text embedding 4', done => {
        uni.embedding([input, input + 'sss'], { provider: EmbedModelProvider.Google, model: EmbedModel.EMBED_4 })
            .then(res => expect(res.embedding.length).toBe(2))
            .catch(console.error)
            .finally(done)
    })
})
