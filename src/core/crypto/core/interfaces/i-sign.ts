/* Signing using ECC curve ed225519
 */

/* All the different cryptographic constructs are fundamentally similar and easy to
 * mix up.  While these can be programmatically simplified, the explicit member naming
 * is used to make mistakes less possible.
 */

import { IHash } from "./i-hash";

export interface ISignPublicKey {
    s_public_data: Uint8Array;
}

export interface ISignSecretKey {
    s_secret_data: Uint8Array;
}

export interface ISignKeyPair {
    s_secret_key: ISignSecretKey;
    s_public_key: ISignPublicKey;
}

export interface ISignature {
    s_sig: Uint8Array;
}

export interface ISignFactory {
    keyPair: () => Promise<ISignKeyPair>;
    sign: (msg: Uint8Array, keyPair: ISignKeyPair) => Promise<ISignature>;
    verify: (msg: Uint8Array, publicKey: ISignPublicKey, signature: ISignature) => Promise<boolean>;
    constants: typeof SIGN_CONSTANTS;
}

const SIGN_CONSTANTS = {
    PUBLIC_KEY_LENGTH: 32,
    SECRET_KEY_LENGTH: 32,
    SIGNATURE_LENGTH: 64
};

export { SIGN_CONSTANTS };
