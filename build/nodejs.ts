import * as fs from "fs";
import * as path from "path";
import { walk } from "./utility/walk";
import * as rollup from "rollup";
import * as rollupConfig from "@root/rollup.config.js";
import * as resolve from "rollup-plugin-node-resolve";
import { envIndexReplace } from "./processing/env-index-replace";
import { srcRoot as getSrcRoot, nodejsRoot } from "./utility/app-root";

const srcRoot = getSrcRoot();
const root = nodejsRoot();
envIndexReplace(root, "nodejs/env-index", (err) => {
    if (err) {
        console.log(err);
        return;
    }
});

rollupConfig.plugins.push(
    resolve({
        browser: false,
        preferBuiltins: true
    })
);

rollupConfig.inputs.push({
    inputOptions: {
        input: `${root}/src/platforms/nodejs/node-worker-loader/node-worker-loader-ext.js`
    },
    outputOptions: {
        file: `${root}/src/platforms/nodejs/node-worker-loader/node-worker-loader-ext.js`,
        name: "workerRuntime",
        format: "umd"
    }
    },
    {
    inputOptions: {
        input: `${root}/src/platforms/nodejs/node-worker-loader/node-worker-loader-prepend.js`
    },
    outputOptions: {
        file: `${root}/src/platforms/nodejs/node-worker-loader/node-worker-loader-prepend.js`,
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
        input: `${root}/src/platforms/nodejs/index.js`
    },
    outputOptions: {
        file: "dist/bundle.node.js",
        name: "actorRuntime",
        format: "esm"
    }
});

async function bundle(config) {
    const inputOptions = config.inputOptions;
    inputOptions.plugins = rollupConfig.plugins;
    inputOptions.onwarn = function( message ) {
        // console.error( message );
    };
    const outputOptions = config.outputOptions;
    outputOptions.globals = rollupConfig.globals;

    async function build() {
        // create a bundle
        const bundled = await rollup.rollup(inputOptions);
        // generate code and a sourcemap
        const { code, map } = await bundled.generate(outputOptions);
        // or write the bundle to disk
        await bundled.write(outputOptions);
    }
    await build();
}

async function loop(i, inputConfig) {
    if (i === inputConfig.inputs.length) {
      return;
    }

    const config = inputConfig.inputs[i];
    const inputOptions = config.inputOptions;
    inputOptions.plugins = inputConfig.plugins;

    const outputOptions = config.outputOptions;
    outputOptions.globals = inputConfig.globals;
    await bundle({
        inputOptions,
        outputOptions
    });
    await loop(i + 1, inputConfig);
}

walk(root, async (srcFile) => {
    const dirName = path.dirname(srcFile);

    // Skip the build files
    if (dirName.startsWith(`${root}build`)) {
        return;
    }
    let fileText = fs.readFileSync(`${srcFile}`).toString();
    let processed = false;
    while ( fileText.indexOf("file-loader!") > -1 ) {
        processed = true;
        const found = fileText.split("file-loader!.")[1];
        const end = found.indexOf("\"");
        const rawName = found.substr(0, end);
        const filename = `${dirName}${rawName}${".js"}`;

        try {
            await bundle({
                inputOptions: {
                    input: filename
                },
                outputOptions: {
                    file: filename,
                    name: rawName,
                    format: "cjs"
                }
            });
        } catch (e) {
            console.log(e);
        }
        let file = fs.readFileSync(`${filename}`).toString();

        function cleanString(str, char) {
            const foundInner = str.indexOf(char);
            if (foundInner > -1) {
            const remainder = cleanString(str.slice(foundInner + 1), char);
            return str.slice(0, foundInner) + "\\" + char[0] + remainder;
            }
            return str;
        }
        file = cleanString(file, "\\");
        file = cleanString(file, "\`");
        file = cleanString(file, "${");
        const jsAsText = Buffer.from(`exports.default=\`${file}\n\``);

        fs.writeFileSync(`${filename}-text.js`, jsAsText);

        fileText = fileText.replace(`file-loader!.${rawName}`, `.${rawName}.js-text.js`);
    }
    if (processed) {
        fs.writeFileSync(`${srcFile}`, fileText);
    }
},
(innerErr) => {
    if (innerErr) {
        console.log(innerErr);
    }
});
