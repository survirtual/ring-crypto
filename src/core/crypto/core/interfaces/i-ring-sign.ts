import {ISignSecretKey, ISignPublicKey, ISignature, ISignKeyPair } from "./i-sign";

export interface IKeyImage {
    r_key_image: Uint8Array;
}

export interface IRingSignature {
    r_key_image: IKeyImage;
    r_signature: Uint8Array;
}

export interface IRingSignFactory {
    sign: (msg: Uint8Array, secretKeyPair: ISignKeyPair, ring: ISignPublicKey[], keyImage?: IKeyImage) => Promise<IRingSignature>;
    verify: (msg: Uint8Array, ring: ISignPublicKey[], ringSignature: IRingSignature) => Promise<boolean>;
}

const RING_CONSTANTS = {
    KEY_IMAGE_LENGTH: 32
};

export { RING_CONSTANTS };
