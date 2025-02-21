/** @format */

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            OPENAI_API: string
            OPENAI_KEY: string
            GOOGLE_AI_API: string
            GOOGLE_AI_KEY: string
            ZHIPU_AI_API: string
            ZHIPU_AI_KEY: string
            FLY_API_PASS: string
            FLY_APP_ID: string
            FLY_API_KEY: string
            FLY_API_SECRET: string
            BAIDU_API: string
            BAIDU_API_KEY: string
            BAIDU_SECRET_KEY: string
            MOONSHOT_API: string
            MOONSHOT_KEY: string
            ALI_KEY: string
            ALI_API: string
            DS_API: string
            DS_KEY: string
            X_AI_API: string
            X_AI_KEY: string
            STABLE_DIFFUSION_API: string
            MID_JOURNEY_API: string
            MID_JOURNEY_TOKEN: string
            MID_JOURNEY_IMG_PROXY: string
            GLM_API: string
            STABILITY_API: string
            STABILITY_KEY: string
        }
    }
}

// for env file
export {}
