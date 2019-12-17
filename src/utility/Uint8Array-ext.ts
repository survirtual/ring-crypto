interface Uint8ArrayConstructor {
    concat(arr: Uint8Array[]): Uint8Array;
}

Uint8Array.concat = function(arr: Uint8Array[]): Uint8Array {
    let len = 0;
    for (const buf of arr) {
        len += buf.length;
    }
    const res = new Uint8Array(len);
    let pos = 0;
    for (const buf of arr) {
        for (let i = 0; i < buf.length; i++) {
            res[pos + i] = buf[i];
        }
        pos += buf.length;
    }
    return res;
};
