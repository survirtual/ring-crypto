import { walk } from "./walk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

export const copy = (rawSrc: string, rawTarget: string, done) => {
    const src = rawSrc.replace("//", "/");
    const target = rawTarget.replace("//", "/");

    if (!existsSync(target)) {
        mkdirSync(target);
    }
    walk(src, (file) => {
        // Copy folders
        const dirName = dirname(file);
        let current = target;
        if (current.endsWith("/")) {
            current = current.substring(0, current.length - 1);
        }
        dirName.substring(src.length)
            .split("/")
            .forEach((folderName) => {
                current = `${current}/${folderName}`;
                if (!existsSync(current)) {
                    mkdirSync(current);
                }
            });

        // Copy file
        const targetFile = file.replace(src, target);
        writeFileSync(targetFile, readFileSync(file));
    }, done);
};
