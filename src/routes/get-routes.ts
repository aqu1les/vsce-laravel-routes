import type { RouteDefinition } from "../types";
import { execAsync } from "../utils";

export async function getRoutes(path: string) {
  console.log('[Laravel Routes]: Pegando rotas para o workspace: ', path);

  try {
    const { stderr, stdout } = await execAsync(`php ${path}/artisan route:list --json`);
    if (stderr) {
      throw new Error(stderr);
    }

    const routes = JSON.parse(stdout) as RouteDefinition[];
    console.log(`[Laravel Routes]: Found: ${routes.length} routes`, path);

    return routes;
  } catch (error) {
    console.error("[Laravel Routes]: Erro:", error);
    return [];
  }
}