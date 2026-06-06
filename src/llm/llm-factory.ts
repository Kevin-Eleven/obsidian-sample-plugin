import { ChatWriterSettings } from "../settings/plugin-settings";

import { LLMProvider } from "./interfaces/llm-provider";
import { GroqProvider } from "./providers/groq-provider";

export class LLMFactory {
	static create(settings: ChatWriterSettings): LLMProvider {
		switch (settings.provider) {
			case "groq":
				return new GroqProvider({
					apiKey: settings.groqApiKey,
					model: settings.model,
					temperature: settings.temperature,
				});

			default:
				throw new Error(`Unsupported provider: ${settings.provider}`);
		}
	}
}
