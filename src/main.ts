import { ItemView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

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

		try {
			const fileName = this.buildFileName(text);
			const fileContent = this.buildFileContent(text);
			const savedFile = await this.createUniqueFile(
				fileName,
				fileContent,
			);

			this.renderMessage("system", `Saved to ${savedFile.path}.`);
			new Notice(`Created ${savedFile.basename}`);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unknown error";
			this.renderMessage("system", `Could not save the note: ${message}`);
			new Notice("Failed to create note.");
		} finally {
			this.sending = false;
		}
	}

	private buildFileName(text: string): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const snippet = text
			.slice(0, 24)
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.trim()
			.replace(/\s+/g, "-")
			.slice(0, 24);
		return `${timestamp}-${snippet || "chat-note"}.md`;
	}

	private buildFileContent(text: string): string {
		const createdAt = new Date().toISOString();
		return [
			"---",
			`created: ${createdAt}`,
			"tags:",
			"  - chat-input",
			"---",
			"",
			text,
			"",
		].join("\n");
	}

	private async createUniqueFile(
		baseName: string,
		content: string,
	): Promise<TFile> {
		const { vault } = this.app;
		const existingFile = vault.getAbstractFileByPath(baseName);
		if (!existingFile) {
			return vault.create(baseName, content);
		}

		const dotIndex = baseName.lastIndexOf(".");
		const namePart = dotIndex >= 0 ? baseName.slice(0, dotIndex) : baseName;
		const extension = dotIndex >= 0 ? baseName.slice(dotIndex) : "";

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
	onload(): void {
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
