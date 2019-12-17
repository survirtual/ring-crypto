export class RandomFactory {
    public bytes(count: number): Uint8Array {
        return randomBytes(count);
    }

    public setPRNG(fn: (buffer: Uint8Array, byteCount: number) => void) {
        randombytes = fn;
    }
}

// Taken from TweetNaCl-js

function randomBytes(count: number) {
    const b = new Uint8Array(count);
    randombytes(b, count);
    return b;
}

let randombytes = function(x: Uint8Array, n: number): void {
    throw new Error("no PRNG");
};

function cleanup(arr: Uint8Array) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = 0;
    }
}

(function() {
    // Initialize PRNG if environment provides CSPRNG.
    // If not, methods calling randombytes will throw.
    let crypto = typeof self !== "undefined" ? (self.crypto || (self as any).msCrypto) : null;
    if (crypto && crypto.getRandomValues) {
        // Browsers.
        const QUOTA = 65536;
        randombytes = function(x, n) {
            const v = new Uint8Array(n);
            let i;
            for (i = 0; i < n; i += QUOTA) {
                crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            for (i = 0; i < n; i++) { x[i] = v[i]; }
            cleanup(v);
        };
    } else if (typeof require !== "undefined") {
        // Node.js.
        crypto = require("crypto");
        if (crypto && crypto.randomBytes) {
            randombytes = function(x, n) {
                const v = crypto.randomBytes(n);
                let i;
                for (i = 0; i < n; i++) {
                    x[i] = v[i];
                }
                cleanup(v);
            };
        }
    }
})();

export { randomBytes };
