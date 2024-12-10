/** @format */
import {
    AliChatModel,
    BaiduChatModel,
    ChatModel,
    ChatModelProvider,
    ChatRoleEnum,
    EmbedModel,
    EmbedModelProvider,
    GLMChatModel,
    GLMEmbedModel,
    GoogleChatModel,
    GoogleEmbedModel,
    IFlyTekChatModel,
    IFlyTekImagineModel,
    ImagineModel,
    ImagineModelProvider,
    MJTaskType,
    MidJourneyImagineModel,
    ModelProvider,
    MoonShotChatModel,
    OpenAIChatModel,
    OpenAIEmbedModel,
    OpenAIImagineModel,
    OtherEmbedModel,
    StabilityAIImagineModel
} from '../interface/Enum'
import { UniAIConfig } from '../interface/IConfig'
import { ChatMessage, ChatOption, EmbedOption, ImagineOption, ModelList, Provider } from '../interface/IModel'
import OpenAI from './providers/OpenAI'
import GLM from './providers/GLM'
import Other from './providers/Other'
import Google from './providers/Google'
import IFlyTek from './providers/IFlyTek'
import Baidu from './providers/Baidu'
import MoonShot from './providers/MoonShot'
import MidJourney from './providers/MidJourney'
import Stability from './providers/Stability'
import AliYun from './providers/AliYun'

const DEFAULT_MESSAGE = 'Hi, who are you? Answer in 10 words!'

export default class UniAI {
    public config: UniAIConfig | null = null
    public models: ModelList
    public embedModels: ModelList
    public chatModels: ModelList
    public imgModels: ModelList

    private openai: OpenAI
    private google: Google
    private glm: GLM
    private fly: IFlyTek
    private baidu: Baidu
    private other: Other
    private moon: MoonShot
    private ali: AliYun
    private mj: MidJourney
    private stability: Stability

    constructor(config: UniAIConfig = {}) {
        this.config = config
        // OpenAI key, your OpenAI proxy API (optional)
        this.openai = new OpenAI(config.OpenAI?.key, config.OpenAI?.proxy)
        // ZhiPu AI with ChatGLM6B(local)
        this.glm = new GLM(config.GLM?.key, config.GLM?.local, config.GLM?.proxy)
        // Google AI key, your Google AI API proxy (optional)
        this.google = new Google(config.Google?.key, config.Google?.proxy)
        // IFlyTek appid, API key, API secret
        this.fly = new IFlyTek(
            config.IFlyTek?.apiPassword,
            config.IFlyTek?.appId,
            config.IFlyTek?.apiKey,
            config.IFlyTek?.apiSecret,
            config.IFlyTek?.proxy
        )
        // Baidu WenXin Workshop, baidu api key, baidu secret key
        this.baidu = new Baidu(config.Baidu?.apiKey, config.Baidu?.secretKey, config.Baidu?.proxy)
        // MoonShot, moonshot API key
        this.moon = new MoonShot(config.MoonShot?.key, config.MoonShot?.proxy)
        // AliYun, QWen API key
        this.ali = new AliYun(config.AliYun?.key, config.AliYun?.proxy)
        // Other model text2vec
        this.other = new Other(config.Other?.api)
        // Midjourney, proxy
        this.mj = new MidJourney(config.MidJourney?.proxy, config.MidJourney?.token, config.MidJourney?.imgProxy)
        // Stability AI, key, proxy
        this.stability = new Stability(config.StabilityAI?.key, config.StabilityAI?.proxy)

        // expand chat models to list
        this.chatModels = Object.entries(ChatModelProvider).map<Provider>(([k, v]) => ({
            provider: k as keyof typeof ChatModelProvider,
            value: v,
            models: Object.values<ChatModel>(
                {
                    [ChatModelProvider.OpenAI]: OpenAIChatModel,
                    [ChatModelProvider.Baidu]: BaiduChatModel,
                    [ChatModelProvider.IFlyTek]: IFlyTekChatModel,
                    [ChatModelProvider.GLM]: GLMChatModel,
                    [ChatModelProvider.Google]: GoogleChatModel,
                    [ChatModelProvider.MoonShot]: MoonShotChatModel,
                    [ChatModelProvider.AliYun]: AliChatModel
                }[v]
            )
        }))

        // expand chat models to list
        this.imgModels = Object.entries(ImagineModelProvider).map<Provider>(([k, v]) => ({
            provider: k as keyof typeof ImagineModelProvider,
            value: v,
            models: Object.values<ImagineModel>(
                {
                    [ImagineModelProvider.OpenAI]: OpenAIImagineModel,
                    [ImagineModelProvider.MidJourney]: MidJourneyImagineModel,
                    [ImagineModelProvider.StabilityAI]: StabilityAIImagineModel,
                    [ImagineModelProvider.IFlyTek]: IFlyTekImagineModel
                }[v]
            )
        }))

        // expand chat models to list
        this.embedModels = Object.entries(EmbedModelProvider).map<Provider>(([k, v]) => ({
            provider: k as keyof typeof EmbedModelProvider,
            value: v,
            models: Object.values<EmbedModel>(
                {
                    [EmbedModelProvider.OpenAI]: OpenAIEmbedModel,
                    [EmbedModelProvider.Other]: OtherEmbedModel,
                    [EmbedModelProvider.GLM]: GLMEmbedModel,
                    [EmbedModelProvider.Google]: GoogleEmbedModel
                }[v]
            )
        }))

        this.models = [...this.chatModels, ...this.embedModels, ...this.imgModels]
    }

    async chat(messages: ChatMessage[] | string = DEFAULT_MESSAGE, option: ChatOption = {}) {
        if (typeof messages === 'string') messages = [{ role: ChatRoleEnum.USER, content: messages }]
        const provider = option.provider || ChatModelProvider.OpenAI // default is OpenAI gpt-3.5-turbo
        const { model, stream, top, temperature, maxLength } = option

        if (provider === ChatModelProvider.OpenAI)
            return await this.openai.chat(messages, model as OpenAIChatModel, stream, top, temperature, maxLength)
        else if (provider === ChatModelProvider.Google)
            return await this.google.chat(messages, model as GoogleChatModel, stream, top, temperature, maxLength)
        else if (provider === ChatModelProvider.GLM)
            return await this.glm.chat(messages, model as GLMChatModel, stream, top, temperature, maxLength)
        else if (provider === ChatModelProvider.IFlyTek)
            return await this.fly.chat(messages, model as IFlyTekChatModel, stream, top, temperature, maxLength)
        else if (provider === ChatModelProvider.Baidu)
            return await this.baidu.chat(messages, model as BaiduChatModel, stream, top, temperature, maxLength)
        else if (provider === ChatModelProvider.MoonShot)
            return await this.moon.chat(messages, model as MoonShotChatModel, stream, top, temperature, maxLength)
        else if (provider === ChatModelProvider.AliYun)
            return await this.ali.chat(messages, model as AliChatModel, stream, top, temperature, maxLength)
        else throw new Error('Chat model Provider not found')
    }

    async embedding(content: string | string[], option: EmbedOption = {}) {
        const provider = option.provider || ModelProvider.OpenAI
        const { model } = option
        if (typeof content === 'string') content = [content]

        if (provider === EmbedModelProvider.OpenAI)
            return await this.openai.embedding(content, model as OpenAIEmbedModel)
        else if (provider === EmbedModelProvider.GLM)
            return await this.glm.embedding(content, model as GLMEmbedModel, option.dimensions)
        else if (provider === EmbedModelProvider.Google)
            return await this.google.embedding(content, model as GoogleEmbedModel)
        else if (provider === EmbedModelProvider.Other)
            return await this.other.embedding(content, model as OtherEmbedModel)
        else throw new Error('Embedding model provider not found')
    }

    async imagine(prompt: string, option: ImagineOption = {}) {
        const provider = option.provider || ImagineModelProvider.OpenAI
        const { negativePrompt, width, height, num, model } = option
        if (provider === ImagineModelProvider.OpenAI)
            return await this.openai.imagine(prompt, width, height, num, model as OpenAIImagineModel)
        else if (provider === ImagineModelProvider.MidJourney)
            return await this.mj.imagine(prompt, negativePrompt, width, height)
        else if (provider === ImagineModelProvider.StabilityAI)
            return await this.stability.imagine(
                prompt,
                negativePrompt,
                width,
                height,
                num,
                model as StabilityAIImagineModel
            )
        else if (provider === ImagineModelProvider.IFlyTek)
            return await this.fly.imagine(prompt, width, height, model as IFlyTekImagineModel)
        else throw new Error('Imagine model provider not found')
    }

    async task(provider: ImagineModelProvider, id?: string) {
        if (provider === ImagineModelProvider.OpenAI) return this.openai.task(id)
        else if (provider === ImagineModelProvider.MidJourney) return await this.mj.task(id)
        else if (provider === ImagineModelProvider.StabilityAI) return this.stability.task(id)
        else if (provider === ImagineModelProvider.IFlyTek) return this.fly.task(id)
        else throw new Error('Imagine model provider not found')
    }

    async change(provider: ImagineModelProvider, taskId: string, action: string, index?: number) {
        if (provider === ImagineModelProvider.MidJourney) return this.mj.change(taskId, action as MJTaskType, index)
        else throw new Error('Imagine model provider not found')
    }
}
