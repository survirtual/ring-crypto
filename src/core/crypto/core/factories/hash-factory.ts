import "@util";
import { CryptoWASM } from "../wasm/crypto-wasm";
import { IHashFactory, IHash } from "../interfaces/i-hash";
export class HashFactory implements IHashFactory {
  public async data(data: Uint8Array): Promise<IHash> {
    return {
      hash: CryptoWASM.hash(data)
    };
  }
}
