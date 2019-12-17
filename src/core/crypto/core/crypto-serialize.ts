import { BufferUtility } from "@util/index";

const serializeArgs = function(args) {
    const serialized = [];
    if (args) {
        args.forEach((arg) => {
            serialized.push(serializeTypes(arg));
        });
    }
    return serialized;
};

const deserializeArgs = function(args) {
    if (args) {
        for (let i = 0; i < args.length; i++) {
            args[i] = deserializeTypes(args[i]);
        }
    }
};

const serializeTypes = function(obj) {
    if (obj == null) {
        return obj;
    }
    if (typeof obj !== "object") {
        return obj;
    }
    if (obj.length) {
        if (obj.length > 0) {
            // Need to catch non-byte arrays
            if (typeof obj[0] !== "number") {
                return serializeArgs(obj);
            }
        }
        return {
            d: BufferUtility.toBase64(Buffer.from(obj)).b64
        };
    }
    const ret = {};
    const props = Object.getOwnPropertyNames(obj);
    props.forEach((p) => {
        const o = obj[p];
        ret[p] = o;
        if (typeof o === "string") {
            return;
        }
        if (o.length) {
            if (o.length > 0) {
                // Need to catch non-byte arrays
                if (typeof o[0] !== "number") {
                    ret[p] = serializeArgs(o);
                    return;
                }
            }
            ret[p] = {
                d: BufferUtility.toBase64(Buffer.from(o)).b64
            };
            return;
        } else {
            ret[p] = serializeTypes(o);
        }
    });
    return ret;
};

const deserializeTypes = function(obj) {
    if (obj == null) {
        return obj;
    }
    if (typeof obj !== "object") {
        return obj;
    }
    if (obj.d && typeof obj.d === "string") {
        return BufferUtility.fromBase64({ b64: obj.d });
    }
    if (obj.length) {
        deserializeArgs(obj);
        return obj;
    }
    const props = Object.getOwnPropertyNames(obj);
    props.forEach((p) => {
        const o = obj[p];
        if (typeof o === "string") {
            return;
        }
        if (o.d && typeof o.d === "string") {
            obj[p] = BufferUtility.fromBase64({ b64: o.d });
            return;
        } else {
            obj[p] = deserializeTypes(o);
        }
    });
    return obj;
};

export { serializeTypes, serializeArgs, deserializeTypes, deserializeArgs };
