import { IHashFactory } from "./i-hash";
import { ISignFactory } from "./i-sign";
import { ISecretBoxFactory } from "./i-secret-box";
import { IBoxFactory } from "./i-box";
import { IRingSignFactory } from "./i-ring-sign";

export interface ICrypto {
    ready: () => Promise<void>;

    Random: {
        bytes: (count: number) => Uint8Array
        setPRNG: (fn: (buffer: Uint8Array, byteCount: number) => void) => void
    };

    Hash: IHashFactory;

    SecretBox: ISecretBoxFactory;

    Box: IBoxFactory;

    Sign: ISignFactory;

    Ring: IRingSignFactory;
}
