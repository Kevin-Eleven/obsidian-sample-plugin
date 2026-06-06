export interface GenerateJsonParams {
	systemPrompt: string;
	userPrompt: string;
}

export interface LLMProvider {
	generateJson(params: GenerateJsonParams): Promise<string>;
}
