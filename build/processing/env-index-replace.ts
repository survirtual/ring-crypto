import * as fs from "fs";
import { walk } from "../utility/walk";

const key = "@env-index";
export const envIndexReplace = function(root, env, done) {
    walk(root, (file) => {
        if (file.endsWith(".js")) {
            let fileText = fs.readFileSync(`${file}`).toString();
            fileText = fileText.split(`${key}`).join(`${env}`);
            const buf = Buffer.from(fileText);
            fs.writeFileSync(`${file}`, buf);
        }
    }, done);
};
