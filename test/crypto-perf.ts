// tslint:disable:prefer-const
// tslint:disable:no-string-literal
import "mocha";
import assert = require("assert");
import "@util";
import { Crypto } from "@core/crypto";
import { fixedTimeTest } from "@test/test-shared";

export default () => {
    describe.skip("crypto-perf", function() {

        before(async function() {

        });
        beforeEach(async () => {

        });
        describe("sign", function() {

            // Note: This is a bit faster than using the shared lib convenience function
            it("fixed time: should measure sign + verify performance ORIGINAL", async function() {
                const keyPair = await Crypto.Sign.keyPair();
                const testDuration = 3000;
                let iterations = 0;

                const start = new Date().getTime();
                while (new Date().getTime() - start < testDuration) {
                    const msg = Buffer.from(`Perf Message ${iterations}`);
                    const sign = await Crypto.Sign.sign(msg, keyPair);
                    iterations++;
                }
                const end = new Date().getTime();
                const durationInSeconds = (end - start) / 1000;
                const opsPerSec = iterations / durationInSeconds;
                console.log(`Time: ${durationInSeconds.toFixed(4)}s`);
                console.log(`${opsPerSec} ops/s`);
            });

            it("fixed time: should measure sign + verify performance", async function() {
                const keyPair = await Crypto.Sign.keyPair();
                const stats = await fixedTimeTest(async (iter) => {
                    const msg = Buffer.from(`Perf Message ${iter}`);
                    const sign = await Crypto.Sign.sign(msg, keyPair);
                }, 3000, true);
            });

            it.skip("variable time: should measure sign + verify performance", async function() {
                const keyPair = await Crypto.Sign.keyPair();
                const iterations = 100000;

                const start = new Date().getTime();
                for (let i = 0; i < iterations; i++) {
                    const msg = Buffer.from(`Perf Message ${i}`);
                    const sign = await Crypto.Sign.sign(msg, keyPair);
                }
                const end = new Date().getTime();
                const durationInSeconds = (end - start) / 1000;
                const opsPerSec = iterations / durationInSeconds;
                console.log(`Time: ${durationInSeconds.toFixed(4)}s`);
                console.log(`${opsPerSec} ops/s`);
            });
        });
    });
};
