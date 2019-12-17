import { aliasReplace } from "./alias-replace";

export const replaceTranspileAlias = (root, done: (err?: Error) => void) => {
    let pending = 2;
    {
        aliasReplace(root, ".js", (err) => {
            if (err) {
                done(err);
                return;
            }
            pending--;
            if (pending === 0) {
                done();
            }
        });
    }

    {
        aliasReplace(root, ".d.ts", (err) => {
            if (err) {
                done(err);
                return;
            }
            pending--;
            if (pending === 0) {
                done();
            }
        });
    }
};
