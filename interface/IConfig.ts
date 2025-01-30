/** @format */

export interface UniAIConfig {
    // OpenAI configs
    OpenAI?: {
        key: string | string[]
        proxy?: string
    }

    // Google configs
    Google?: {
        key: string | string[]
        proxy?: string
    }

    // GLM configs
    GLM?: {
        key?: string | string[]
        proxy?: string
    }

    // IFlyTek
    IFlyTek?: {
        apiPassword?: string | string[]
        appId?: string
        apiKey?: string
        apiSecret?: string
        proxy?: string
    }

    Baidu?: {
        appId?: string
        apiKey?: string
        secretKey?: string
        proxy?: string
    }

    MoonShot?: {
        key: string | string[]
        proxy?: string
    }

    AliYun?: {
        key: string | string[]
        proxy?: string
    }

    // midjourney proxy
    MidJourney?: {
        proxy: string
        imgProxy?: string
        token?: string
    }

    StabilityAI?: {
        key: string | string[]
        proxy?: string
    }

    // other models
    Other?: {
        api?: string
        key?: string
        // ...
    }
}
