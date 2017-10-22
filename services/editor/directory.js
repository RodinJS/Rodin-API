/**
 * Created by xgharibyan on 4/9/17.
 */
const fs = require('fs');
const fsExtra = require('fs-extra');
const Promise = require('bluebird');
const httpStatus = require('../../common/httpStatus');
const utils = require('../../common/utils');
const config = require('../../config/env');
const _ = require('lodash');
const extract = require('extract-zip');

/**
 *
 * @param filePath
 */
function isDirectory(filePath) {
    try {
        return fs.statSync(filePath).isDirectory();
    } catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        } else {
            throw e;
        }
    }
}
/**
 *
 * @param req
 * @param filePath
 */
function create(req, filePath) {
    return new Promise((resolve, reject) => {

        if (fs.existsSync(filePath) && !isDirectory(filePath)) {
            return reject({
                error: `
      There is already a file with the same name as the folder name you specified.Specify a different name.
      `, code: httpStatus.FILE_ALREDY_EXIST
            });
        }

        if (fs.existsSync(filePath)) {
            return reject({error: `Folder already exists!`, code: httpStatus.FILE_ALREDY_EXIST})
        }
        fsExtra.ensureDir(filePath, (err) => {
            if (err) reject({error: `Can't create folder!`, code: httpStatus.COULD_NOT_CREATE_FILE});
            resolve(true);
        })
    });
}

/**
 *
 * @param req
 * @param srcPath
 * @param filePath
 * @param rootPath
 */
function copy(req, srcPath, filePath, rootPath) {
    return new Promise((resolve, reject) => {
        const source = srcPath.split('/');
        const dest = filePath.split('/');
        if (!fs.existsSync(srcPath)) return reject({
            error: 'Folder does not exist!',
            code: httpStatus.PATH_DOES_NOT_EXIST
        });
        if (fs.existsSync(filePath)) return reject({
            error: 'Folder already exists!',
            code: httpStatus.FILE_ALREDY_EXIST
        });
        if (fs.existsSync(`${rootPath}/tmp`)) utils.deleteFolderRecursive(`${rootPath}/tmp`);
        fsExtra.copy(srcPath, `${rootPath}/tmp/${_.last(dest)}`, (err) => {
            if (err) return reject({error: 'Folder copy error!', code: httpStatus.BAD_REQUEST});
            fsExtra.move(`${rootPath}/tmp/${_.last(dest)}`, filePath, (moveErr) => {
                if (moveErr) return reject({error: 'Folder copy error!', code: httpStatus.BAD_REQUEST});
                utils.deleteFolderRecursive(`${rootPath}/tmp`);
                resolve(true);
            })
        });
    });
}
/**
 *
 * @param req
 * @param folderPath
 * @returns {*}
 */

/**
 *
 * @param req
 * @param filePath
 */
function remove(req, filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) return reject({
            error: 'Path does not exist!',
            code: httpStatus.PATH_DOES_NOT_EXIST
        });
        utils.deleteFolderRecursive(filePath);
        return resolve(true);
    });
}
/**
 *
 * @param req
 * @param folderPath
 * @returns {*}
 */
function upload(req, folderPath) {
    return _processUpload(req, folderPath);
}

/**
 *
 * @param req
 * @param folderPath
 * @private
 */
function _processUpload(req, folderPath) {
    return new Promise((resolve, reject) => {
        //if env is local put absolute path
        if(!config.stuff_path) folderPath = `${__dirname}/../../${folderPath}`;

        for (var prop in req.filenames) {
            fsExtra.move(`resources/uploads/tmp/${prop}`, `${folderPath}/${prop}`)
                .then(() => {
                    const zipFile = folderPath + prop;
                    extract(zipFile, {dir: folderPath}, (err) => {
                        if (err) return reject(err);

                        if (!fs.existsSync(zipFile)) return reject({error: 'Upload error-', code: httpStatus.BAD_REQUEST});

                        fs.unlink(zipFile, (err) => {
                            if (err) return reject(err);
                            fs.readdirSync(folderPath).forEach((file, index) => {
                                var curPath = folderPath + '/' + file;
                                fs.chmodSync(curPath, 0o755);
                            });
                            resolve(true);
                        });

                    });
                })
                .catch((error) => reject({error: 'Folder Move operation error', code: httpStatus.BAD_REQUEST}))
        }
    });
}


module.exports = {create, copy, upload, remove};
