
import { Module } from "@wasm/crypto/bin/crypto";
import {
    Pointer,
    SignSecretKey,
    SignPublicKey,
    Hash,
    Signature,
    KeyImage,
    RingSignature,
    PublicKeyArray,
    BoxPublicKey,
    BoxSecretKey,
    BoxSharedSecret,
    BoxSecret,
    BoxNonce,
    EllipticCurvePoint
} from "./crypto-wasm-types";

// Initialize native interface object
const WASMCryptoInterface = { ready: false } as {
    ready: boolean;
    randomScalar: (ecScalar: Pointer<EllipticCurvePoint>) => void;
    hash: (data: Pointer<Uint8Array>, dataLength: number, outHash: Pointer<Hash>) => void;

    scalarmultBase: (outQ: Pointer<EllipticCurvePoint>, n: Pointer<EllipticCurvePoint>) => void;
    secretbox: (outBox: Pointer<Uint8Array>, msg: Pointer<Uint8Array>, msgLength: number, nonce: Pointer<BoxNonce>, secret: Pointer<BoxSecret>) => void;
    secretboxOpen: (outMsg: Pointer<Uint8Array>, box: Pointer<Uint8Array>, msgLength: number, nonce: Pointer<BoxNonce>, secret: Pointer<BoxSecret>) => void;

    boxBeforenm: (outShared: Pointer<BoxSharedSecret>, pub: Pointer<BoxPublicKey>, sec: Pointer<BoxSecretKey>) => void;
    boxKeypair: (outPub: Pointer<BoxPublicKey>, outSec: Pointer<BoxSecretKey>) => void;

    generateKeys: (sec: Pointer<SignSecretKey>, pub: Pointer<SignPublicKey>) => void;
    checkKey: (pub: Pointer<SignPublicKey>) => boolean;
    secretKeyToPublicKey: (sec: Pointer<SignSecretKey>, pub: Pointer<SignPublicKey>) => boolean;
    generateSignature: (dataHash: Pointer<Hash>, sec: Pointer<SignSecretKey>, pub: Pointer<SignPublicKey>, sig: Pointer<Signature>) => void;
    checkSignature: (dataHash: Pointer<Hash>, pub: Pointer<SignPublicKey>, sig: Pointer<Signature>) => boolean;
    generateKeyImage: (pub: Pointer<SignPublicKey>, sec: Pointer<SignSecretKey>, keyImage: Pointer<KeyImage>) => void;
    generateRingSignature: (dataHash: Pointer<Hash>, keyImage: Pointer<KeyImage>, pubs: Pointer<PublicKeyArray>, pubsCount: number, sec: Pointer<SignSecretKey>, secIndex: number, ringSig: Pointer<RingSignature>) => void;
    checkRingSignature: (dataHash: Pointer<Hash>, keyImage: Pointer<KeyImage>, pubs: Pointer<PublicKeyArray>, pubsCount: number, ringSig: Pointer<RingSignature>) => boolean;
};

// WASM needs to loaded before it gets used
const runtimeNotInitialized = function() {
    throw new Error("Crypto runtime has not yet initialized");
} as any;
WASMCryptoInterface.randomScalar = runtimeNotInitialized;
WASMCryptoInterface.hash = runtimeNotInitialized;
WASMCryptoInterface.scalarmultBase = runtimeNotInitialized;
WASMCryptoInterface.secretbox = runtimeNotInitialized;
WASMCryptoInterface.secretboxOpen = runtimeNotInitialized;
WASMCryptoInterface.boxBeforenm = runtimeNotInitialized;
WASMCryptoInterface.boxKeypair = runtimeNotInitialized;
WASMCryptoInterface.generateKeys = runtimeNotInitialized;
WASMCryptoInterface.checkKey = runtimeNotInitialized;
WASMCryptoInterface.secretKeyToPublicKey = runtimeNotInitialized;
WASMCryptoInterface.generateSignature = runtimeNotInitialized;
WASMCryptoInterface.checkSignature = runtimeNotInitialized;
WASMCryptoInterface.generateKeyImage = runtimeNotInitialized;
WASMCryptoInterface.generateRingSignature = runtimeNotInitialized;
WASMCryptoInterface.checkRingSignature = runtimeNotInitialized;

const WASMCryptoInterfaceReady = new Promise((resolve, reject) => {
    // Hook into the runtime initialization event
    Module.onRuntimeInitialized = function() {

        // Bind JS functions to the WASM functions

        /* Random Scalar
         */
        const randomScalar = Module.cwrap("random_scalar", null, [
            "Uint8Array"
        ]);
        WASMCryptoInterface.randomScalar = (
            ecScalar: Pointer<Uint8Array>
        ) => randomScalar(ecScalar.to);

        /* Hash
         */
        const hash = Module.cwrap("hash", null, [
            "Uint8Array", "number",
            "Uint8Array"
        ]);
        WASMCryptoInterface.hash = (
            data: Pointer<Uint8Array>, dataLength: number,
            outHash: Pointer<Hash>
        ) => hash(data.to, dataLength, outHash.to);

        /* Encryption
         */

        /* EC Scalar multiplication by curve base point
         */
        const scalarmultBase = Module.cwrap("scalarmult_base", "number", [
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.scalarmultBase = (
            outQ: Pointer<EllipticCurvePoint>, n: Pointer<EllipticCurvePoint>
        ) => scalarmultBase(outQ.to, n.to);

        /* Secret box
         */
        const secretbox = Module.cwrap("secretbox", "number", [
            "Uint8Array",
            "Uint8Array", "number",
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.secretbox = (
            outBox: Pointer<Uint8Array>,
            msg: Pointer<Uint8Array>, msgLength: number,
            nonce: Pointer<BoxNonce>,
            secret: Pointer<BoxSecret>
        ) => secretbox(outBox.to, msg.to, msgLength, nonce.to, secret.to);

        /* Secret box open
         */
        const secretBoxOpen = Module.cwrap("secretbox_open", "number", [
            "Uint8Array",
            "Uint8Array", "number",
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.secretboxOpen = (
            outMsg: Pointer<Uint8Array>,
            box: Pointer<Uint8Array>, msgLength: number,
            nonce: Pointer<BoxNonce>,
            secret: Pointer<BoxSecret>
        ) => secretBoxOpen(outMsg.to, box.to, msgLength, nonce.to, secret.to);

        /* Box keypair gen
         */
        const boxKeypair = Module.cwrap("box_keypair", "number", [
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.boxKeypair = (
            outPub: Pointer<BoxPublicKey>,
            outSec: Pointer<BoxSecretKey>
        ) => boxKeypair(outPub.to, outSec.to);

        /* Box shared secret generation
         */
        const boxBeforenm = Module.cwrap("box_beforenm", "number", [
            "Uint8Array",
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.boxBeforenm = (
            outShared: Pointer<BoxSharedSecret>,
            pub: Pointer<BoxPublicKey>,
            sec: Pointer<BoxSecretKey>
        ) => boxBeforenm(outShared.to, pub.to, sec.to);

        /* Signing
         */

        /* Generate Keys
         */
        const generateKeys = Module.cwrap("generate_keys", null, [
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.generateKeys = (
            sec: Pointer<SignSecretKey>,
            pub: Pointer<SignPublicKey>
        ) => generateKeys(sec.to, pub.to);

        /* Check Key
         */
        const checkKey = Module.cwrap("check_key", "boolean", [
            "Uint8Array"
        ]);
        WASMCryptoInterface.checkKey = (
            pub: Pointer<SignPublicKey>
        ): boolean => checkKey(pub.to);

        /* Secret Key to Public Key
         */
        const secretKeyToPublicKey = Module.cwrap("secret_key_to_public_key", "boolean", [
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.secretKeyToPublicKey = (
            sec: Pointer<SignSecretKey>,
            pub: Pointer<SignPublicKey>
        ): boolean => secretKeyToPublicKey(sec.to, pub.to);

        /* Generate Signature
         */
        const generateSignature = Module.cwrap("generate_signature", null, [
            "Uint8Array",
            "Uint8Array",
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.generateSignature = (
            dataHash: Pointer<Hash>,
            sec: Pointer<SignSecretKey>,
            pub: Pointer<SignPublicKey>,
            sig: Pointer<Signature>
        ) => generateSignature(dataHash.to, sec.to, pub.to, sig.to);

        /* Check Signature
         */
        const checkSignature = Module.cwrap("check_signature", "boolean", [
            "Uint8Array",
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.checkSignature = (
            dataHash: Pointer<Hash>,
            pub: Pointer<SignPublicKey>,
            sig: Pointer<Signature>
        ): boolean => checkSignature(dataHash.to, pub.to, sig.to);

        /* Generate Key Image
         */
        const generateKeyImage = Module.cwrap("generate_key_image", "boolean", [
            "Uint8Array",
            "Uint8Array",
            "Uint8Array"
        ]);
        WASMCryptoInterface.generateKeyImage = (
            pub: Pointer<SignPublicKey>,
            sec: Pointer<SignSecretKey>,
            keyImage: Pointer<KeyImage>
        ) => generateKeyImage(pub.to, sec.to, keyImage.to);

        /* Generate Ring Signature
         */
        const generateRingSignature = Module.cwrap("generate_ring_signature", "boolean", [
            "Uint8Array",
            "Uint8Array",
            "Uint8Array", "number",
            "Uint8Array", "number",
            "Uint8Array"
        ]);
        WASMCryptoInterface.generateRingSignature = (
            dataHash: Pointer<Hash>,
            keyImage: Pointer<KeyImage>,
            pubs: Pointer<PublicKeyArray>, pubsCount: number,
            sec: Pointer<SignSecretKey>, secIndex: number,
            ringSig: Pointer<RingSignature>
        ) => generateRingSignature(dataHash.to, keyImage.to, pubs.to, pubsCount, sec.to, secIndex, ringSig.to);

        /* Check Ring Signature
         */
        const checkRingSignature = Module.cwrap("check_ring_signature", "boolean", [
            "Uint8Array",
            "Uint8Array",
            "Uint8Array", "number",
            "Uint8Array"
        ]);
        WASMCryptoInterface.checkRingSignature = (
            dataHash: Pointer<Hash>,
            keyImage: Pointer<KeyImage>,
            pubs: Pointer<PublicKeyArray>, pubsCount: number,
            ringSig: Pointer<RingSignature>
        ): boolean => checkRingSignature(dataHash.to, keyImage.to, pubs.to, pubsCount, ringSig.to);
        resolve();
    };
}).then(() => {
    WASMCryptoInterface.ready = true;
});

export { WASMCryptoInterface, WASMCryptoInterfaceReady };
