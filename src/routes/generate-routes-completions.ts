import * as vscode from 'vscode';

import { routeDocumentation } from './route-doc';
import { RouteDefinition } from '../types';

export function generateRoutesCompletion(routes: RouteDefinition[]) {
  return routes.map((route): vscode.CompletionItem => ({
    insertText: route.name,
    label: `${route.name}`,
    detail: `${route.uri}`,
    kind: 9,
    documentation: routeDocumentation(route),
  }));
}