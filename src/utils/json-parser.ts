import { NoteResponse, NoteResponseSchema } from "../models/note-response";

export function parseNoteResponse(rawResponse: string): NoteResponse {
	let parsed: unknown;

	try {
		parsed = JSON.parse(rawResponse);
	} catch {
		throw new Error("Model returned invalid JSON.");
	}

	const validationResult = NoteResponseSchema.safeParse(parsed);

	if (!validationResult.success) {
		console.error(validationResult.error);

		throw new Error("Model response failed validation.");
	}

	return validationResult.data;
}
