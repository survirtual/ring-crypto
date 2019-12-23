import { CryptoWASM } from "../wasm/crypto-wasm";
import { IBoxFactory, IBoxKeyPair, IBoxPublicKey, IBoxSecretKey, IBoxSharedSecret, BOX_CONSTANTS } from "../interfaces/i-box";

export class BoxFactory implements IBoxFactory {
    public constants = BOX_CONSTANTS;

    public async keyPair(): Promise<IBoxKeyPair> {
        const keys = CryptoWASM.boxKeyPair();
        return {
            b_secret_key: {
                b_secret_data: keys.secretKey
            },

            b_public_key: {
                b_public_data: keys.publicKey
            }
        };
    }

    public async sharedKey(remotePublicKey: IBoxPublicKey, localSecretKey: IBoxSecretKey): Promise<IBoxSharedSecret> {
        const sharedSecret = CryptoWASM.boxCreateSharedSecret(remotePublicKey.b_public_data, localSecretKey.b_secret_data);
        return {
            b_shared_secret: sharedSecret
        };
    }

    public async box(msg: Uint8Array, nonce: Uint8Array, key: IBoxSharedSecret): Promise<Uint8Array> {
        return CryptoWASM.secretbox(msg, nonce, key.b_shared_secret);
    }

    public async open(box: Uint8Array, nonce: Uint8Array, key: IBoxSharedSecret): Promise<Uint8Array> {
        return CryptoWASM.secretboxOpen(box, nonce, key.b_shared_secret);
    }

}
