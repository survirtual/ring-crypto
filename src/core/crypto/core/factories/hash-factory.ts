import "@util";
import { CryptoWASM } from "../wasm/crypto-wasm";
import { IHashFactory, IHash, HASH_CONSTANTS } from "../interfaces/i-hash";
export class HashFactory implements IHashFactory {
  public constants = HASH_CONSTANTS;

  public async data(data: Uint8Array): Promise<IHash> {
    return {
      hash: CryptoWASM.hash(data)
    };
  }
}
