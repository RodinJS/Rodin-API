/**
 * Created by xgharibyan on 4/9/17.
 */

const fs = require('fs');
const fsExtra = require('fs-extra');
const Promise = require('bluebird');
const httpStatus = require('../../common/httpStatus') ;
const utils = require('../../common/utils');
const _  = require('lodash');

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
function read(req, filePath) {
  return new Promise((resolve, reject) => {
    _readFile(filePath, (err, file) => {
      if (err) return reject({error: 'File does not exist!', code: httpStatus.FILE_DOES_NOT_EXIST});

      const fileState = fs.statSync(filePath);
      const fileSize = fileState ? utils.byteToMb(fileState['size']) : 0;
      resolve({fileSize: fileSize, content: file})
    })
  });
}

/**
 *
 * @param req
 * @param filePath
 */
function create(req, filePath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath) && isDirectory(filePath)) {
      return reject({error: `There is already a folder with the same name as the file name you specified.Specify a different name.`, code: httpStatus.FILE_DOES_NOT_EXIST});
    } else if (fs.existsSync(filePath)) return reject({
      error: 'File already exists!',
      code: httpStatus.FILE_DOES_NOT_EXIST
    });
    fsExtra.ensureFile(filePath, (err) => {
      if (err) return reject({error: `Can't create file!`, code: httpStatus.COULD_NOT_CREATE_FILE});
      fs.appendFileSync(filePath, '//Created by ' + req.user.username);
      resolve(true);
    })
  });
}

/**
 *
 * @param req
 * @param srcPath
 * @param filePath
 */
function copy(req, srcPath, filePath) {
  return new Promise((resolve, reject) => {
    _readFile(srcPath, (err, content) => {
      if (err)  return reject({error: 'File does not exist!', code: httpStatus.FILE_DOES_NOT_EXIST});
      _readFile(filePath, (err, content) => {
        if (err && err.code === 'ENOENT') {
          return fsExtra.copy(srcPath, filePath, (err) => {
            if (err) return reject({error: 'Could not write to file!', code: httpStatus.COULD_NOT_WRITE_TO_FILE});
            return resolve(true);
          });
        }

        return reject({
          error: `Cannot create  ${req.body.name} file already exist`,
          code: httpStatus.COULD_NOT_WRITE_TO_FILE
        });

      });

    });
  });
}

/**
 *
 * @param req
 * @param filePath
 */
function rename(req, filePath) {
  return new Promise((resolve, reject) => {
    let newName = utils.cleanFileName(req.body.newName);
    let newPath = filePath.split(/[\\\/]+/g);
    if (!_.last(newPath)) return reject({error: 'Cannot rename project folder!', code: httpStatus.BAD_REQUEST});
    if (!fs.existsSync(filePath)) return reject({
      error: 'Path or file does not exist!',
      code: httpStatus.FILE_OR_PATH_DOES_NOT_EXIST
    });
    newPath.splice(newPath.length - 1, 1, newName);
    newPath = newPath.join('/');
    fs.rename(filePath, newPath, (err) => {
      if (err) return reject({error: 'Path or file does not exist!', code: httpStatus.FILE_OR_PATH_DOES_NOT_EXIST});
      fs.stat(newPath, (err, stats) => {
        if (err) return reject({error: 'Error while renaming file/path!', code: httpStatus.NOT_A_FILE});
        resolve(true)
      })
    });
  });
}

/**
 *
 * @param req
 * @param filePath
 */
function override(req, filePath) {
  return new Promise((resolve, reject) => {
    const content = req.body.content;
    fs.writeFile(filePath, content, (err) => {
      if (err) return reject({error: 'Could not write to file!', code: httpStatus.COULD_NOT_WRITE_TO_FILE});
      resolve(true);
    });
  })
}

/**
 *
 * @param req
 * @param filePath
 */
function remove(req, filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) return reject({error: 'File does not exist!', code: httpStatus.FILE_DOES_NOT_EXIST});
    fs.unlink(filePath, (err) => {
      if (err) return reject({error: 'Could not delete object!', code: httpStatus.COULD_NOT_DELETE_OBJECT});
      resolve(true);
    });
  });
}

/**
 *
 * @param req
 * @param filePath
 * @returns {*}
 */
function upload(req, filePath) {
  return _processUpload(req, filePath)
}

/**
 *
 * @param req
 * @param folderPath
 * @private
 */
function _processUpload(req, folderPath) {
  return new Promise((resolve, reject) => {
    for (var prop in req.filenames) {
        fsExtra.move(`resources/uploads/tmp/${prop}`, `${folderPath}/${req.filenames[prop]}`)
          .then(() => resolve(true))
          .catch((error) => reject({error: 'File Move operation error', code: httpStatus.BAD_REQUEST}))
    }
  })
}

/**
 *
 * @param path
 * @private
 */
function _readFile(path, callback) {
  try {
    fs.readFile(path, 'utf8', callback);
  }
  catch (e) {
    callback(e);
  }
}

module.exports = {create, copy, rename, override, upload, remove, read};
