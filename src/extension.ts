import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

import { AutoCompletionProvider } from './completion-provider';
import { generateRoutesCompletion } from './routes/generate-routes-completions';
import { getFunctionNamePatterns, getRoutesFoldersPaths, languagesToSupport } from './config';

const watchers: fs.FSWatcher[] = [];

export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];

	const disposable = vscode.commands.registerCommand('laravel-routes-js.loadRoutes', async () => {
		await findRoutesAndSetCompletion(completionProvider, workspaceFolders);
		vscode.window.showInformationMessage(vscode.l10n.t('Rotas mapeadas com sucesso!'));
	});

	context.subscriptions.push(disposable);

	const completionProvider = new AutoCompletionProvider(getFunctionNamePatterns());
	const completionForLanguages = registerCompletionProviderForLanguages(languagesToSupport(), completionProvider);
	context.subscriptions.push(...completionForLanguages);

	findRoutesAndSetCompletion(completionProvider, workspaceFolders);

	watchers.push(...watchRoutesFolders(completionProvider, workspaceFolders));
}

export function deactivate() {
	watchers.forEach(watcher => watcher.close());
}

function registerCompletionProviderForLanguages(languages: string[], completionProvider: AutoCompletionProvider) {
	return languages.map(language => vscode.languages.registerCompletionItemProvider({ language }, completionProvider, "'", '"', '`'));
}

async function findRoutesAndSetCompletion(completionProvider: AutoCompletionProvider, folders: string[]) {
	for (const folder of folders) {
		if (!fs.existsSync(path.join(folder, 'artisan'))) {
			console.log('[Laravel Routes]: artisan file not found', folder);
			continue;
		}

		const items = await generateRoutesCompletion(folder);
		completionProvider.setItems(items);
	}
}

function watchRoutesFolders(completionProvider: AutoCompletionProvider, workspaces: string[]) {
	const routesPath = getRoutesFoldersPaths();

	return workspaces.map(workspace => routesPath.map(dir => {
		const watchTarget = path.join(workspace, dir);
		console.log(`[Laravel Routes]: Listening for changes on ${watchTarget}`);

		return fs.watch(watchTarget, async () => {
			const items = await generateRoutesCompletion(workspace);
			completionProvider.setItems(items);
		});
	})).flat();
}
