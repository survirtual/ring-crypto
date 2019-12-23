import { readFileSync, existsSync } from "fs";
import { resolve as pathResolve } from "path";

const pkgJson = readFileSync(`${process.cwd()}/package.json`).toString();
const pkg = JSON.parse(pkgJson);
const pkgName = pkg.name;

const moduleName = "ring-crypto";
const root = `${process.cwd()}/`;

const isDep = existsSync(`${root}/../../../node_modules`);
let runtimeFolder;
if (isDep) {
    runtimeFolder = pathResolve(`${root}/node_modules/ring-crypto`);
} else {
    runtimeFolder = pathResolve(`${root}`);
}

export const isDependency = () => {
    return isDep;
};

export const appRoot = () => {
    return root;
};

export const distRoot = () => {
    return `${appRoot()}dist/`;
};

export const srcRoot = () => {
    return `${appRoot()}src/`;
};

export const transpileRoot = () => {
    return `${distRoot()}transpile/`;
};

export const browserRoot = () => {
    return `${distRoot()}browser/`;
};

export const nodejsRoot = () => {
    return `${distRoot()}nodejs/`;
};
