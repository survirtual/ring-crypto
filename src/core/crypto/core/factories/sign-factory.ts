import { CryptoWASM } from "../wasm/crypto-wasm";
import { ISignFactory, ISignKeyPair, ISignature, ISignPublicKey, SIGN_CONSTANTS } from "../interfaces/i-sign";

export class SignFactory implements ISignFactory {
    public constants = SIGN_CONSTANTS;

    public async keyPair(): Promise<ISignKeyPair> {
        await CryptoWASM.ready();
        const keys = await CryptoWASM.generateKeys();
        return {
            s_secret_key: {
                s_secret_data: keys.secretKey
            },

            s_public_key: {
                s_public_data: keys.publicKey
            }
        };
    }

    public async sign(msg: Uint8Array, keyPair: ISignKeyPair): Promise<ISignature> {
        await CryptoWASM.ready();
        const hash = await CryptoWASM.hash(msg);
        const sig = await CryptoWASM.generateSignature(
            hash,
            keyPair.s_secret_key.s_secret_data,
            keyPair.s_public_key.s_public_data
        );
        return {
            s_sig: sig
        };
    }

    public async verify(msg: Uint8Array, publicKey: ISignPublicKey, signature: ISignature): Promise<boolean> {
        await CryptoWASM.ready();
        const hash = await CryptoWASM.hash(msg);
        return await CryptoWASM.checkSignature(hash, publicKey.s_public_data, signature.s_sig);
    }
}
