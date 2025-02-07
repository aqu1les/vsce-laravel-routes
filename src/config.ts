import * as vscode from 'vscode';

export const CONFIG = {
  extensionName: 'Laravel Routes JS',
  extensionPrefix: 'laravel-routes-js',
  routesFolderPaths: ['routes'],
  suggestions: {
    patterns: ['/route\\(/gm'],
  }
} as const;


const DEFAULT_LANGUAGES = ['php', 'javascript', 'typescript', 'vue'];
export function languagesToSupport() {
  return [
    ...new Set([
      ...DEFAULT_LANGUAGES,
      ...vscode.workspace.getConfiguration(CONFIG.extensionPrefix).get("routes.languages", DEFAULT_LANGUAGES),
    ]),
  ];
}

export function getFunctionNamePatterns() {
  const patterns = [
    ...new Set([
      ...CONFIG.suggestions.patterns,
      ...vscode.workspace.getConfiguration(CONFIG.extensionPrefix).get("suggestions.patterns", CONFIG.suggestions.patterns),
    ]),
  ];

  return patterns.map(pattern => {
    const match = pattern.match(/^\/(.+)\/([gimsuy]*)$/);

    if (!match) {
      return null;
    }

    return new RegExp(match[1], match[2]);
  }).filter(Boolean) as RegExp[];
}

export function getRoutesFoldersPaths() {
  return [
    ...new Set([
      ...CONFIG.routesFolderPaths,
      ...vscode.workspace.getConfiguration(CONFIG.extensionPrefix).get("routes.routesFolderPaths", CONFIG.routesFolderPaths),
    ]),
  ];
}