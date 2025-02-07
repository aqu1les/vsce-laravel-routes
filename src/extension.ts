import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import Fuse from 'fuse.js';
import { Signal } from 'signal-polyfill';

import { AutoCompletionProvider } from './completion-provider';
import { generateRoutesCompletion } from './routes/generate-routes-completions';
import { CONFIG, getFunctionNamePatterns, getRoutesFoldersPaths, languagesToSupport } from './config';
import { RouteDefinition } from './types';
import { getRoutes } from './routes/get-routes';
import { CodeActionProvider } from './code-action-provider';


const watchers: fs.FSWatcher[] = [];
const routes = new Signal.State(new Map<string, RouteDefinition>());
const routesSuggestions = new Signal.State(new Map<string, RouteDefinition>());

// TODO: handle multiple workspaces.
export async function activate(context: vscode.ExtensionContext) {
	const supportedLanguages = languagesToSupport();
	const fnNamePatterns = getFunctionNamePatterns();
	const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];

	const diagnosticCollection = vscode.languages.createDiagnosticCollection(CONFIG.extensionName);
	context.subscriptions.push(diagnosticCollection);

	const commandDisposable = vscode.commands.registerCommand('laravel-routes-js.loadRoutes', async () => {
		await findRoutesAndCache(workspaceFolders);
		routesSuggestions.set(new Map<string, RouteDefinition>());

		setCompletionItems(completionProvider);

		vscode.window.showInformationMessage(vscode.l10n.t('Rotas mapeadas com sucesso!'));
	});

	context.subscriptions.push(commandDisposable);

	const onChangeTextDocDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
		if (!supportedLanguages.includes(event.document.languageId) || event.document.isClosed) {
			return;
		}

		// todo: get in between start + end lines.
		const linesChanged = event.contentChanges.map(change => [change.range.start.line, change.range.end.line]).flat();

		linesChanged.forEach(lineNumber => {
			updateRoutesUsageStateOnLine(event.document, diagnosticCollection, event.document.lineAt(lineNumber));
		});
	});

	context.subscriptions.push(onChangeTextDocDisposable);

	const onDocOpenDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
		if (!editor) {
			return;
		}

		if (!supportedLanguages.includes(editor.document.languageId) || editor.document.isClosed) {
			return;
		}

		searchRoutesUsageOn(editor.document, fnNamePatterns, diagnosticCollection);
	});

	context.subscriptions.push(onDocOpenDisposable);

	const completionProvider = new AutoCompletionProvider(getFunctionNamePatterns());
	const completionForLanguages = registerCompletionProviderForLanguages(supportedLanguages, completionProvider);
	context.subscriptions.push(...completionForLanguages);

	const codeActionsDisposables = supportedLanguages.map(language => vscode.languages.registerCodeActionsProvider(language, new CodeActionProvider(routesSuggestions), {
		providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
	}));

	context.subscriptions.push(...codeActionsDisposables);

	await findRoutesAndCache(workspaceFolders);
	setCompletionItems(completionProvider);

	if (vscode.window.activeTextEditor) {
		if (supportedLanguages.includes(vscode.window.activeTextEditor.document.languageId)) {
			searchRoutesUsageOn(vscode.window.activeTextEditor.document, fnNamePatterns, diagnosticCollection, false);
		}
	}



	watchers.push(...watchRoutesFolders(completionProvider, workspaceFolders));
}

export function deactivate() {
	watchers.forEach(watcher => watcher.close());
}

function registerCompletionProviderForLanguages(languages: string[], completionProvider: AutoCompletionProvider) {
	return languages.map(language => vscode.languages.registerCompletionItemProvider({ language }, completionProvider, "'", '"', '`'));
}

function setCompletionItems(completionProvider: AutoCompletionProvider) {
	const items = generateRoutesCompletion([...routes.get().values()]);
	completionProvider.setItems(items);
	console.log(`[Laravel Routes]: Set ${items.length} items for complete`);

	// TODO: handle multiple workspaces.
	// Só adicionar rotas do workspace atual
}

function watchRoutesFolders(completionProvider: AutoCompletionProvider, workspaces: string[]) {
	const routesPath = getRoutesFoldersPaths();

	return workspaces.map(workspace => routesPath.map(dir => {
		const watchTarget = path.join(workspace, dir);
		console.log(`[Laravel Routes]: Listening for changes on ${watchTarget}`);

		return fs.watch(watchTarget, async () => {
			await findRoutesAndCache(workspaces);
			routesSuggestions.set(new Map<string, RouteDefinition>());

			setCompletionItems(completionProvider);
		});
	})).flat();
}

async function findRoutesAndCache(workspaces: string[]) {
	for (const workspace of workspaces) {
		if (!fs.existsSync(path.join(workspace, 'artisan'))) {
			console.log('[Laravel Routes]: artisan file not found', workspace);
			continue;
		}

		// TODO: handle multiple workspaces.
		const workspaceRoutes = await getRoutes(workspace);
		routes.set(new Map<string, RouteDefinition>([...workspaceRoutes, ...routes.get().values()].map((route) => [route.name, route])));
	}
}

async function searchRoutesUsageOn(textDocument: vscode.TextDocument, fnNamePatterns: RegExp[], diagnosticCollection: vscode.DiagnosticCollection, checkExistingDiag = true) {
	for await (const line of lines(textDocument)) {
		updateRoutesUsageStateOnLine(textDocument, diagnosticCollection, line, checkExistingDiag);
	}
}

function updateRoutesUsageStateOnLine(textDocument: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection, line: vscode.TextLine, checkExistingDiag = true) {
	let diagnostics = diagnosticCollection.get(textDocument.uri);

	// Se linha for vazia, remover diagnostics dessa linha.
	if (line.isEmptyOrWhitespace && diagnostics?.length) {
		const unrelated = diagnostics.filter(d => d.range.start.line !== line.lineNumber);
		diagnosticCollection.set(textDocument.uri, unrelated);
		return;
	}

	if (checkExistingDiag && diagnostics?.length) {
		const validDiagnostics = diagnostics.map(diag => {
			// Só alteramos/apagamos diag da linha atual.
			if (diag.range.start.line !== line.lineNumber) {
				return diag;
			}
			// Só alteramos/apagamos diag da linha atual.
			if (diag.range.end.line !== line.lineNumber) {
				return diag;
			}

			const rangeText = line.text.slice(diag.range.start.character, diag.range.end.character);
			const validChars = /([\w\.]*)/gm.exec(rangeText);
			if (!validChars) {
				return null;
			}

			const routeName = validChars[1];
			if (!routeName.length) {
				return null;
			}

			// Aqui nós atualizamos a posição do diagnostic pra não ficar de forma bêbada no editor.
			const start = new vscode.Position(line.lineNumber, diag.range.start.character + validChars.index);
			const end = new vscode.Position(line.lineNumber, diag.range.start.character + validChars.index + routeName.length);
			diag.range = new vscode.Range(start, end);

			return diag;
		}).filter(Boolean) as vscode.Diagnostic[];

		diagnosticCollection.set(textDocument.uri, validDiagnostics);
		diagnostics = diagnosticCollection.get(textDocument.uri);
	}

	// TODO: Customizable fn name patterns
	const matches = line.text.matchAll(/(?<=route\(['`"])(.*?)(?=['`"]\))/gm);
	for (const match of matches) {
		const routeName = match[1];

		const start = new vscode.Position(line.lineNumber, match.index);
		const end = new vscode.Position(line.lineNumber, match.index + routeName.length);
		const range = new vscode.Range(start, end);

		if (routeName.length === 0) {
			continue;
		}

		if (routes.get().has(routeName)) {
			if (diagnostics && diagnostics.length) {
				const unrelated = diagnostics.filter(d => !(d.range.start.line === start.line && d.range.start.character === start.character));
				diagnosticCollection.set(textDocument.uri, unrelated);
			}
			continue;
		}

		const suggestion = getRouteSuggestionFor(routeName);

		const message = suggestion ? `Rota não encontrada, você quis dizer \`${suggestion.name}\`?` : 'Rota não encontrada.';
		const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
		diagnostic.source = CONFIG.extensionName;
		diagnostic.code = 404;

		let diagnosticExists = false;
		const updatedDiagnostics = diagnostics?.map(d => {
			if (d.range.start.line === start.line && d.range.start.character === start.character) {
				diagnosticExists = true;
				return diagnostic;
			}

			return d;
		}) ?? [];


		if (!diagnosticExists) {
			updatedDiagnostics.push(diagnostic);
		}

		diagnosticCollection.set(textDocument.uri, updatedDiagnostics);
		diagnostics = diagnosticCollection.get(textDocument.uri);
	}
}

function* lines(textDocument: vscode.TextDocument) {
	let currentLine = 0;

	while (currentLine < textDocument.lineCount) {
		// Line at é 0 based... Foda.
		yield textDocument.lineAt(currentLine);
		currentLine++;
	}
}

function getRouteSuggestionFor(routeName: string) {
	const cached = routesSuggestions.get().get(routeName);
	if (cached) {
		return cached;
	}

	const fuse = new Fuse([...routes.get().values()], { keys: ['name', 'uri'] });
	const suggestion = fuse.search(routeName)[0];
	if (suggestion) {
		routesSuggestions.set(routesSuggestions.get().set(routeName, suggestion.item));
	}

	return suggestion.item;
}