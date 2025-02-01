import * as vscode from 'vscode';
import { exec } from "child_process";
import fs from 'fs';
import path from 'path';

import { promisify } from "util";

const execAsync = promisify(exec);

type RouteDefinition = {
	uri: string;
	name: string;
	action: string;
	domain: string | null;
	method: string;
	middleware: string[];
};

class AutoCompletionProvider implements vscode.CompletionItemProvider {
	constructor(private items: vscode.CompletionItem[] = []) { }

	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		if (!document.lineAt(position).text.includes('route(')) {
			return [];
		}

		return this.items ? this.items : [];
	}
	setItems(items: vscode.CompletionItem[]) {
		this.items = items;
		return this;
	}
}

const watchers: fs.FSWatcher[] = [];

export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];

	const disposable = vscode.commands.registerCommand('laravel-routes.generateRoutes', () => {
		findRoutesAndSetCompletion(false);
	});

	context.subscriptions.push(disposable);

	const completionProvider = new AutoCompletionProvider();
	context.subscriptions.push(...registerCompletionProviderForLanguages(['php', 'javascript', 'typescript', 'vue'], completionProvider));

	findRoutesAndSetCompletion(true);

	function findRoutesAndSetCompletion(watch = false) {
		workspaceFolders.forEach(async folder => {
			if (!fs.existsSync(path.join(folder, 'artisan'))) {
				console.log('[Laravel Routes]: Arquivo artisan não encontrado ', folder);
				return;
			}

			const items = await getCompletionItems(folder);
			completionProvider.setItems(items);

			if (!watch) { return; }
			watchers.push(fs.watch(path.join(folder, 'routes'), async () => {
				const items = await getCompletionItems(folder);
				completionProvider.setItems(items);
			}));
		});
	}
}

export function deactivate() {
	watchers.forEach(watcher => watcher.close());
}

async function getCompletionItems(folder: string) {
	const routes = await getRoutes(folder);

	return routes.map((route): vscode.CompletionItem => ({
		insertText: route.name,
		label: `${route.name}`,
		detail: `${route.uri}`,
		kind: 4,
		documentation: routeDocumentation(route),
	}));
}

async function getRoutes(path: string) {
	console.log('[Laravel Routes]: Pegando rotas para o workspace: ', path);

	try {
		const { stderr, stdout } = await execAsync(`php ${path}/artisan route:list --json`);
		if (stderr) {
			throw new Error(stderr);
		}

		return JSON.parse(stdout) as RouteDefinition[];
	} catch (error) {
		console.error("[Laravel Routes]: Erro:", error);
		return [];
	}
}


function routeDocumentation(route: RouteDefinition) {
	const methods = route.method.split('|').join(', ');
	const middlewares = `* ${route.middleware.filter(Boolean).join('\n* ')}`;

	let result = `#### URL\n${route.uri}\n#### Methods\n${methods}\n#### Middlewares\n${middlewares}\n#### Action\n${route.action}`;

	if (route.domain) {
		result = result += `\n#### Domain\n${route.domain}`;
	}

	return new vscode.MarkdownString(result);
}

function registerCompletionProviderForLanguages(languages: string[], completionProvider: AutoCompletionProvider) {
	return languages.map(language => vscode.languages.registerCompletionItemProvider({ language }, completionProvider, "'", '"'));
}