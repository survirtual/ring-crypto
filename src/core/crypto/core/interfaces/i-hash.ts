export interface IHash {
    hash: Uint8Array;
}

export interface IHashFactory {
    data: (data: Uint8Array) => Promise<IHash>;
}

const HASH_CONSTANTS = {
    HASH_LENGTH: 32
};

export { HASH_CONSTANTS };
