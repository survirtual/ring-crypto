import { transpileRoot, nodejsRoot } from "../utility/app-root";
import { copy } from "../utility/copy";
import { replaceTranspileAlias } from "./replace-transpile-alias";

const root = nodejsRoot();

copy(transpileRoot(), root, (err) => {
    if (err) {
        throw err;
    }

    replaceTranspileAlias(root, (rtaError) => {
        if (rtaError) {
            throw rtaError;
        }
    });

});
