import * as vscode from 'vscode';

export const CONFIG = {
  extensionName: 'Laravel Routes JS',
  extensionPrefix: 'laravel-routes-js',
  routesFolderPaths: ['routes'],
  suggestions: {
    patterns: [/route\(/gm],
  }
};


const DEFAULT_LANGUAGES = ['php', 'javascript', 'typescript', 'vue'];
export function languagesToSupport() {
  return [
    ...new Set([
      ...DEFAULT_LANGUAGES,
      ...vscode.workspace.getConfiguration(CONFIG.extensionName).get("routes.languages", DEFAULT_LANGUAGES),
    ]),
  ];
}

export function getFunctionNamePatterns() {
  return [
    ...new Set([
      ...CONFIG.suggestions.patterns,
      ...vscode.workspace.getConfiguration(CONFIG.extensionName).get("suggestions.patterns", CONFIG.suggestions.patterns),
    ]),
  ];
}

export function getRoutesFoldersPaths() {
  return [
    ...new Set([
      ...CONFIG.routesFolderPaths,
      ...vscode.workspace.getConfiguration(CONFIG.extensionName).get("routes.RoutesFolderPaths", CONFIG.routesFolderPaths),
    ]),
  ];
}