import OpenAI from "openai";

import { GenerateJsonParams, LLMProvider } from "../interfaces/llm-provider";

export interface GroqProviderConfig {
	apiKey: string;
	model: string;
	temperature: number;
}

export class GroqProvider implements LLMProvider {
	private client: OpenAI;

	constructor(private readonly config: GroqProviderConfig) {
		this.client = new OpenAI({
			apiKey: config.apiKey,
			baseURL: "https://api.groq.com/openai/v1",
			dangerouslyAllowBrowser: true,
		});
	}

	async generateJson(params: GenerateJsonParams): Promise<string> {
		const response = await this.client.chat.completions.create({
			model: this.config.model,
			temperature: this.config.temperature,
			response_format: {
				type: "json_object",
			},
			messages: [
				{
					role: "system",
					content: params.systemPrompt,
				},
				{
					role: "user",
					content: params.userPrompt,
				},
			],
		});

		const content = response.choices[0]?.message?.content;

		if (!content) {
			throw new Error("Model returned empty response.");
		}

		return content;
	}
}
