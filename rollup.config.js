const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const json = require('rollup-plugin-json');
const fs = require("fs");
const path = require('path')

module.exports = {
  // input: './src/platforms/browser/index.ts',
  inputs: [],
  globals: {
    'buffer': 'Buffer',
    'worker_threads': 'worker_threads'
  },
  plugins: [
    commonjs({}),
    json(),
    // Custom plugin for loading files as raw text
    {
      resolveId: function ( importee, importer ) {
        if ( importee.indexOf("file-loader!") === 0 ) {
                  const dirName = path.dirname(importer);
                  const filename = `${dirName}${importee.split("file-loader!.")[1]}${".js"}`;
                  let file = fs.readFileSync(`${filename}`).toString();

                  function cleanString(str, char) {
                    let found = str.indexOf(char);
                    if (found > -1) {
                      const remainder = cleanString(str.slice(found + 1), char);
                      return str.slice(0, found) + "\\" + char[0] + remainder;
                    }
                    return str;
                  }
                  file = cleanString(file, "\\");
                  file = cleanString(file, "\`");
                  file = cleanString(file, "${");
                  const jsAsText = Buffer.from(`exports.default=\`${file}\n\``);
                  fs.writeFileSync(`${filename}-text.js`, jsAsText);
                  return `${filename}-text.js`;
              }
        // if nothing is returned, we fall back to default resolution
      },
    }
  ]
}
