import { ICrypto } from "./interfaces/i-crypto";
import { RandomFactory } from "./factories/random-factory";
import { ISignKeyPair, ISignature, ISignPublicKey, SIGN_CONSTANTS } from "./interfaces/i-sign";
import { ISecretBoxKey, SECRET_BOX_CONSTANTS } from "./interfaces/i-secret-box";
import { IBoxKeyPair, IBoxPublicKey, IBoxSecretKey, IBoxSharedSecret, BOX_CONSTANTS } from "./interfaces/i-box";
import { IKeyImage, IRingSignature, RING_CONSTANTS } from "./interfaces/i-ring-sign";
import { IHash, HASH_CONSTANTS } from "./interfaces/i-hash";
import { serializeArgs, deserializeTypes } from "./crypto-serialize";

export class CryptoRelay implements ICrypto {
    public readonly Random = new RandomFactory();

    public readonly Hash = {
        constants: HASH_CONSTANTS,

        async data(data: Uint8Array): Promise<IHash> {
            return await crypto.relayCommand("Hash.data", data);
        }
    };

    public readonly SecretBox = {
        constants: SECRET_BOX_CONSTANTS,

        async key(): Promise<ISecretBoxKey> {
            return await crypto.relayCommand("SecretBox.key");
        },

        async box(msg: Uint8Array, nonce: Uint8Array, key: ISecretBoxKey): Promise<Uint8Array> {
            return await crypto.relayCommand("SecretBox.box", msg, nonce, key);
        },

        async open(box: Uint8Array, nonce: Uint8Array, key: ISecretBoxKey): Promise<Uint8Array> {
            return await crypto.relayCommand("SecretBox.open", box, nonce, key);
        }
    };

    public readonly Box = {
        constants: BOX_CONSTANTS,

        async keyPair(): Promise<IBoxKeyPair> {
            return await crypto.relayCommand("Box.keyPair");
        },

        async sharedKey(remotePublicKey: IBoxPublicKey, localSecretKey: IBoxSecretKey): Promise<IBoxSharedSecret> {
            return await crypto.relayCommand("Box.sharedKey", remotePublicKey, localSecretKey);
        },

        async box(msg: Uint8Array, nonce: Uint8Array, key: IBoxSharedSecret): Promise<Uint8Array> {
            return await crypto.relayCommand("Box.box", msg, nonce, key);
        },

        async open(box: Uint8Array, nonce: Uint8Array, key: IBoxSharedSecret): Promise<Uint8Array> {
            return await crypto.relayCommand("Box.open", box, nonce, key);
        }
    };

    public readonly Sign = {
        constants: SIGN_CONSTANTS,

        async keyPair(): Promise<ISignKeyPair> {
            return await crypto.relayCommand("Sign.keyPair");
        },

        async sign(msg: Uint8Array, keyPair: ISignKeyPair): Promise<ISignature> {
            return await crypto.relayCommand("Sign.sign", msg, keyPair);
        },

        async verify(msg: Uint8Array, publicKey: ISignPublicKey, signature: ISignature): Promise<boolean> {
            return await crypto.relayCommand("Sign.verify", msg, publicKey, signature);
        }
    };

    public readonly Ring = {
        constants: RING_CONSTANTS,

        async sign(
            msg: Uint8Array,
            secretKeyPair: ISignKeyPair,
            ring: ISignPublicKey[],
            keyImage?: IKeyImage
        ): Promise<IRingSignature> {
            return await crypto.relayCommand("Ring.sign", msg, secretKeyPair, ring, keyImage);
        },

        async verify(msg: Uint8Array, ring: ISignPublicKey[], ringSignature: IRingSignature): Promise<boolean> {
            return await crypto.relayCommand("Ring.verify", msg, ring, ringSignature);
        }
    };

    private workerPipe;
    private initialized: Promise<void>;
    private initializedResolve: () => void;
    constructor() {
        const self = this;
        this.initialized = new Promise((resolve, reject) => {
            self.initializedResolve = resolve;
        });
    }

    public async ready(): Promise<void> {
        await this.initialized;
    }

    public async init(workerPipe): Promise<void> {
        this.workerPipe = workerPipe;
        await this.relayCommand("self.ready");
        this.initializedResolve();
    }

    public async relayCommand(cmdName: string, ...args): Promise<any> {
        const serialized = serializeArgs(args);
        const ret = await this.workerPipe.pipe({
            meta: {
                type: "cmd",
                cmd: "cryptoRelay"
            },
            data: {
                ccmd: cmdName,
                args: serialized
            }
        });
        return deserializeTypes(ret);
    }
}

(global as any).UDOS = (global as any).UDOS || {};
const crypto = ((global as any).UDOS.CryptoRelay || new CryptoRelay()) as CryptoRelay;
(global as any).UDOS.CryptoRelay = crypto;
(global as any).UDOS.Crypto = (global as any).UDOS.Crypto || crypto;

export { crypto as Crypto };
