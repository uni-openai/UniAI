/**
 * Other.ts - A class for accessing the Other model's chat and embedding functionality.
 * Such as models from hugging face, text2vec
 *
 * @format by prettier
 * @author devilyouwei
 */

import { OtherEmbedRequest, OtherEmbedResponse } from '../../interface/IOther'
import { OtherEmbedModel } from '../../interface/Enum'
import { EmbeddingResponse } from '../../interface/IModel'
import $ from '../util'

export default class Other {
    private api?: string

    /**
     * Constructor for Other class.
     * @param api - The API endpoint for making requests.
     */
    constructor(api?: string) {
        this.api = api
    }

    /**
     * Fetches embeddings for a prompt.
     *
     * @param prompt - An array of input prompts.
     * @param model - The type of the embed model (default is OtherEmbedModel.LARGE_CHN).
     * @returns A promise resolving to the embedding response.
     */
    async embedding(prompt: string[], model: OtherEmbedModel = OtherEmbedModel.LARGE_CHN): Promise<EmbeddingResponse> {
        if (!this.api) throw new Error('Other embed model API is not set in config')

        const res = await $.post<OtherEmbedRequest, OtherEmbedResponse>(`${this.api}/embedding`, { prompt, model })
        return { embedding: res.data, model, object: 'embedding', promptTokens: 0, totalTokens: 0 } as EmbeddingResponse
    }
}
