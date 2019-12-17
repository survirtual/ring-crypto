// tslint:disable:max-classes-per-file

export class ByteLengthError extends Error {}

export const byteLengthGuard = function(byteLength: number, init?: Uint8Array, offset?: number): [any, any, any] {
    if (init) {
        if (init.length !== byteLength) {
            throw new ByteLengthError(`Type must be initialized with ${byteLength} bytes.  Received: ${init.byteLength}`);
        }
        if (offset) {
            if (offset + byteLength > init.length) {
                throw new ByteLengthError(`Out of bounds: array offset of ${offset} plus byte length of ${byteLength} exceeds initialization byte array of ${init.length}`);
            }
            return [init, offset, byteLength];
        }
        return [init, null, null];
    } else {
        return [byteLength, null, null];
    }
};
