import {
	ItemView,
	Notice,
	Plugin,
	TFile,
	WorkspaceLeaf,
	requestUrl,
} from "obsidian";

const VIEW_TYPE_CHAT = "chat-writer-view";

class ChatComposerView extends ItemView {
	private historyEl!: HTMLDivElement;
	private inputEl!: HTMLTextAreaElement;
	private sending = false;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CHAT;
	}

	getDisplayText(): string {
		return "Chat writer";
	}

	getIcon(): string {
		return "message-square";
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("chat-composer-view");

		const shellEl = contentEl.createDiv({ cls: "chat-composer-shell" });
		shellEl.createEl("h2", { text: "Chat writer" });
		shellEl.createEl("p", {
			text: "Write a message, then save it to a new Markdown note.",
			cls: "chat-composer-subtitle",
		});

		this.historyEl = shellEl.createDiv({ cls: "chat-history" });
		this.renderMessage(
			"system",
			"Type a message and press Send to create a new markdown file.",
		);

		const inputWrapEl = shellEl.createDiv({ cls: "chat-input-wrap" });
		this.inputEl = inputWrapEl.createEl("textarea", {
			attr: {
				placeholder: "Enter a message...",
				rows: "4",
			},
		});

		const actionsEl = inputWrapEl.createDiv({ cls: "chat-actions" });
		const sendButton = actionsEl.createEl("button", {
			text: "Send",
			cls: "mod-cta",
		});

		sendButton.addEventListener("click", () => {
			void this.handleSend();
		});

		this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				void this.handleSend();
			}
		});
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	private renderMessage(role: "system" | "user", text: string): void {
		const messageEl = this.historyEl.createDiv({
			cls: ["chat-message", `chat-message-${role}`],
		});
		messageEl.setText(text);
		this.historyEl.scrollTop = this.historyEl.scrollHeight;
	}

	private async handleSend(): Promise<void> {
		if (this.sending) {
			return;
		}

		const text = this.inputEl.value.trim();
		if (!text) {
			new Notice("Enter a message first.");
			return;
		}

		this.sending = true;
		this.inputEl.value = "";
		this.renderMessage("user", text);
		this.renderMessage(
			"system",
			"Gathering vault info and generating markdown...",
		);

		try {
			// 1. Gather files from "1-tags" folder + Obsidian's native cached tags
			const folderTags: string[] = [];
			const allFiles = this.app.vault.getFiles();

			allFiles.forEach((file) => {
				if (file.path.startsWith("1-tags/")) {
					folderTags.push(file.basename);
				}
			});

			const nativeTagsObj = this.app.metadataCache.getTags();
			const nativeTags = Object.keys(nativeTagsObj).map((tag) =>
				tag.replace("#", ""),
			);

			const totalTags = Array.from(
				new Set([...folderTags, ...nativeTags]),
			);

			// 2. Gather names of other files inside "2-notes" folder
			const notesInVault: string[] = [];
			allFiles.forEach((file) => {
				if (
					file.path.startsWith("2-notes/") &&
					file.extension === "md"
				) {
					notesInVault.push(file.basename);
				}
			});

			// 3. Construct the server payload matching your new backend structure
			const requestPayload = {
				userMessage: text,
				tags: totalTags,
				"other files in vault": notesInVault,
			};

			// 4. Fire POST request to your FastAPI server
			const response = await requestUrl({
				url: "http://127.0.0.1:8000/create-note",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestPayload),
			});

			if (response.status !== 200) {
				console.error(response.text);

				throw new Error(`Server Error (${response.status})`);
			}
			// 5. Destructure the parsed data payload from your backend
			const serverData = response.json as {
				title: string;
				tags: string[];
				related_notes: string[];
				markdown: string;
			};
			// 6. Build file destination path safely using the AI-generated Title
			const baseFileName = this.buildFileName(serverData.title);
			const targetPath = `2-notes/${baseFileName}`;

			// Inject both markdown content text and the parsed structural tags array
			const fileContent = this.buildFileContent(
				serverData.markdown,
				serverData.tags,
				serverData.related_notes,
			);

			const savedFile = await this.createUniqueFile(
				targetPath,
				fileContent,
			);

			this.renderMessage("system", `Saved to ${savedFile.path}.`);
			new Notice(`Created ${savedFile.basename} in 2-notes/`);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unknown error";
			this.renderMessage("system", `Error: ${message}`);
			new Notice("Failed to create note.");
		} finally {
			this.sending = false;
		}
	}

	// Sanitizes and formats the AI-suggested title into a safe file slug
	private buildFileName(title: string): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const sanitizedTitle = title;
		// .toLowerCase()
		// .replace(/[^a-z0-9\s-]/g, "")
		// .trim()
		// .replace(/\s+/g, "-")
		// .slice(0, 30);

		return `${sanitizedTitle}.md`;
	}

	// Generates complete frontmatter dynamically containing the extracted AI tags
	private buildFileContent(
		content: string,
		tags: string[],
		relatedNotes: string[],
	): string {
		const createdAt = new Date().toISOString();

		const finalTags = Array.from(new Set(["chat-input", ...tags]));

		const yamlTags = finalTags.map((t) => `  - ${t}`).join("\n");

		const relatedLinks =
			relatedNotes.length > 0
				? relatedNotes.map((n) => `- [[${n}]]`).join("\n")
				: "None";

		return [
			"---",
			`created: ${createdAt}`,
			"tags:",
			yamlTags,
			"---",
			"",
			"## Related Notes",
			relatedLinks,
			"",
			content,
			"",
		].join("\n");
	}
	private async createUniqueFile(
		targetPath: string,
		content: string,
	): Promise<TFile> {
		const { vault } = this.app;
		const existingFile = vault.getAbstractFileByPath(targetPath);
		if (!existingFile) {
			return vault.create(targetPath, content);
		}

		const dotIndex = targetPath.lastIndexOf(".");
		const namePart =
			dotIndex >= 0 ? targetPath.slice(0, dotIndex) : targetPath;
		const extension = dotIndex >= 0 ? targetPath.slice(dotIndex) : "";

		for (let index = 2; index < 1000; index += 1) {
			const candidatePath = `${namePart} ${index}${extension}`;
			if (!vault.getAbstractFileByPath(candidatePath)) {
				return vault.create(candidatePath, content);
			}
		}

		throw new Error("Could not find a free file name.");
	}
}

export default class ChatWriterPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatComposerView(leaf));

		this.addRibbonIcon("message-square", "Open chat writer", () => {
			void this.activateView();
		});
	}

	private async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_CHAT)[0];
		const leaf = existingLeaf ?? workspace.getRightLeaf(false);

		if (!leaf) {
			return;
		}

		await leaf.setViewState({
			type: VIEW_TYPE_CHAT,
			active: true,
		});
		await workspace.revealLeaf(leaf);
	}
}
