export const JSON_OUTPUT_RULES = `
OUTPUT FORMAT RULES

Return ONLY valid JSON.

Schema:

{
  "title": "string",
  "tags": ["tag1", "tag2"],
  "related_notes": ["note1", "note2"],
  "content": "markdown content"
}

Do not wrap JSON in markdown code fences.

Do not add explanations.

Do not add notes outside JSON.

The content field must contain only markdown.
`;
