// tslint:disable:arrow-parens

import { WASMCryptoInterface, WASMCryptoInterfaceReady } from "./wasm-crypto-interface";
import {
    outputUsing,
    inputUsing,
    SignSecretKey,
    SignPublicKey,
    Hash,
    Signature,
    KeyImage,
    PublicKeyArray,
    RingSignature,
    SignKeyPair,
    EllipticCurvePoint,
    BoxNonce,
    BoxSecret,
    BoxKeyPair,
    BoxSecretKey,
    BoxPublicKey,
    BoxSharedSecret
} from "./crypto-wasm-types";
import { SECRET_BOX_CONSTANTS } from "../interfaces/i-secret-box";

/**
 * Provides high level access to performant cryptographic functions using WASM.
 *
 * Low-level crypto implemented in C/C++ compiled to WASM.
 *
 * WASM stands for WebAssembly.
 * Learn about WASM here:          https://webassembly.org/
 *
 * @class CryptoWASM
 */
export class CryptoWASM {

    public static async ready() {
        await WASMCryptoInterfaceReady;
    }

    /**
     *
     *
     * @static
     * @param {Uint8Array} data
     * @returns {Promise<Hash>}
     * @memberof CryptoWASM
     */
    public static randomScalar(): Uint8Array {
        let scalar: Uint8Array;
        scalar = new Hash(Hash.factory.outputUsing(hashPtr => {
            WASMCryptoInterface.randomScalar(hashPtr);
        }));
        return scalar;
    }

    /**
     * Keccak hashing
     *
     * @static
     * @param {Uint8Array} data
     * @returns {Promise<Hash>}
     * @memberof CryptoWASM
     */
    public static hash(data: Uint8Array): Hash {
        let hash: Hash;
        hash = new Hash(Hash.factory.outputUsing(hashPtr => {
        inputUsing(data, data.length, dataPtr => {
            WASMCryptoInterface.hash(dataPtr, data.length, hashPtr);
        });
        }));
        return hash;
    }

    /* Encryption
     */

    public static scalarmultBase(point: EllipticCurvePoint): EllipticCurvePoint {
        let q: EllipticCurvePoint;
        q = new EllipticCurvePoint(EllipticCurvePoint.factory.outputUsing(qPtr => {
        EllipticCurvePoint.factory.inputUsing(point, pointPtr => {
            WASMCryptoInterface.scalarmultBase(qPtr, pointPtr);
        });
        }));
        return q;
    }

    public static secretbox(msg: Uint8Array, nonce: BoxNonce, secret: BoxSecret): Uint8Array {
        const inputMsg = new Uint8Array(SECRET_BOX_CONSTANTS.MSG_ZERO_BYTES + msg.length);
        for (let i = 0; i < msg.length; i++) {
            inputMsg[i + SECRET_BOX_CONSTANTS.MSG_ZERO_BYTES] = msg[i];
        }

        let box: Uint8Array; // = new Uint8Array(inputMsg.length);
        box = outputUsing(inputMsg.length, boxPtr => {
        inputUsing(inputMsg, inputMsg.length, msgPtr => {
        BoxNonce.factory.inputUsing(nonce, noncePtr => {
        BoxSecret.factory.inputUsing(secret, secretPtr => {
            WASMCryptoInterface.secretbox(boxPtr, msgPtr, inputMsg.length, noncePtr, secretPtr);
        });
        });
        });
        });
        return box.subarray(SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES);
    }

    public static secretboxOpen(box: Uint8Array, nonce: BoxNonce, secret: BoxSecret): Uint8Array {
        const inputBox = new Uint8Array(SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES + box.length);
        if (inputBox.length < 32) {
            return null;
        }
        for (let i = 0; i < box.length; i++) {
            inputBox[i + SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES] = box[i];
        }
        let result;
        let msg: Uint8Array; // = new Uint8Array(inputMsg.length);
        msg = outputUsing(inputBox.length, msgPtr => {
        inputUsing(inputBox, inputBox.length, boxPtr => {
        BoxNonce.factory.inputUsing(nonce, noncePtr => {
        BoxSecret.factory.inputUsing(secret, secretPtr => {
            result = WASMCryptoInterface.secretboxOpen(msgPtr, boxPtr, inputBox.length, noncePtr, secretPtr);
        });
        });
        });
        });

        if (result < 0) {
            return null;
        }

        return msg.subarray(SECRET_BOX_CONSTANTS.MSG_ZERO_BYTES);
    }

    public static boxKeyPair(): BoxKeyPair {
        let secretKey: BoxSecretKey;
        let publicKey: BoxPublicKey;
        secretKey = new BoxSecretKey(BoxSecretKey.factory.outputUsing(secPtr => {
        publicKey = new BoxPublicKey(BoxPublicKey.factory.outputUsing(pubPtr => {
            WASMCryptoInterface.boxKeypair(pubPtr, secPtr);
        }));
        }));
        return new BoxKeyPair({
            secretKey,
            publicKey
        });
    }

    public static boxCreateSharedSecret(pub: BoxPublicKey, sec: BoxSecretKey): BoxSharedSecret {
        let sharedSecret: BoxSharedSecret;
        sharedSecret = new BoxSharedSecret(BoxSharedSecret.factory.outputUsing(sharedSecPtr => {
        BoxSecretKey.factory.inputUsing(sec, secPtr => {
        BoxPublicKey.factory.inputUsing(pub, pubPtr => {
            WASMCryptoInterface.boxBeforenm(sharedSecPtr, pubPtr, secPtr);
        });
        });
        }));
        return sharedSecret;
    }

    /* Signing
    */

    public static generateKeys(): SignKeyPair {
        let sec: SignSecretKey;
        let pub: SignPublicKey;
        sec = new SignSecretKey(SignSecretKey.factory.outputUsing(secPtr => {
        pub = new SignPublicKey(SignPublicKey.factory.outputUsing(pubPtr => {
            WASMCryptoInterface.generateKeys(secPtr, pubPtr);
        }));
        }));
        return new SignKeyPair({
            secretKey: sec,
            publicKey: pub
        });
    }

    public static checkKey(key: SignPublicKey): boolean {
        let result: boolean;
        SignPublicKey.factory.inputUsing(key, pubPtr => {
            result = WASMCryptoInterface.checkKey(pubPtr);
        });
        return result;
    }

    public static secretKeyToPublicKey(sec: SignSecretKey): SignPublicKey {
        let result: boolean;
        let pub: SignPublicKey;
        pub = new SignPublicKey(SignPublicKey.factory.outputUsing(pubPtr => {
            SignSecretKey.factory.inputUsing(sec, secPtr => {
            result = WASMCryptoInterface.secretKeyToPublicKey(secPtr, pubPtr);
        });
        }));
        return pub;
    }

    public static generateSignature(hash: Hash, sec: SignSecretKey, pub: SignPublicKey): Signature {
        let sig: Signature;
        sig = new Signature(Signature.factory.outputUsing(sigPtr => {
        Hash.factory.inputUsing(hash, hashPtr => {
        SignSecretKey.factory.inputUsing(sec, secPtr => {
        SignPublicKey.factory.inputUsing(pub, pubPtr => {
            WASMCryptoInterface.generateSignature(hashPtr, secPtr, pubPtr, sigPtr);
        });
        });
        });
        }));
        return sig;
    }

    public static checkSignature(hash: Hash, pub: SignPublicKey, sig: Signature): boolean {
        let result: boolean;
        Signature.factory.inputUsing(sig, sigPtr => {
        Hash.factory.inputUsing(hash, hashPtr => {
        SignPublicKey.factory.inputUsing(pub, pubPtr => {
            result = WASMCryptoInterface.checkSignature(hashPtr, pubPtr, sigPtr);
        });
        });
        });
        return result;
    }

    // Ring signatures

    public static generateKeyImage(pub: SignPublicKey, sec: SignSecretKey): KeyImage {
        let keyImage: KeyImage;
        keyImage = new KeyImage(KeyImage.factory.outputUsing(keyImagePtr => {
        SignSecretKey.factory.inputUsing(sec, secPtr => {
        SignPublicKey.factory.inputUsing(pub, pubPtr => {
            WASMCryptoInterface.generateKeyImage(pubPtr, secPtr, keyImagePtr);
        });
        });
        }));
        return keyImage;
    }

    public static generateRingSignature(hash: Hash, keyImage: KeyImage, sec: SignSecretKey, secIndex: number, pubs: PublicKeyArray): RingSignature {
        const ringSigLength = RingSignature.getByteLength(pubs.publicKeyCount());
        let ringSig: RingSignature;
        ringSig = new RingSignature(outputUsing(ringSigLength, ringSigPtr => {
        Hash.factory.inputUsing(hash, hashPtr => {
        KeyImage.factory.inputUsing(keyImage, keyImagePtr => {
        inputUsing(pubs, pubs.length, pubsPtr => {
        SignSecretKey.factory.inputUsing(sec, secPtr => {
            WASMCryptoInterface.generateRingSignature(hashPtr, keyImagePtr, pubsPtr, pubs.publicKeyCount(), secPtr, secIndex, ringSigPtr);
        });
        });
        });
        });
        }));
        return ringSig;
    }

    public static checkRingSignature(hash: Hash, keyImage: KeyImage, pubs: PublicKeyArray, ringSig: RingSignature): boolean {
        let result: boolean;
        Hash.factory.inputUsing(hash, hashPtr => {
        KeyImage.factory.inputUsing(keyImage, keyImagePtr => {
        inputUsing(pubs, pubs.length, pubsPtr => {
        inputUsing(ringSig, ringSig.length, ringSigPtr => {
            result = WASMCryptoInterface.checkRingSignature(hashPtr, keyImagePtr, pubsPtr, pubs.publicKeyCount(), ringSigPtr);
        });
        });
        });
        });
        return result;
    }
}
