import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

import {spawn} from "child_process";

var stdOut = ''
var stdErr = ''
var stdCode = 0
const syncPull = "pull"
const syncPush = "push"

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	push: string;
	pull: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	push: '/you/path/push.sh',
	pull: '/you/path/pull.sh',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();


		let runSync = (syncType: string) => {
			stdOut = ''
			let modal = new RunningModal(this.app)
			modal.open();
			try {
				// 要执行的 shell 命令
				const command = '/bin/bash';
				// 传递给 shell 的参数
				let args = ['-c', this.settings.push];
				if (syncType === syncPull) {
					args = ['-c', this.settings.pull];
				}

				console.log('--- args ',syncPull , args)
				const child = spawn(command, args, {shell: true});

				// 监听子进程的标准输出
				child.stdout.on('data', (data) => {
					console.log(`stdout: -${data}-`, typeof data);
					stdOut = data.toString()

					if (stdOut || stdOut !== '') {
						modal.contentEl.createEl("div", {text: stdOut });
					}
				});

				// 监听子进程的标准错误
				child.stderr.on('data', (data) => {
					console.error(`stderr: ${data}`);
					stdErr = data.toString()
					if (data || stdErr !== '') {
						let errorDiv = modal.contentEl.createEl("div", {text: stdErr });
						errorDiv.addClass("shell-run-error-style");
					}
				});

				// 监听子进程的退出事件
				child.on('close', (code) => {
					console.log(`子进程退出，退出码 ${code}`);
					stdCode = code ? code : -1

					if (code === 0) {
						modal.contentEl.createEl("div", {text: "success" });
					} else {
						// modal.setContent(`exit error:  ${stdErr}`)
						let errorDiv = modal.contentEl.createEl("div", {text: stdErr });
						errorDiv.addClass("shell-run-error-style");
					}
				});


			} catch (error) {
				console.log('error ', error)
				modal.contentEl.createEl("div", {text: error });
			}

		}

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('monitor-play', 'shell sync', async (evt: MouseEvent) => {
			runSync(syncPush)
		});

		// 添加快捷键
		this.addCommand({
			id: 'shell sync pull',
			name: 'shell sync(pull)',
			callback: () => {
				runSync(syncPull);
			}
		});


		this.addCommand({
			id: 'shell sync push ',
			name: 'shell sync(push)',
			callback: () => {
				runSync(syncPush);
			}
		});



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('todo');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class RunningModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("div", {text: "running"});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Pull Shell')
			.setDesc('Pull sync command line shell script for ')
			.addTextArea(text => text
				.setPlaceholder('Enter your command line shell script')
				.setValue(this.plugin.settings.pull)
				.onChange(async (value) => {
					this.plugin.settings.pull = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Push Shell')
			.setDesc('Push sync command line shell script for ')
			.addTextArea(text => text
				.setPlaceholder('Enter your command line shell script')
				.setValue(this.plugin.settings.push)
				.onChange(async (value) => {
					this.plugin.settings.push = value;
					await this.plugin.saveSettings();
				}));


	}
}
