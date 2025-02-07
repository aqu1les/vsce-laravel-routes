import * as vscode from 'vscode';
import { Signal } from 'signal-polyfill';
import { RouteDefinition } from './types';

export class CodeActionProvider implements vscode.CodeActionProvider {
  constructor(private routesSuggestions: Signal.State<Map<string, RouteDefinition>>) { }

  provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] {
    const codeActions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      const code = diagnostic.code;
      if (code === 404) {
        const action = new vscode.CodeAction('Aplicar routa sugerida', vscode.CodeActionKind.QuickFix);
        const suggestion = this.routesSuggestions.get().get(document.getText(diagnostic.range));
        if (!suggestion) {
          continue;
        }

        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, diagnostic.range, suggestion.name);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        codeActions.push(action);
      }
    }

    return codeActions;
  }
}