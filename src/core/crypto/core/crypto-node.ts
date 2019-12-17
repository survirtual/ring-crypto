import "@util";
import { CryptoWASM } from "./wasm/crypto-wasm";
import { HashFactory } from "./factories/hash-factory";
import { RandomFactory } from "./factories/random-factory";
import { SignFactory } from "./factories/sign-factory";
import { ICrypto } from "./interfaces/i-crypto";
import { SecretBoxFactory } from "./factories/secret-box-factory";
import { BoxFactory } from "./factories/box-factory";
import { RingSignFactory } from "./factories/ring-sign-factory";
import { deserializeArgs, serializeTypes } from "./crypto-serialize";

class CryptoNode implements ICrypto {
    public readonly Random = new RandomFactory();
    public readonly Hash = new HashFactory();
    public readonly SecretBox = new SecretBoxFactory();
    public readonly Box = new BoxFactory();
    public readonly Sign = new SignFactory();
    public readonly Ring = new RingSignFactory();

    public async ready() {
        await CryptoWASM.ready();
    }

    public handleMessage(): (msg) => Promise<any> {
        const self = this;
        return async (msg): Promise<any> => {
            return await self.handleCommand(msg);
        };
    }

    private async handleCommand(cmd: any): Promise<any> {
        await this.ready();
        const { ccmd, args } = cmd.data;
        const split = ccmd.split(".");
        const type = split[0];
        const method = split[1];
        for (const modName in this) {
            if (modName !== type || typeof this[modName] === "function") {
                continue;
            } else {
                const mod = this[modName];
                const func = mod[method] as () => any;
                if (func) {
                    deserializeArgs(args);
                    const res = serializeTypes(await func.call(mod, ...args));
                    return res;
                }
                return null;
            }
        }
        return null;
    }
}

(global as any).UDOS = (global as any).UDOS || {};
const crypto = ((global as any).UDOS.Crypto || new CryptoNode()) as CryptoNode;
(global as any).UDOS.Crypto = crypto;

export { crypto as Crypto };
