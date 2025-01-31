import fs from "fs";
import path from "path";
import ts from "typescript";

function init(modules: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const workspacePath = info.project.getCurrentDirectory();
      const typesPath = path.join(workspacePath, "node_modules", ".laravel-routes");

      info.project.projectService.logger.info(`[Laravel Routes]: Iniciado no workspace: ${workspacePath}`);

      fs.readdir(typesPath, (err, files) => {
        const dtsFiles = files.filter(file => file.endsWith('.d.ts'));
        dtsFiles.forEach(file => file ? addDtsFile(file) : null);
      });

      const watcher = fs.watch(typesPath, (event, filename) => {
        if (filename && event === 'rename' && filename.endsWith('.d.ts')) {
          addDtsFile(filename);
        }
      });

      function addDtsFile(fileName: string) {
        const fullpath = path.join(typesPath, fileName);

        info.project.addMissingFileRoot(modules.typescript.server.asNormalizedPath(fullpath));
        info.project.projectService.logger.info(`[Laravel Routes]: Arquivo .d.ts adicionado ${fullpath}`);
      }

      return info.languageService;
    },
  };
}

export = init;
