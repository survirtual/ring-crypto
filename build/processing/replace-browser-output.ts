import { transpileRoot, browserRoot } from "../utility/app-root";
import { copy } from "../utility/copy";
import { replaceTranspileAlias } from "./replace-transpile-alias";

const root = browserRoot();
copy(transpileRoot(), root, (err) => {
    if (err) {
        throw err;
    }

    replaceTranspileAlias(root, (rTAErr) => {
        if (rTAErr) {
            throw rTAErr;
        }
    });
});
