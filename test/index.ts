import "mocha";
import "@util";
import testCryptoWASM from "./crypto-wasm";
import testCryptoAPI from "./crypto-api";
import testCryptoPerf from "./crypto-perf";


describe("crypto", function() {
    testCryptoWASM();
    testCryptoAPI();
    testCryptoPerf();
});
