import { TFile, Vault } from "obsidian";

export function buildFileName(title: string): string {
	const sanitizedTitle = title.trim().replace(/[\\/:*?"<>|]/g, "");

	return `${sanitizedTitle}.md`;
}

export async function createUniqueFile(
	vault: Vault,
	targetPath: string,
	content: string,
): Promise<TFile> {
	const existing = vault.getAbstractFileByPath(targetPath);

	if (!existing) {
		return vault.create(targetPath, content);
	}

	const dotIndex = targetPath.lastIndexOf(".");

	const namePart = dotIndex >= 0 ? targetPath.slice(0, dotIndex) : targetPath;

	const extension = dotIndex >= 0 ? targetPath.slice(dotIndex) : "";

	for (let i = 2; i < 1000; i++) {
		const candidate = `${namePart} ${i}${extension}`;

		if (!vault.getAbstractFileByPath(candidate)) {
			return vault.create(candidate, content);
		}
	}

	throw new Error("Unable to create unique file.");
}

export function buildFileContent(
	content: string,
	tags: string[],
	relatedNotes: string[],
): string {
	const createdAt = new Date().toISOString();

	const finalTags = Array.from(new Set([...tags]));

	const yamlTags = finalTags.map((tag) => `  - ${tag}`).join("\n");

	const relatedLinks =
		relatedNotes.length > 0
			? relatedNotes.map((note) => `- [[${note}]]`).join("\n")
			: "None";

	// if relateed none dont add the section at all

	return [
		"---",
		`created: ${createdAt}`,
		"tags:",
		yamlTags,
		"---",
		...(relatedNotes.length > 0
			? [
					"Related Notes",
					relatedNotes.map((note) => `- [[${note}]]`).join(" "),
					"---",
					"",
				]
			: []),
		content,
	].join("\n");
}
