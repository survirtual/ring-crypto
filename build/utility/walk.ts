import * as fs from "fs";
import * as path from "path";

export const walk = function(dir, forEach, done) {
    fs.readdir(dir, function(err, list) {
        if (err) {
            return done(err);
        }
        let pending = list.length;
        if (!pending) {
            return done(null);
        }
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(inErr, stat) {
                if (inErr) { done(inErr); }
                if (stat && stat.isDirectory()) {
                    walk(file, forEach, function(inInErr) {
                        if (inInErr) { done(inInErr); }
                        if (!--pending) { done(null); }
                    });
                } else {
                    forEach(file);
                    if (!--pending) { done(null); }
                }
            });
        });
    });
};
