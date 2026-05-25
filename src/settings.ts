import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export interface MyPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("No settings yet")
			.setDesc("This plugin currently has no configurable options.");
	}
}
