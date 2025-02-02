import * as vscode from 'vscode';

import { getRoutes } from "./get-routes";
import { routeDocumentation } from './route-doc';

export async function generateRoutesCompletion(folder: string) {
  const routes = await getRoutes(folder);

  return routes.map((route): vscode.CompletionItem => ({
    insertText: route.name,
    label: `${route.name}`,
    detail: `${route.uri}`,
    kind: 4,
    documentation: routeDocumentation(route),
  }));
}