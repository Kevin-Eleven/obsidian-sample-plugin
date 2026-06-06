export interface ChatWriterSettings {
	provider: "groq";

	groqApiKey: string;

	model: string;

	temperature: number;
}

export const DEFAULT_SETTINGS: ChatWriterSettings = {
	provider: "groq",

	groqApiKey: "",

	model: "llama-3.3-70b-versatile",

	temperature: 0.2,
};
