import * as fs from "fs";
import * as path from "path";
import { walk } from "../utility/walk";
import { appRoot } from "../utility/app-root";

const pkg = JSON.parse(fs.readFileSync(`${appRoot()}/package.json`).toString());

const srcAlias = pkg._moduleAliases;

export const aliasReplace = function(root, filter, done) {
    const alias = {};
    for (const key in srcAlias) {
        if (srcAlias.hasOwnProperty(key)) {
            let p;
            if (srcAlias[key].startsWith("./dist/")) {
                p = srcAlias[key].replace("./dist/", root);
            } else {
                p = srcAlias[key];
            }
            alias[key] = p;
        }
    }
    walk(root, (file) => {
        if (file.endsWith(filter)) {
            let fileText = fs.readFileSync(`${file}`).toString();
            for (const key in alias) {
                if (alias.hasOwnProperty(key)) {
                    const p = alias[key];
                    let relativePath = path.relative(file, p);
                    if (relativePath.startsWith("..")) {
                        relativePath = relativePath.substr(1);
                    }
                    fileText = fileText.split(`"${key}`).join(`"${relativePath}`);
                }
            }
            const buf = Buffer.from(fileText);
            fs.writeFileSync(`${file}`, buf);
        }
    }, done);
};
