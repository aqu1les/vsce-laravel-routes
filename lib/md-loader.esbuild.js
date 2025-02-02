/**
 * Plugin para importar arquivos .md como string
 * @type {import('esbuild').Plugin}
 */
module.exports = {
  name: "markdown-loader",
  setup(build) {
    build.onLoad({ filter: /\.md$/ }, async (args) => {
      
      const fs = require("fs");
      const contents = await fs.promises.readFile(args.path, "utf8");

      return {
        contents: `export default ${JSON.stringify(contents)};`,
        loader: "js",
      };
    });
  },
};
