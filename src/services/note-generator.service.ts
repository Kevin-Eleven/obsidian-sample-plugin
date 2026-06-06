import { Notice } from "obsidian";

import { NoteRequest } from "../models/note-request";
import { NoteResponse } from "../models/note-response";

import { buildSystemPrompt } from "../prompts/note-prompt-builder";

import { LLMProvider } from "../llm/interfaces/llm-provider";

import { parseNoteResponse } from "../utils/json-parser";

export class NoteGeneratorService {
	constructor(private readonly llm: LLMProvider) {}

	async generateNote(request: NoteRequest): Promise<NoteResponse> {
		const userContext = `
USER REQUEST:
${request.userMessage}

EXISTING TAGS:
${request.tags.join(", ")}

OTHER FILES IN VAULT:
${request.otherFiles.join(", ")}
`;

		try {
			const response = await this.llm.generateJson({
				systemPrompt: buildSystemPrompt(),
				userPrompt: userContext,
			});

			return parseNoteResponse(response);
		} catch (error) {
			console.error(error);

			new Notice("Failed to generate note.");

			throw error;
		}
	}
}
