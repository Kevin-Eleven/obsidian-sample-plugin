export interface JsonOutputOptions {
	includeTags: boolean;
	includeRelatedNotes: boolean;
}

export function buildJsonOutputRules(options: JsonOutputOptions): string {
	const tagRule = options.includeTags
		? `
The tags field should contain relevant tags.
Prefer tags from the provided AVAILABLE TAGS list.
`
		: `
The tags field must be an empty array.
`;

	const relatedRule = options.includeRelatedNotes
		? `
The related_notes field should contain relevant existing notes.
Prefer note titles from the provided OTHER NOTES list.
`
		: `
The related_notes field must be an empty array.
`;

	return `
OUTPUT FORMAT RULES

Return ONLY valid JSON.

Schema:

{
  "title": "string",
  "tags": ["tag1", "tag2"],
  "related_notes": ["note1", "note2"],
  "content": "markdown content"
}

${tagRule}

${relatedRule}

Do not wrap JSON in markdown code fences.

Do not add explanations.

Do not add notes outside JSON.

The content field must contain only markdown.
`;
}
