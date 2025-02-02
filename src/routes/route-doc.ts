import * as vscode from 'vscode';
import { renderString } from "nunjucks";
import template from './route-doc.md';
import { RouteDefinition } from "../types";

export function routeDocumentation(route: RouteDefinition) {
  const result = renderString(template, {
    uri: route.uri,
    methods: route.method.split("|").join(", "),
    middlewares: route.middleware.filter(Boolean),
    action: route.action,
    domain: route.domain
  });

  return new vscode.MarkdownString(result);
}