// tslint:disable:max-classes-per-file
import { Module } from "@wasm/crypto/bin/crypto";
import { HASH_CONSTANTS } from "../interfaces/i-hash";
import { SECRET_BOX_CONSTANTS } from "../interfaces/i-secret-box";
import { BOX_CONSTANTS } from "../interfaces/i-box";
import { SIGN_CONSTANTS } from "../interfaces/i-sign";
import { byteLengthGuard, ByteLengthError } from "@core/common/byte-length-guard";

export class Pointer<T> {
    public to: number;
}

export class TypedBytesFactory<T extends Uint8Array> {
    public readonly BYTE_LENGTH: number;

    constructor(byteLength: number) {
        this.BYTE_LENGTH = byteLength;
    }

    public inputUsing(instance: T, fn: (pointer: Pointer<T>) => void) {
        inputUsing(instance, this.BYTE_LENGTH, fn);
    }

    public outputUsing(fn: (pointer: Pointer<T>) => void): T {
        return outputUsing<T>(this.BYTE_LENGTH, fn);
    }
}

export const inputUsing = function<T>(inputBuf: T, memoryAllocBytes: number, fn: (ptr: Pointer<T>) => void) {
    // Allocate space to the heap
    const ptr = new Pointer<T>();
    ptr.to = Module._malloc(memoryAllocBytes);

    // Set the input value
    Module.HEAPU8.set(inputBuf, ptr.to);

    // Callback with the pointer
    fn(ptr);

    // Clear the memory
    Module.HEAPU8.set(new Uint8Array(memoryAllocBytes), ptr.to);

    // Cleanup the allocated space
    Module._free(ptr.to);
};

export const outputUsing = function<T extends Uint8Array>(memoryAllocBytes: number, fn: (ptr: Pointer<T>) => void): T {
    // Allocate space to the heap
    const ptr = new Pointer<T>();
    ptr.to = Module._malloc(memoryAllocBytes);

    // Set the input value
    Module.HEAPU8.set(new Uint8Array(memoryAllocBytes), ptr.to);

    // Callback with the pointer
    fn(ptr);

    // Create a view of the heap ArrayBuffer
    const viewHeap = new Uint8Array(Module.HEAPU8.buffer, ptr.to, memoryAllocBytes);

    // Copy the memory to the output buffer
    const buf = new Uint8Array(memoryAllocBytes);
    for (let i = 0; i < memoryAllocBytes; i++) {
        buf[i] = viewHeap[i];
    }

    // Clear the memory
    Module.HEAPU8.set(new Uint8Array(memoryAllocBytes), ptr.to);

    // Cleanup the allocated space
    Module._free(ptr.to);

    // Return the output buffer
    return buf as T;
};

export class Hash extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<Hash>(HASH_CONSTANTS.HASH_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(Hash.factory.BYTE_LENGTH, init, offset));
    }
}

export class EllipticCurvePoint extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<EllipticCurvePoint>(32);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(EllipticCurvePoint.factory.BYTE_LENGTH, init, offset));
    }
}

export class BoxSecret extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<BoxSecret>(SECRET_BOX_CONSTANTS.KEY_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(BoxSecret.factory.BYTE_LENGTH, init, offset));
    }
}

export class BoxNonce extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<BoxNonce>(SECRET_BOX_CONSTANTS.NONCE_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(BoxNonce.factory.BYTE_LENGTH, init, offset));
    }
}

export class BoxSecretKey extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<BoxSecretKey>(BOX_CONSTANTS.SECRET_KEY_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(BoxSecretKey.factory.BYTE_LENGTH, init, offset));
    }
}

export class BoxPublicKey extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<BoxPublicKey>(BOX_CONSTANTS.PUBLIC_KEY_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(BoxPublicKey.factory.BYTE_LENGTH, init, offset));
    }
}

export class BoxSharedSecret extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<BoxSharedSecret>(BOX_CONSTANTS.SHARED_KEY_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(BoxSharedSecret.factory.BYTE_LENGTH, init, offset));
    }
}

export class BoxKeyPair {
    public secretKey: BoxSecretKey;
    public publicKey: BoxPublicKey;
    constructor(keyPair?) {
        if (keyPair == null
            || keyPair.secretKey == null
            || keyPair.publicKey == null) {
                throw new Error("Invalid BoxKeyPair for construction");
        }

        this.secretKey = new BoxSecretKey(keyPair.secretKey);
        this.publicKey = new BoxPublicKey(keyPair.publicKey);
    }
}

export class SignSecretKey extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<SignSecretKey>(SIGN_CONSTANTS.SECRET_KEY_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(SignSecretKey.factory.BYTE_LENGTH, init, offset));
    }
}

export class SignPublicKey extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<SignPublicKey>(SIGN_CONSTANTS.PUBLIC_KEY_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(SignPublicKey.factory.BYTE_LENGTH, init, offset));
    }
}

export class Signature extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<Signature>(SIGN_CONSTANTS.SIGNATURE_LENGTH);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(Signature.factory.BYTE_LENGTH, init, offset));
    }
}

export class KeyImage extends Uint8Array {
    public static readonly factory = new TypedBytesFactory<KeyImage>(32);
    constructor(init?: Uint8Array, offset?: number) {
        super(...byteLengthGuard(KeyImage.factory.BYTE_LENGTH, init, offset));
    }
}

export class PublicKeyArray extends Uint8Array {
    constructor(init?: Uint8Array, offset?: number, publicKeyCount?: number) {
        let byteLength;
        if (publicKeyCount) {
            byteLength = publicKeyCount * SignPublicKey.factory.BYTE_LENGTH;
        }
        if (init) {
            if (init.length === 0) {
                throw new ByteLengthError("Cannot initialize with zero-length array");
            }
            if (Math.floor(init.length / SignPublicKey.factory.BYTE_LENGTH) !== init.length / SignPublicKey.factory.BYTE_LENGTH) {
                throw new ByteLengthError("Invalid intialization length");
            }
            byteLength = init.length;
        }
        super(...byteLengthGuard(byteLength, init, offset));
    }
    public publicKeyCount(): number {
        return this.length / SignPublicKey.factory.BYTE_LENGTH;
    }
}

export class RingSignature extends Uint8Array {
    public static getByteLength(signatureCount: number) {
        return signatureCount * Signature.factory.BYTE_LENGTH;
    }
    constructor(init?: Uint8Array, offset?: number, signatureCount?: number) {
        let byteLength;
        if (signatureCount) {
            byteLength = signatureCount * Signature.factory.BYTE_LENGTH;
        }
        if (init) {
            if (init.length === 0) {
                throw new ByteLengthError("Cannot initialize with zero-length array");
            }
            if (Math.floor(init.length / Signature.factory.BYTE_LENGTH) !== init.length / Signature.factory.BYTE_LENGTH) {
                throw new ByteLengthError("Invalid intialization length");
            }
            byteLength = init.length;
        }
        super(...byteLengthGuard(byteLength, init, offset));
    }
    public signatureCount(): number {
        return this.length / Signature.factory.BYTE_LENGTH;
    }
}

export class SignKeyPair {
    public secretKey: SignSecretKey;
    public publicKey: SignPublicKey;
    constructor(keyPair?) {
        if (keyPair == null
            || keyPair.secretKey == null
            || keyPair.publicKey == null) {
                throw new Error("Invalid SignKeyPair for construction");
        }

        this.secretKey = new SignSecretKey(keyPair.secretKey);
        this.publicKey = new SignPublicKey(keyPair.publicKey);
    }
}
