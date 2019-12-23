/* Secret Box -- Symmetric authenticated encryption
 *
 * Usage notes: encrypts / decrypts using secret key
 */

 /* All the different cryptographic constructs are fundamentally similar and easy to
 * mix up.  While these can be programmatically simplified, the explicit member naming
 * is used to make mistakes less possible.
 */

export interface ISecretBoxKey {
    sb_secret: Uint8Array;
}

export interface ISecretBoxFactory {
    key: () => Promise<ISecretBoxKey>;
    box: (msg: Uint8Array, nonce: Uint8Array, key: ISecretBoxKey) => Promise<Uint8Array>;
    open: (box: Uint8Array, nonce: Uint8Array, key: ISecretBoxKey) => Promise<Uint8Array>;
    constants: typeof SECRET_BOX_CONSTANTS;
}

const SECRET_BOX_CONSTANTS = {
    KEY_LENGTH: 32,
    MSG_ZERO_BYTES: 32,
    BOX_ZERO_BYTES: 16,
    NONCE_LENGTH: 24
};

export { SECRET_BOX_CONSTANTS };
