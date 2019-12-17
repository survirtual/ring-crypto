/* This to make typescript happy.
 *
 * C/C++ is compiled to WASM with a build process.  The output then
 * overwrites this file after transpilation completes.
 *
 * Look at src/c_crypto to find the source.
 *
 */
const DummyModule = {} as any;
export { DummyModule as Module };
