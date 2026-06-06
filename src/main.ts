import { Plugin } from "obsidian";

import { ChatComposerView, VIEW_TYPE_CHAT } from "./ui/chat-view";

import {
	ChatWriterSettings,
	DEFAULT_SETTINGS,
} from "./settings/plugin-settings";

import { ChatWriterSettingTab } from "./settings/settings-tab";

import { LLMFactory } from "./llm/llm-factory";

import { NoteGeneratorService } from "./services/note-generator.service";

export default class ChatWriterPlugin extends Plugin {
	public settings!: ChatWriterSettings;

	public noteGenerator?: NoteGeneratorService;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.initializeServices();

		this.registerView(
			VIEW_TYPE_CHAT,
			(leaf) => new ChatComposerView(leaf, this),
		);

		this.addSettingTab(new ChatWriterSettingTab(this.app, this));

		this.addRibbonIcon("message-square", "Open Chat Writer", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-chat-writer",
			name: "Open Chat Writer",
			callback: () => {
				void this.activateView();
			},
		});
	}

	onunload(): void {
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_CHAT)
			.forEach((leaf) => leaf.detach());
	}

	private initializeServices(): void {
		if (
			!this.settings.groqApiKey ||
			this.settings.groqApiKey.trim() === ""
		) {
			return;
		}

		const provider = LLMFactory.create(this.settings);

		this.noteGenerator = new NoteGeneratorService(provider);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);

		// Recreate services whenever settings change
		this.initializeServices();
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
