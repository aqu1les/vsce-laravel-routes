import * as vscode from 'vscode';

export class AutoCompletionProvider implements vscode.CompletionItemProvider {
  private items: vscode.CompletionItem[] = [];

  constructor(private patterns: RegExp[]) { }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const shouldShow = this.patterns.some(pattern => !!document.lineAt(position).text.match(pattern));

    if (!shouldShow) {
      return [];
    }

    return this.items ? this.items : [];
  }

  setItems(items: vscode.CompletionItem[]) {
    this.items = items;
    return this;
  }
}