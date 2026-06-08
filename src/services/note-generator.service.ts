import { Notice } from "obsidian";

import { NoteRequest } from "../models/note-request";
import { NoteResponse } from "../models/note-response";

import { buildSystemPrompt } from "../prompts/note-prompt-builder";

import { LLMProvider } from "../llm/interfaces/llm-provider";

import { parseNoteResponse } from "../utils/json-parser";

import { MAX_RETRIES, buildRetryPrompt } from "../utils/retry-prompts";

export class NoteGeneratorService {
	constructor(private readonly llm: LLMProvider) {}

	async generateNote(request: NoteRequest): Promise<NoteResponse> {
		let userContext = `
USER REQUEST:
${request.userMessage}`;

		if (request.includeTags) {
			userContext += `

AVAILABLE TAGS:
${request.tags.join(", ")}
`;
		}

		if (request.includeRelatedNotes) {
			userContext += `

OTHER NOTES:
${request.otherFiles.join(", ")}
`;
		}

		try {
			let prompt = userContext;

			for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
				const response = await this.llm.generateJson({
					systemPrompt: buildSystemPrompt({
						includeTags: request.includeTags,
						includeRelatedNotes: request.includeRelatedNotes,
					}),
					userPrompt: prompt,
				});

				try {
					if (!response.trim()) {
						throw new Error("Empty response");
					}

					return parseNoteResponse(response);
				} catch {
					if (attempt === MAX_RETRIES) {
						throw new Error(
							"Model failed to return valid JSON after retries.",
						);
					}

					prompt = buildRetryPrompt(request.userMessage, response);
				}
			}

			throw new Error("Model failed to return valid JSON after retries.");
		} catch (error) {
			console.error(error);

			new Notice("Failed to generate note.");

			throw error;
		}
	}
}
