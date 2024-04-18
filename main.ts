import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { spawn } from "child_process";

var stdOut = ''
var stdErr = ''
var stdCode = 0

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	cmd: string;
	pull: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	cmd: '',
	pull: '',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();


		let runSync = () => {
			if (!this.settings.cmd) {
				new Notice(`sync shell empty.`);
				return;
			}

			stdOut = "running..."

			let modal = new RunningModal(this.app)
			modal.open();
			try {
				// 要执行的 shell 命令
				const command = 'sh';
				// 传递给 shell 的参数
				const args = ['-c', this.settings.cmd];
				const child = spawn(command, args, { shell: true });

				// 监听子进程的标准输出
				child.stdout.on('data', (data) => {
					console.log(`stdout: -${data}-`, typeof data);
					stdOut = data.toString().replace(/\n/g, '')
					
					if (stdOut && stdOut !== '') {
						modal.setContent(`stdCode: ${stdCode}, \nstdOut: ${stdOut}  \nstdErr:  ${stdErr}`)
					}
				});
				
				// 监听子进程的标准错误
				child.stderr.on('data', (data) => {
					console.error(`stderr: ${data}`);
					stdErr = data.toString().replace(/\n/g, '')
	
					if (data && stdErr !== '') {
						// modal.containerEl = `stdCode: ${stdCode} \nstdOut: ${stdOut}  \nstdErr:  ${stdErr}`
						modal.setContent(`stdError: ${stdErr}.`)
					}
				});
				
				// 监听子进程的退出事件
				child.on('close', (code) => {
					console.log(`子进程退出，退出码 ${code}`);
					stdCode = code ? code : -1
					
					if (code === 0 ) {
						modal.setContent(`success. \nstdOut: ${stdOut}`)
					} else {
						modal.setContent(`stdCode: ${stdCode}, \nstdErr:  ${stdErr}`)
					}
				});

				
			} catch (error) {
				console.log('error ', error)
				modal.setContent("error: " + error)
			}			

		}

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('monitor-play', 'shell sync', async (evt: MouseEvent) => {

			runSync()
			// new Notice('Executing >_ ' + this.settings.cmd);

			// try {
			// 	const output = execSync(this.settings.cmd);
			// 	new Notice(`FINISHED: ${output.toString()}`);
			//   } catch (error) {
			// 	new Notice(`ERROR: ${error.message}`);
			//   }

			// exec(this.settings.cmd, (error, stdout, stderr) => {
			// 	if (error) {
			// 	  new Notice(`ERROR: ${error.message}`);
			// 	  return;
			// 	}
			// 	if (stderr) {
			// 	  new Notice(`ERROR: ${stderr}`);
			// 	  return;
			// 	}

			// 	new Notice(`FINISHED: ${stdout}`);
			// });

		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// 添加状态栏文字
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// 添加快捷键
		this.addCommand({
			id: 'shell sync',
			name: 'shell sync',
			callback: () => {
				// new SampleModal(this.app).open();
				runSync();
			}
		});

		// 
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'shell-sync-command',
		// 	name: 'shell sync command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'shell sync',
		// 	name: 'shell sync',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click ---- ', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
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
		contentEl.setText("shell sync: \n running ....");
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
			.setName('Shell')
			.setDesc('Command line shell script')
			.addText(text => text
				.setPlaceholder('Enter your command line shell script')
				.setValue(this.plugin.settings.cmd)
				.onChange(async (value) => {
					this.plugin.settings.cmd = value;
					await this.plugin.saveSettings();
				}));
	}
}
