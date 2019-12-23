/* Box -- Public-key authenticated encryption
 * Uses public-key encryption to generate a shared secret
 *
 * Usage note: use to generate a shared secret with a peer using just their public key,
 * which can then be used for secret-box encryption
 */

/* All the different cryptographic constructs are fundamentally similar and easy to
 * mix up.  While these can be programmatically simplified, the explicit member naming
 * is used to make mistakes less possible.
 */

export interface IBoxPublicKey {
    b_public_data: Uint8Array;
}

export interface IBoxSecretKey {
    b_secret_data: Uint8Array;
}

export interface IBoxKeyPair {
    b_public_key: IBoxPublicKey;
    b_secret_key: IBoxSecretKey;
}

export interface IBoxSharedSecret {
    b_shared_secret: Uint8Array;
}

export interface IBoxFactory {
    keyPair: () => Promise<IBoxKeyPair>;
    sharedKey: (remotePublicKey: IBoxPublicKey, localSecretKey: IBoxSecretKey) => Promise<IBoxSharedSecret>;
    box: (msg: Uint8Array, nonce: Uint8Array, key: IBoxSharedSecret) => Promise<Uint8Array>;
    open: (box: Uint8Array, nonce: Uint8Array, key: IBoxSharedSecret) => Promise<Uint8Array>;
    constants: typeof BOX_CONSTANTS;
}

const BOX_CONSTANTS = {
    PUBLIC_KEY_LENGTH: 32,
    SECRET_KEY_LENGTH: 32,
    SHARED_KEY_LENGTH: 32,
    NONCE_LENGTH: 24
};

export { BOX_CONSTANTS };
