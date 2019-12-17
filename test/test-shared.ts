import assert = require("assert");
import { Crypto } from "@core/crypto/core/crypto-node";

export interface ITestShareInitOptions {
    storePath: string;
}

const dumpPost = (msg) => {

};

export const assertThrowsAsync = async function(fn, regEx) {
    let f = () => {};
    try {
        await fn();
    } catch (e) {
        f = () => { throw e; };
    } finally {
        assert.throws(f, regEx);
    }
};

export const fixedTimeTest = async function(fn: (iteration?: number) => void, testDuration: number, logStats: boolean = false) {
    let iterations = 0;
    const start = new Date().getTime();
    while (new Date().getTime() - start < testDuration) {
        await fn(iterations);
        iterations++;
    }
    const end = new Date().getTime();
    const durationInSeconds = (end - start) / 1000;
    const opsPerSec = iterations / durationInSeconds;

    if (logStats) {
        console.log(`Time: ${durationInSeconds.toFixed(4)}s`);
        console.log(`${opsPerSec} ops/s`);
    }

    return {
        start,
        end,
        durationInSeconds,
        opsPerSec
    };
};

export const varTimeAsyncTest = async function(fn: (iteration?: number) => void, targetIterations: number, logStats: boolean = false) {
    let iterations = 0;
    const start = new Date().getTime();
    const promises = [];
    while (iterations < targetIterations) {
        promises.push(fn(iterations));
        iterations++;
    }
    await Promise.all(promises);
    const end = new Date().getTime();
    const durationInSeconds = (end - start) / 1000;
    const opsPerSec = iterations / durationInSeconds;

    if (logStats) {
        console.log(`Time: ${durationInSeconds.toFixed(4)}s`);
        console.log(`${opsPerSec} ops/s`);
    }

    return {
        start,
        end,
        durationInSeconds,
        opsPerSec
    };
};

export class TestShared {
    public static async init(options: ITestShareInitOptions) {
        await Crypto.ready();
    }

    public static async cleanup() {
    }
}
