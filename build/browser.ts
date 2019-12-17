import * as fs from "fs";
import * as path from "path";
import * as rollup from "rollup";
import * as resolve from "rollup-plugin-node-resolve";
import * as rollupConfig from "@root/rollup.config.js";
import { envIndexReplace } from "./processing/env-index-replace";
import * as Terser from "terser";
import { srcRoot as getSrcRoot, browserRoot } from "./utility/app-root";

const srcRoot = getSrcRoot();
const root = browserRoot();
const minify = false;

envIndexReplace(root, "browser/env-index", (err) => {
    if (err) {
        console.log(err);
        return;
    }
});

rollupConfig.plugins.splice(0, 0,
resolve({
  browser: true,
  preferBuiltins: false
}));

rollupConfig.inputs.push({
  inputOptions: {
    input: `${root}/src/platforms/browser/browser-worker-loader/browser-worker-loader-ext.js`
  },
  outputOptions: {
    file: `${root}/src/platforms/browser/browser-worker-loader/browser-worker-loader-ext.js`,
    name: "workerRuntime",
    format: "umd"
  }
},
{
  inputOptions: {
    input: `${root}/src/platforms/browser/browser-worker-loader/browser-worker-loader-prepend.js`
  },
  outputOptions: {
    file: `${root}/src/platforms/browser/browser-worker-loader/browser-worker-loader-prepend.js`,
    name: "workerRuntime",
    format: "umd"
  }
},
{
  inputOptions: {
    input: `${root}/src/core/worker/worker-runtime.js`
  },
  outputOptions: {
    file: `${root}/src/core/worker/worker-runtime.js`,
    name: "workerRuntime",
    format: "umd"
  }
});

rollupConfig.inputs.push({
  inputOptions: {
      input: `${root}/src/platforms/browser/index.js`
  },
  outputOptions: {
      file: "dist/bundle.browser.js",
      name: "actorRuntime",
      format: "esm"
  }
});

const browserFix = `var global = typeof global !== 'undefined' ? global : self;`;
const bufferFix = `global["Buffer"] = typeof Buffer !== 'undefined' ? Buffer : Buffer$1;`;
async function loop(i, inputConfig) {
  if (i === inputConfig.inputs.length) {
    return;
  }

  const config = inputConfig.inputs[i];
  const inputOptions = config.inputOptions;
  inputOptions.plugins = inputConfig.plugins;

  const outputOptions = config.outputOptions;
  outputOptions.globals = inputConfig.globals;

  async function build() {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);
    // generate code and a sourcemap
    const { code, map } = await bundle.generate(outputOptions);
    // or write the bundle to disk
    await bundle.write(outputOptions);

    // This fixes the bundle for use in the browser
    const filename = outputOptions.file;
    let file = fs.readFileSync(`${filename}`).toString();
    file = file.replace("(function (global, factory) {", `(function (global, factory) {${browserFix}`);
    file = file.replace("}(this, (function () { 'use strict';", `}(this, (function () { 'use strict';${browserFix}`);
    file = file.replace("function Buffer$1 (arg, encodingOrOffset, length) {", `${bufferFix}function Buffer$1 (arg, encodingOrOffset, length) {`);

    let buf;
    if (minify) {
      // Minify
      const min = Terser.minify(file);
      buf = Buffer.from(min.code);
    } else {
      // Don't minify
      buf = Buffer.from(file);
    }

    fs.writeFileSync(`${filename}`, buf);

  }
  await build();
  await loop(i + 1, inputConfig);
}

// Config
let buildType = "all";
for (let i = 1; i < process.argv.length; i++) {
  const arg = process.argv[i];
  switch (arg) {
      case "-a":
      case "--actors": {
          console.log("Only building actors");
          process.env.TEST_BUILD = "1";
          buildType = "actors";
          break;
      }
  }
}

if (buildType === "all") {
  loop(0, rollupConfig);
}
