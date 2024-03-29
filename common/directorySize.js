/**
 * Created by xgharibyan on 11/1/16.
 */

const fs = require('fs');
const config = require('../config/env');


function readSizeRecursive(dir, done) {
    let results = [];
    fs.readdir(dir, (err, list) => {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, sum(results));
            file = dir + '/' + file;

            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    readSizeRecursive(file, (err, res) => {
                        results = results.concat(res);
                        next();
                    });

                } else {
                    results.push(stat.size);
                    next();
                }
            });
        })();
    });
}

function sum(array) {
    return array.reduce((pv, cv) => pv + cv, 0);
}

function getUserStorageSize(user) {
    return new Promise((resolve, reject) => {
        const rootDir = `${config.stuff_path}projects/${user.username}`;
        if(user.role == 'God') return resolve(0);
        readSizeRecursive(rootDir, (err, size) => {
            if (err) return reject(err);
            return resolve(size);
        });
    });
}

module.exports = {
    readSizeRecursive,
    getUserStorageSize
};
