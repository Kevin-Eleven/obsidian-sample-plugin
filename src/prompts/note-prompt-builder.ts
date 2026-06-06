import { SYSTEM_PROMPT } from "./system-prompt";
import { JSON_OUTPUT_RULES } from "./json-output-rules";
import { MARKDOWN_RULES } from "./markdown-rules";
import { LATEX_RULES } from "./latex-rules";
import { CALLOUT_RULES } from "./callout-rules";
import { MERMAID_RULES } from "./mermaid-rules";
import { NOTE_QUALITY_RULES } from "./note-quality-rules";

export function buildSystemPrompt(): string {
	return [
		SYSTEM_PROMPT,
		JSON_OUTPUT_RULES,
		MARKDOWN_RULES,
		LATEX_RULES,
		CALLOUT_RULES,
		MERMAID_RULES,
		NOTE_QUALITY_RULES,
	].join("\n\n");
}
