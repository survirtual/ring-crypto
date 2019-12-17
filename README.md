
# Monero Crypto Library WASM and JS Interface

## Typescript + WASM

The primary language used is Typescript, with a target of NodeJS and Browsers.  The crypto library is in C/C++ from the Monero project, with a WASM target.  The WASM is injected into bundled builds and is called via Typescript bindings.

## Development Prerequisites

This project relies on [EMSCRIPTEN](https://emscripten.org/) to function.  Development has only been tested on Linux.  The expectation for wasm builds is that the emscripten SDK is located two levels above this folder.  This can be modified by editing the build/wasm-build.ts "emsdk" variable.

## License

[GNU LESSER GENERAL PUBLIC LICENSE Version 3, 29 June 2007](https://www.gnu.org/licenses/lgpl-3.0.txt)

