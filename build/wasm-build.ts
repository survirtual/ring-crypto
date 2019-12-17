import * as fs from "fs";
import { homedir } from "os";
import * as path from "path";
import { exec } from "child_process";
import { appRoot, transpileRoot } from "./utility/app-root";

const mkdirSync = function(dirPath) {
    try {
        fs.mkdirSync(dirPath);
    } catch (err) {
        if (err.code !== "EEXIST") { throw err; }
    }
};

const moduleName = "crypto";
const root = transpileRoot();
const outDirWasmRoot = `${root}/wasm`;
const outDir = `${outDirWasmRoot}/crypto`;
const outDirWasmRootBin = `${outDir}/bin`;

const emsdk = path.resolve(appRoot(), "../../emsdk");
const wasmDir = path.resolve(appRoot(), "src/c_crypto");
const wasmOutput = `${wasmDir}/bin/${moduleName}`;
const wasmFile = `${wasmOutput}.wasm`;
const wasmLoaderJsFile = `${wasmOutput}.js`;

// Path configurations
process.env.PATH = `${emsdk}:${emsdk}/clang/e1.38.21_64bit:${emsdk}/node/8.9.1_64bit/bin:${emsdk}/emscripten/1.38.21:${process.env.PATH}`;
process.env.EMSDK = `${emsdk}`;
process.env.EM_CONFIG = `${homedir()}/.emscripten`;
process.env.LLVM_ROOT = `${emsdk}/clang/e1.38.21_64bit`;
process.env.EMSCRIPTEN_NATIVE_OPTIMIZER = `${emsdk}/clang/e1.38.21_64bit/optimizer`;
process.env.BINARYEN_ROOT = `${emsdk}/clang/e1.38.21_64bit/binaryen`;
process.env.EMSDK_NODE = `${emsdk}/node/8.9.1_64bit/bin/node`;
process.env.EMSCRIPTEN = `${emsdk}/emscripten/1.38.21`;

let buildType = "Release";
// Compiler configuration
for (let i = 1; i < process.argv.length; i++) {
    const arg = process.argv[i];
    switch (arg) {
        case "-t":
        case "--test": {
            process.env.TEST_BUILD = "1";
            buildType = "Debug";
            break;
        }
    }
}
console.log(`${buildType} build`);
process.env.BUILD = `${buildType}`;

// BEGIN DUMB HACK
let cmake = fs.readFileSync(`${wasmDir}/CMakeLists.txt`).toString("utf8");
const found = cmake.indexOf("# DUMB_HACK_1 <- DO NOT REMOVE!");
if (found === -1) {
    cmake = cmake.replace("# DUMB_HACK_0 <- DO NOT REMOVE!", "# DUMB_HACK_1 <- DO NOT REMOVE!");
} else {
    cmake = cmake.replace("# DUMB_HACK_1 <- DO NOT REMOVE!", "# DUMB_HACK_0 <- DO NOT REMOVE!");
}
fs.writeFileSync(`${wasmDir}/CMakeLists.txt`, Buffer.from(cmake, "utf8"));
// END DUMB HACK

const cmd = `cd ${wasmDir} && emmake make BUILD=${buildType}`;
console.log(cmd);
exec(cmd, { env: process.env }, async (err, stdout, stderr) => {
    if (err) {
        console.log(`Child Process Error`);
        console.error(err);
        return;
    }
    console.log(`${stdout}`);
    if (stderr) {
        console.log(`${stderr}`);
    }

    // REVERT DUMB HACK
    const foundInner = cmake.indexOf("# DUMB_HACK_0 <- DO NOT REMOVE!");
    if (foundInner === -1) {
        cmake = cmake.replace("# DUMB_HACK_1 <- DO NOT REMOVE!", "# DUMB_HACK_0 <- DO NOT REMOVE!");
    }
    fs.writeFileSync(`${wasmDir}/CMakeLists.txt`, Buffer.from(cmake, "utf8"));
    // END REVERT DUMB HACK

    await performVariableReplacement();
});

async function performVariableReplacement() {
    const wasm = fs.readFileSync(wasmFile).toString("base64");
    let loader = fs.readFileSync(`${wasmLoaderJsFile}`).toString();

    let search;
    let replace;
    search = `Module["wasmBinary"]="// wasmBinInline"`;
    replace = `Module["wasmBinary"]=Buffer.from(`;
    if (loader.indexOf(replace) > -1) {
        loader = loader.replace(/\[([^\]]+)([^\]"A-Za-z"]+)\]/, wasm);
    } else {
        replace = `${replace}"${wasm}","base64");`;
        loader = loader.replace(search, replace);
    }

    search = `new Uint8Array(Module['wasmBinary'])`;
    replace = `Module["wasmBinary"]`;
    loader = loader.replace(search, replace);

    // Annoying exception eating by emscripten boiler plate
    search = "process['on']('uncaughtException', function(ex) {";
    replace = `const dummy = function(str, fn) {}; dummy('uncaughtException', function(ex) {`;
    loader = loader.replace(search, replace);

    search = "process['on']('unhandledRejection', abort)";
    replace = ``;
    loader = loader.replace(search, replace);

//     // search = "// {{MODULE_ADDITIONS}}"
//     replace = `${search}
// exports.Module = Module;`
//     if (loader.indexOf(replace) == -1) {
//         loader = loader.replace(search, replace);
//     }
    // loader += "exports.Module = Module;"

    const buf = Buffer.from(loader);
    mkdirSync(outDirWasmRoot);
    mkdirSync(outDir);
    mkdirSync(outDirWasmRootBin);
    fs.writeFileSync(`${outDirWasmRootBin}/${moduleName}.js`, buf);
}

/*

--pre-js <file>
Specify a file whose contents are added before the emitted code and optimized together with it. Note that this might not literally be the very first thing in the JS output, for example if MODULARIZE is used (see src/settings.js). If you want that, you can just prepend to the output from emscripten; the benefit of --pre-js is that it optimizes the code with the rest of the emscripten output, which allows better dead code elimination and minification, and it should only be used for that purpose. In particular, --pre-js code should not alter the main output from emscripten in ways that could confuse the optimizer, such as using --pre-js + --post-js to put all the output in an inner function scope (see MODULARIZE for that).

–pre-js (but not –post-js) is also useful for specifying things on the Module object, as it appears before the JS looks at Module (for example, you can define Module['print'] there).

*/
