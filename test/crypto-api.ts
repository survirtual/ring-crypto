// tslint:disable:prefer-const
// tslint:disable:no-string-literal
import "mocha";
import assert = require("assert");
import { BufferUtility } from "@util/index";
import { Crypto } from "@core/crypto";
import { HASH_CONSTANTS } from "@core/crypto/core/interfaces/i-hash";
import { SECRET_BOX_CONSTANTS } from "@core/crypto/core/interfaces/i-secret-box";
import { BOX_CONSTANTS } from "@core/crypto/core/interfaces/i-box";
import { SIGN_CONSTANTS } from "@core/crypto/core/interfaces/i-sign";
import { RING_CONSTANTS } from "@core/crypto/core/interfaces/i-ring-sign";

export default () => {
    describe("crypto-api", function() {

        before(async function() {

        });
        beforeEach(async () => {

        });
        describe("random", function() {
            it("should produce random bytes of designated length", async function() {
                const testIterations = 100;
                const testLength = 16;
                const emptyBytes = new Uint8Array(testLength);

                let prevRandomBytes = {};
                for (let i = 0; i < testIterations; i++) {
                    const randomBytes = Crypto.Random.bytes(testLength);
                    assert.equal(randomBytes.length, testLength);
                    assert.notDeepEqual(randomBytes, emptyBytes);

                    const key = BufferUtility.toBase58(Buffer.from(randomBytes)).b58;
                    assert.equal(typeof prevRandomBytes[key], "undefined");
                    prevRandomBytes[key] = true;
                }
            });
        });

        describe("hash", function() {
            it("should hash", async function() {
                const testIterations = 100;
                const emptyBytes = new Uint8Array(HASH_CONSTANTS.HASH_LENGTH);
                let prevHashes = {};
                for (let i = 0; i < testIterations; i++) {
                    const hash = (await Crypto.Hash.data(Buffer.from(i.toString()))).hash;
                    assert.equal(hash.length, HASH_CONSTANTS.HASH_LENGTH);
                    assert.notDeepEqual(hash, emptyBytes);

                    const key = BufferUtility.toBase58(Buffer.from(hash)).b58;
                    assert.equal(typeof prevHashes[key], "undefined");
                    prevHashes[key] = true;
                }
            });
        });

        describe("secretbox", function() {
            it("should generate a secret key", async function() {
                const testIterations = 100;
                const emptyBytes = new Uint8Array(SECRET_BOX_CONSTANTS.KEY_LENGTH);
                let prevKeys = {};
                for (let i = 0; i < testIterations; i++) {
                    const secretKey = (await Crypto.SecretBox.key()).sb_secret;
                    assert.equal(secretKey.length, SECRET_BOX_CONSTANTS.KEY_LENGTH);
                    assert.notDeepEqual(secretKey, emptyBytes);

                    const key = BufferUtility.toBase58(Buffer.from(secretKey)).b58;
                    assert.equal(typeof prevKeys[key], "undefined");
                    prevKeys[key] = true;
                }
            });

            it("should create a secret box", async function() {
                const secretKey = (await Crypto.SecretBox.key());
                const msg = Buffer.from("box this message up");
                const emptyBytes = new Uint8Array(msg.length + SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES);
                const nonce = Crypto.Random.bytes(SECRET_BOX_CONSTANTS.NONCE_LENGTH);

                const box = await Crypto.SecretBox.box(msg, nonce, secretKey);

                assert.equal(box.length, msg.length + SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES);
                assert.notDeepEqual(box, emptyBytes);
                assert.notDeepEqual(box, msg);
            });

            it("should open a secret box", async function() {
                const secretKey = (await Crypto.SecretBox.key());
                const msg = Buffer.from("box this message up");
                const nonce = Crypto.Random.bytes(SECRET_BOX_CONSTANTS.NONCE_LENGTH);

                const box = await Crypto.SecretBox.box(msg, nonce, secretKey);

                const unbox = await Crypto.SecretBox.open(box, nonce, secretKey);

                assert.deepEqual(unbox, msg);
            });
        });

        describe("box", function() {
            it("should generate a keypair for boxing", async function() {
                const emptyPubBytes = new Uint8Array(BOX_CONSTANTS.PUBLIC_KEY_LENGTH);
                const emptySecBytes = new Uint8Array(BOX_CONSTANTS.SECRET_KEY_LENGTH);

                const keyPair = await Crypto.Box.keyPair();

                assert.equal(keyPair.b_public_key.b_public_data.length, BOX_CONSTANTS.PUBLIC_KEY_LENGTH);
                assert.equal(keyPair.b_secret_key.b_secret_data.length, BOX_CONSTANTS.SECRET_KEY_LENGTH);
                assert.notDeepEqual(keyPair.b_public_key.b_public_data, emptyPubBytes);
                assert.notDeepEqual(keyPair.b_secret_key.b_secret_data, emptySecBytes);
            });

            it("should generate a shared key", async function() {
                const emptySharedKeyBytes = new Uint8Array(BOX_CONSTANTS.SHARED_KEY_LENGTH);

                const keyPairA = await Crypto.Box.keyPair();
                const keyPairB = await Crypto.Box.keyPair();

                const sharedKeyA = await Crypto.Box.sharedKey(keyPairB.b_public_key, keyPairA.b_secret_key);
                assert.equal(sharedKeyA.b_shared_secret.length, BOX_CONSTANTS.SHARED_KEY_LENGTH);
                assert.notDeepEqual(sharedKeyA.b_shared_secret, emptySharedKeyBytes);

                const sharedKeyB = await Crypto.Box.sharedKey(keyPairA.b_public_key, keyPairB.b_secret_key);

                assert.deepEqual(sharedKeyA, sharedKeyB);
            });

            it("should secret box with a shared key", async function() {
                const keyPairA = await Crypto.Box.keyPair();
                const keyPairB = await Crypto.Box.keyPair();
                const sharedKeyA = await Crypto.Box.sharedKey(keyPairB.b_public_key, keyPairA.b_secret_key);
                const sharedKeyB = await Crypto.Box.sharedKey(keyPairA.b_public_key, keyPairB.b_secret_key);

                const msg = Buffer.from("box this message up");
                const emptyBytes = new Uint8Array(msg.length + SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES);
                const nonce = Crypto.Random.bytes(SECRET_BOX_CONSTANTS.NONCE_LENGTH);

                const boxA = await Crypto.Box.box(msg, nonce, sharedKeyA);
                const boxB = await Crypto.Box.box(msg, nonce, sharedKeyB);

                assert.equal(boxA.length, msg.length + SECRET_BOX_CONSTANTS.BOX_ZERO_BYTES);
                assert.notDeepEqual(boxA, emptyBytes);
                assert.notDeepEqual(boxA, msg);
                assert.deepEqual(boxA, boxB);
            });

            it("should open a secret box with a shared key", async function() {
                const keyPairA = await Crypto.Box.keyPair();
                const keyPairB = await Crypto.Box.keyPair();
                const sharedKeyA = await Crypto.Box.sharedKey(keyPairB.b_public_key, keyPairA.b_secret_key);
                const sharedKeyB = await Crypto.Box.sharedKey(keyPairA.b_public_key, keyPairB.b_secret_key);

                const msg = Buffer.from("box this message up");
                const nonce = Crypto.Random.bytes(SECRET_BOX_CONSTANTS.NONCE_LENGTH);

                const box = await Crypto.Box.box(msg, nonce, sharedKeyA);

                const unbox = await Crypto.Box.open(box, nonce, sharedKeyB);

                assert.deepEqual(unbox, msg);
            });
        });

        describe("sign", function() {
            it("should generate a signing keypair", async function() {
                const emptyPubBytes = new Uint8Array(SIGN_CONSTANTS.PUBLIC_KEY_LENGTH);
                const emptySecBytes = new Uint8Array(SIGN_CONSTANTS.SECRET_KEY_LENGTH);

                const keyPair = await Crypto.Sign.keyPair();

                assert.equal(keyPair.s_public_key.s_public_data.length, SIGN_CONSTANTS.PUBLIC_KEY_LENGTH);
                assert.equal(keyPair.s_secret_key.s_secret_data.length, SIGN_CONSTANTS.SECRET_KEY_LENGTH);
                assert.notDeepEqual(keyPair.s_public_key.s_public_data, emptyPubBytes);
                assert.notDeepEqual(keyPair.s_secret_key.s_secret_data, emptySecBytes);
            });

            it("should generate a signature", async function() {
                const emptySigBytes = new Uint8Array(SIGN_CONSTANTS.SIGNATURE_LENGTH);
                const keyPair = await Crypto.Sign.keyPair();

                const msg = Buffer.from("box this message up");
                const sign = await Crypto.Sign.sign(msg, keyPair);

                assert.equal(sign.s_sig.length, SIGN_CONSTANTS.SIGNATURE_LENGTH);
                assert.notDeepEqual(sign.s_sig, emptySigBytes);
            });

            it("should verify a signature", async function() {
                const keyPair = await Crypto.Sign.keyPair();
                const keyPairBad = await Crypto.Sign.keyPair();
                const msg = Buffer.from("box this message up");
                const sign = await Crypto.Sign.sign(msg, keyPair);

                assert.equal(await Crypto.Sign.verify(msg, keyPair.s_public_key, sign), true);
                assert.equal(await Crypto.Sign.verify(msg, keyPairBad.s_public_key, sign), false);
            });
        });

        describe("ring", function() {
            it("should generate a ring signature", async function() {
                const ringSize = 20;
                const ring = [];
                for (let i = 0; i < ringSize - 1; i++) {
                    const keyPair = await Crypto.Sign.keyPair();
                    ring.push(keyPair.s_public_key);
                }
                const secretKeyPair = await Crypto.Sign.keyPair();
                ring.push(secretKeyPair.s_public_key);

                const msg = Buffer.from("box this message up");
                const ringSig = await Crypto.Ring.sign(msg, secretKeyPair, ring);

                assert.equal(ringSig.r_signature.length, SIGN_CONSTANTS.SIGNATURE_LENGTH * ringSize);
                assert.equal(ringSig.r_key_image.r_key_image.length, RING_CONSTANTS.KEY_IMAGE_LENGTH);
            });

            it("should verify a ring signature", async function() {
                const ringSize = 20;
                const ring = [];
                for (let i = 0; i < ringSize - 1; i++) {
                    const keyPair = await Crypto.Sign.keyPair();
                    ring.push(keyPair.s_public_key);
                }
                const secretKeyPair = await Crypto.Sign.keyPair();
                ring.push(secretKeyPair.s_public_key);

                const msg = Buffer.from("box this message up");
                const ringSig = await Crypto.Ring.sign(msg, secretKeyPair, ring);

                assert.equal(await Crypto.Ring.verify(msg, ring, ringSig), true);

                const keyPairBad = await Crypto.Sign.keyPair();
                ring.splice(5, 1, keyPairBad.s_public_key);

                assert.equal(await Crypto.Ring.verify(msg, ring, ringSig), false);
            });

            /*
             * Key images are the ID of vote submissions.  They allow linkability for voting.
             * Store all key images in a DB and an index.
             */
            it("should have a ring signature image collision with different messages", async function() {
                const ringSize = 20;
                const ring = [];
                for (let i = 0; i < ringSize - 1; i++) {
                    const keyPair = await Crypto.Sign.keyPair();
                    ring.push(keyPair.s_public_key);
                }
                const secretKeyPair = await Crypto.Sign.keyPair();
                ring.push(secretKeyPair.s_public_key);

                const msgA = Buffer.from("box this message up");
                const ringSigA = await Crypto.Ring.sign(msgA, secretKeyPair, ring);
                const keyImgA = ringSigA.r_key_image.r_key_image;

                const msgB = Buffer.from("box this message up Number 2");
                const ringSigB = await Crypto.Ring.sign(msgB, secretKeyPair, ring);
                const keyImgB = ringSigB.r_key_image.r_key_image;

                assert.deepEqual(keyImgA, keyImgB);
            });
        });
    });
};
