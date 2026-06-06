import { App } from "obsidian";

export interface VaultContext {
	tags: string[];
	otherFiles: string[];
}

export class VaultService {
	constructor(private readonly app: App) {}

	getVaultContext(): VaultContext {
		const allFiles = this.app.vault.getFiles();

		const folderTags: string[] = [];

		allFiles.forEach((file) => {
			if (file.path.startsWith("1-tags/")) {
				folderTags.push(file.basename);
			}
		});

		const nativeTags: string[] = [];

		for (const file of allFiles) {
			const cache = this.app.metadataCache.getFileCache(file);

			const tags = cache?.tags ?? [];

			for (const tag of tags) {
				nativeTags.push(tag.tag.replace("#", ""));
			}
		}
		const tags = Array.from(new Set([...folderTags, ...nativeTags]));

		const otherFiles: string[] = [];

		allFiles.forEach((file) => {
			if (file.path.startsWith("2-notes/") && file.extension === "md") {
				otherFiles.push(file.basename);
			}
		});

		return {
			tags,
			otherFiles,
		};
	}
}
