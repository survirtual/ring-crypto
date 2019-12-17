// tslint:disable:prefer-const
// tslint:disable:no-string-literal
import "mocha";
import assert = require("assert");
import { BufferUtility } from "@util/index";
import { promises as fs } from "fs";
import { Module } from "@wasm/crypto/bin/crypto";
import { CryptoWASM } from "@core/crypto/core/wasm/crypto-wasm";
import { SignKeyPair, PublicKeyArray, RingSignature, Hash, KeyImage } from "@core/crypto/core/wasm/crypto-wasm-types";
import { AssertionError } from "assert";

export default () => {
    describe("crypto-wasm", function() {
        const testDatabase = {};
        const createGetData = (testData) => {
            let cursor = 0;
            return () => {
                const data = testData[cursor];
                cursor++;
                return data;
            };
        };

        const createFinish = (title, resolve, reject) => {
            let count = testDatabase[title].length;
            let errors = [];
            return (err?) => {
                if (err) {
                    errors.push(err);
                }
                count--;
                if (count === 0) {
                    if (errors.length > 0) {
                        reject(errors);
                    } else {
                        resolve();
                    }
                }
            };
        };

        const setupRandom = (count) => {
            for (let i = 0; i < count; i++) {
                CryptoWASM.randomScalar();
            }
        };

        before(async function() {
            const testDataBuf = await fs.readFile(`${__dirname}/../../../test/tests.txt`);
            const temp = testDataBuf.toString()
            .split("\n")
            .map((line) => {
                const lineSplit = line.split(" ");
                const testType = lineSplit.shift();
                return {
                    type: testType,
                    data: lineSplit
                };
            })
            .forEach((el) => {
                if (testDatabase.hasOwnProperty(el.type)) {
                    testDatabase[el.type].push(el.data);
                } else {
                    testDatabase[el.type] = [el.data];
                }
            });
        });
        beforeEach(async () => {
            await CryptoWASM.ready();
            Module.ccall("setup_test", "boolean", []);
        });

        it("random_scalar", async function() {
            const title = this.test.title;
            return new Promise((resolve, reject) => {
                const finish = createFinish(title, resolve, reject);
                testDatabase[title].forEach(async (testData, index) => {
                    try {
                        const getData = createGetData(testData);
                        const expected = getData();

                        const result = Buffer.from(
                            CryptoWASM.randomScalar()
                        ).toString("hex");

                        assert.equal(result, expected);
                        finish();
                    } catch (e) {
                        e.message = `${index} | ${e.message}`;
                        finish(e);
                    }

                });
            });
        });

        it("generate_keys", async function() {
            setupRandom(testDatabase["random_scalar"].length);
            const title = this.test.title;
            return new Promise((resolve, reject) => {
                const finish = createFinish(title, resolve, reject);
                testDatabase[title].forEach(async (testData, index) => {
                    try {
                        const getData = createGetData(testData);
                        const expectedPub = getData();
                        const expectedSec = getData();

                        const actualKeyPair = await CryptoWASM.generateKeys();
                        const actualPub = Buffer.from(actualKeyPair.publicKey).toString("hex");
                        const actualSec = Buffer.from(actualKeyPair.secretKey).toString("hex");

                        assert.equal(actualPub, expectedPub);
                        assert.equal(actualSec, expectedSec);
                        finish();
                    } catch (e) {
                        e.message = `${index} | ${e.message}`;
                        finish(e);
                    }

                });
            });
        });

        it("generate_ring_signature", async function() {
            setupRandom(
                testDatabase["random_scalar"].length
                + testDatabase["generate_keys"].length
                + testDatabase["generate_signature"].length
            );
            const title = this.test.title;
            return new Promise((resolve, reject) => {
                const finish = createFinish(title, resolve, reject);
                testDatabase[title].forEach(async (testData, index) => {
                    try {
                        const getData = createGetData(testData);
                        const prefixHash = new Hash(Buffer.from(getData(), "hex"));
                        const keyImage = new KeyImage(Buffer.from(getData(), "hex"));
                        const pubCount = Number.parseInt(getData(), 10);

                        const loadPubs = [];
                        for (let i = 0; i < pubCount; i++) {
                            loadPubs.push(Buffer.from(getData(), "hex"));
                        }
                        const pubKeys = new PublicKeyArray(BufferUtility.concat(loadPubs));
                        const secretKey = Buffer.from(getData(), "hex");
                        const secretKeyPubIndex = Number.parseInt(getData(), 10);

                        const expect = getData();

                        const ringSig = Buffer.from(
                        await CryptoWASM.generateRingSignature(
                            prefixHash,
                            keyImage,
                            secretKey, secretKeyPubIndex,
                            pubKeys
                        )).toString("hex");

                        assert.equal(ringSig, expect);
                        finish();
                    } catch (e) {
                        e.message = `${index} | ${e.message}`;
                        finish(e);
                    }

                });
            });
        });

        it("check_ring_signature", async function() {
            let genRingRandomCalls;
            testDatabase["generate_ring_signature"].forEach((testData) => {
                const getData = createGetData(testData);
                getData(); getData();
                const pubCount = Number.parseInt(getData(), 10);
                genRingRandomCalls += 1 + (pubCount - 1) * 2;
            });
            setupRandom(
                testDatabase["random_scalar"].length
                + testDatabase["generate_keys"].length
                + testDatabase["generate_signature"].length
                + genRingRandomCalls
            );
            const title = this.test.title;
            return new Promise((resolve, reject) => {
                const finish = createFinish(title, resolve, reject);
                testDatabase[title].forEach(async (testData, index) => {
                    try {
                        const getData = createGetData(testData);
                        const prefixHash = new Hash(Buffer.from(getData(), "hex"));
                        const keyImage = new KeyImage(Buffer.from(getData(), "hex"));
                        const pubCount = Number.parseInt(getData(), 10);

                        const loadPubs = [];
                        for (let i = 0; i < pubCount; i++) {
                            loadPubs.push(Buffer.from(getData(), "hex"));
                        }
                        const pubKeys = new PublicKeyArray(BufferUtility.concat(loadPubs));
                        const ringSig = new RingSignature(Buffer.from(getData(), "hex"));

                        const expect = getData() === "true";

                        const checkRingSig = CryptoWASM.checkRingSignature(
                            prefixHash,
                            keyImage,
                            pubKeys,
                            ringSig
                        );

                        assert.equal(checkRingSig, expect);
                        finish();
                    } catch (e) {
                        e.message = `${index} | ${e.message}`;
                        finish(e);
                    }

                });
            });
        });
    });
};
