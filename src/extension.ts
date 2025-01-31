import * as vscode from 'vscode';
import { exec } from "child_process";
import fs from 'fs';
import path from 'path';

import { promisify } from "util";

const execAsync = promisify(exec);

const watchers: fs.FSWatcher[] = [];

export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];

	// Gerar o .d.ts logo quando a extensão é inicializada.
	generateDtsFileForWorkspaces(true);

	const disposable = vscode.commands.registerCommand('laravel-routes.generateRoutes', () => {
		generateDtsFileForWorkspaces(false);
	});

	context.subscriptions.push(disposable);

	function generateDtsFileForWorkspaces(watch = false) {
		workspaceFolders.forEach(folder => {
			if (!fs.existsSync(path.join(folder, 'routes'))) {
				console.log('[Laravel Routes]: Diretório de rotas não encontrado', folder);
				return;
			}

			if (!fs.existsSync(path.join(folder, 'artisan'))) {
				console.log('[Laravel Routes]: Arquivo artisan não encontrado ', folder);
				return;
			}

			generateDts(folder);

			if (!watch) { return; }
			watchers.push(fs.watch(path.join(folder, 'routes'), () => generateDts(folder)));
		});
	}
}

export function deactivate() {
	watchers.forEach(watcher => watcher.close());
}

async function generateDts(path: string) {
	console.log('[Laravel Routes]: Criando .d.ts para o workspace: ', path);

	try {
		const { stderr } = await execAsync(`php ${path}/artisan ziggy:generate ./node_modules/.laravel-routes/ziggy.d.ts --types-only`);
		if (stderr) {
			throw new Error(stderr);
		}

	} catch (error) {
		console.error("[Laravel Routes]: Erro:", error);
	}
}

