import { z } from "zod";

export const NoteResponseSchema = z
	.object({
		title: z.string(),
		tags: z.array(z.string()),
		related_notes: z.array(z.string()),
		content: z.string(),
	})
	.transform((data) => ({
		title: data.title,
		tags: data.tags,
		relatedNotes: data.related_notes,
		content: data.content,
	}));

export type NoteResponse = z.infer<typeof NoteResponseSchema>;
