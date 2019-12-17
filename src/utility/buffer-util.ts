// https://github.com/cryptocoinjs/base-x
// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const base = function(ALPHABET) {
    if (ALPHABET.length >= 255) {
        throw new TypeError("Alphabet too long");
    }

    const BASE_MAP = new Uint8Array(256);
    BASE_MAP.fill(255);

    for (let i = 0; i < ALPHABET.length; i++) {
        const x = ALPHABET.charAt(i);
        const xc = x.charCodeAt(0);

        if (BASE_MAP[xc] !== 255) { throw new TypeError(x + " is ambiguous"); }
        BASE_MAP[xc] = i;
    }

    const BASE = ALPHABET.length;
    const LEADER = ALPHABET.charAt(0);
    const FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up
    const iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up

    function encode(source: Buffer) {
        if (!Buffer.isBuffer(source)) { throw new TypeError("Expected Buffer"); }
        if (source.length === 0) { return ""; }

        // Skip & count leading zeroes.
        let zeroes = 0;
        let length = 0;
        let pbegin = 0;
        const pend = source.length;

        while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
        }

        // Allocate enough space in big-endian base58 representation.
        const size = ((pend - pbegin) * iFACTOR + 1) >>> 0;
        const b58 = new Uint8Array(size);

        // Process the bytes.
        while (pbegin !== pend) {
        let carry = source[pbegin];

        // Apply "b58 = b58 * 256 + ch".
        let i = 0;
        for (let ij = size - 1; (carry !== 0 || i < length) && (ij !== -1); ij--, i++) {
            carry += (256 * b58[ij]) >>> 0;
            b58[ij] = (carry % BASE) >>> 0;
            carry = (carry / BASE) >>> 0;
        }

        if (carry !== 0) { throw new Error("Non-zero carry"); }
        length = i;
        pbegin++;
        }

        // Skip leading zeroes in base58 result.
        let it = size - length;
        while (it !== size && b58[it] === 0) {
        it++;
        }

        // Translate the result into a string.
        let str = LEADER.repeat(zeroes);
        for (; it < size; ++it) { str += ALPHABET.charAt(b58[it]); }

        return str;
    }

    function decodeUnsafe(source) {
        if (typeof source !== "string") { throw new TypeError("Expected String"); }
        if (source.length === 0) { return Buffer.alloc(0); }

        let psz = 0;

        // Skip leading spaces.
        if (source[psz] === " ") { return; }

        // Skip and count leading '1's.
        let zeroes = 0;
        let length = 0;
        while (source[psz] === LEADER) {
        zeroes++;
        psz++;
        }

        // Allocate enough space in big-endian base256 representation.
        const size = (((source.length - psz) * FACTOR) + 1) >>> 0; // log(58) / log(256), rounded up.
        const b256 = new Uint8Array(size);

        // Process the characters.
        while (source[psz]) {
        // Decode character
        let carry = BASE_MAP[source.charCodeAt(psz)];

        // Invalid character
        if (carry === 255) { return; }

        let i = 0;
        for (let ij = size - 1; (carry !== 0 || i < length) && (ij !== -1); ij--, i++) {
            carry += (BASE * b256[ij]) >>> 0;
            b256[ij] = (carry % 256) >>> 0;
            carry = (carry / 256) >>> 0;
        }

        if (carry !== 0) { throw new Error("Non-zero carry"); }
        length = i;
        psz++;
        }

        // Skip trailing spaces.
        if (source[psz] === " ") { return; }

        // Skip leading zeroes in b256.
        let it = size - length;
        while (it !== size && b256[it] === 0) {
        it++;
        }

        const vch = Buffer.allocUnsafe(zeroes + (size - it));
        vch.fill(0x00, 0, zeroes);

        let j = zeroes;
        while (it !== size) {
        vch[j++] = b256[it++];
        }

        return vch;
    }

    function decode(str: string) {
        const buffer = decodeUnsafe(str);
        if (buffer) { return buffer; }

        throw new Error("Non-base" + BASE + " character");
    }

    return {
        encode,
        decodeUnsafe,
        decode
    };
};
const base58 = base("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

export class BufferUtility {
    public static xor(bufferSrc: Buffer, buffer: Buffer): Buffer {
        const length = Math.max(bufferSrc.length, buffer.length);
        const xor = Buffer.allocUnsafe(length);
        for (let i = 0; i < length; ++i) {
            xor[i] = bufferSrc[i] ^ buffer[i];
        }
        return xor;
    }

    public static toBase64(bufferSrc: Buffer): {
        b64: string
    } {
        return { b64: bufferSrc.toString("base64") };
    }

    public static toBase58(bufferSrc: Buffer): {
        b58: string
    } {
        return { b58: base58.encode(bufferSrc) };
    }

    public static greaterThan(bufferSrc: Buffer, buffer: Buffer): boolean {
        return bufferSrc.compare(buffer) > 0;
    }

    public static lessThan(bufferSrc: Buffer, buffer: Buffer): boolean {
        return bufferSrc.compare(buffer) < 0;
    }

    public static shiftRight(bufferSrc: Buffer): Buffer {
        if (bufferSrc.length === 0) {
            return Buffer.from([]);
        }
        if (bufferSrc.length === 1) {
            return Buffer.from([bufferSrc[0] >> 1]);
        }

        const ret = Buffer.alloc(bufferSrc.length);
        let carry = 0;
        for (let i = 0; i < bufferSrc.length; i++) {
            const byte = bufferSrc[i];
            ret[i] = carry | byte >> 1;
            carry = byte << 4;
        }
        return ret;
    }

    public static fromBase64(data: {
        b64: string
    }): Buffer {
        return Buffer.from(data.b64, "base64");
    }

    public static fromBase58(data: {
        b58: string;
    }): Buffer {
        return base58.decode(data.b58);
    }

    public static encodeBase64(obj: any): {
        b64: string
    } {
        return BufferUtility.toBase64(Buffer.from(JSON.stringify(obj)));
    }

    public static decodeBase64<T = any>(data: {
        b64: string
    }): T {
        return JSON.parse(BufferUtility.fromBase64(data).toString("utf8")) as T;
    }

    public static concat(arr: Uint8Array[]): Buffer {
        return Buffer.from(Uint8Array.concat(arr));
    }
}
