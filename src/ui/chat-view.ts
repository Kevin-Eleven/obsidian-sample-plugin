import { ItemView, Notice, WorkspaceLeaf } from "obsidian";

import ChatWriterPlugin from "../main";

import { VaultService } from "../services/vault.service";
import { NoteGeneratorService } from "../services/note-generator.service";

import {
	buildFileContent,
	buildFileName,
	createUniqueFile,
} from "../utils/file-utils";

export const VIEW_TYPE_CHAT = "chat-writer-view";

export class ChatComposerView extends ItemView {
	private historyEl!: HTMLDivElement;

	private inputEl!: HTMLTextAreaElement;

	private sending = false;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: ChatWriterPlugin,
	) {
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

		const shell = contentEl.createDiv();

		shell.createEl("h2", {
			text: "Chat writer",
		});

		this.historyEl = shell.createDiv();

		this.renderMessage("system", "Type a prompt to generate a note.");

		this.inputEl = shell.createEl("textarea", {
			attr: {
				rows: "5",
			},
		});

		const sendButton = shell.createEl("button", {
			text: "Send",
		});

		sendButton.addEventListener("click", () => {
			void this.handleSend();
		});
	}

	private renderMessage(role: "system" | "user", text: string): void {
		const message = this.historyEl.createDiv();

		message.setText(`[${role}] ${text}`);
	}

	private async handleSend(): Promise<void> {
		if (this.sending) {
			return;
		}

		const userMessage = this.inputEl.value.trim();

		if (!userMessage) {
			new Notice("Enter a message first.");

			return;
		}

		if (!this.plugin.settings.groqApiKey) {
			new Notice("Configure Groq API key in settings.");

			return;
		}

		this.sending = true;

		this.inputEl.value = "";

		this.renderMessage("user", userMessage);

		try {
			const vaultService = new VaultService(this.app);

			const context = vaultService.getVaultContext();
			if (!this.plugin.noteGenerator) {
				this.plugin.initializeServices();

				if (!this.plugin.noteGenerator) {
					throw new Error("Groq API key not configured.");
				}
			}
			const note = await this.plugin.noteGenerator.generateNote({
				userMessage,
				tags: context.tags,
				otherFiles: context.otherFiles,
			});

			const fileContent = buildFileContent(
				note.content,
				note.tags,
				note.relatedNotes,
			);

			const fileName = buildFileName(note.title);

			const savedFile = await createUniqueFile(
				this.app.vault,
				`2-notes/${fileName}`,
				fileContent,
			);

			this.renderMessage("system", `Saved to ${savedFile.path}`);

			new Notice(`Created ${savedFile.basename}`);
		} catch (error) {
			console.error(error);

			new Notice("Failed to generate note.");
		} finally {
			this.sending = false;
		}
	}
}
