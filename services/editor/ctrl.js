/**
 * Created by xgharibyan on 6/27/17.
 */

const fs = require('fs');
const _ = require('lodash');
const config = require('../../config/env');
const utils = require('../../common/utils');
const User = require('../../models/user');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');
const notifications = require('../../common/notifications');
const httpStatus = require('../../common/httpStatus');
const File = require('./file');
const Folder = require('./directory');

function _fileOnSuccess(req) {
    return new Promise((resolve, reject) => {
        Project.updateAsync({
                _id: req.query.id || req.params.id,
                name: req.project.name,
            },
            {
                $set: {updatedAt: new Date()},
            })
            .then(response => resolve(response))
            .catch(err => reject(err));
    })
}

function getFile(req) {

    return new Promise((resolve, reject) => {

        if (_.isUndefined(req.query.filename)) {
            return reject(Response.onError(null, `Provide file name!`, 400));
        }

        const filePath = utils.generateFilePath(req, req.query.filename);
        File.read(req, filePath)
            .then(data => resolve(data))
            .catch(err => reject(Response.onError(err, err.error, err.code)))
    });
}

function putFile(req) {

    return new Promise((resolve, reject) => {

        const allowActions = ['save', 'rename'];

        if (_.isUndefined(req.body.filename)) {
            return reject(Response.onError(null, `Provide file name!`, 400))
        }

        if (_.isUndefined(req.query.action)) {
            return reject(Response.onError(null, `Provide action!`, 400));
        }

        if (_.indexOf(allowActions, req.query.action) < 0) {
            return reject(Response.onError(null, `Provide action name!`, 400));
        }

        const action = req.query.action;
        const filePath = utils.generateFilePath(req, req.body.filename);

        if (action === 'rename') {
            if (_.isUndefined(req.body.newName)) {
                return reject(Response.onError(null, `Provide renaming file!`, 400));
            }
            return File.rename(req, filePath)
                .then(renamed => _fileOnSuccess(req))
                .then(saved => resolve(true))
                .catch(err => reject(Response.onError(err, err.error, err.code)))
        }

        if (action === 'save') {
            if (_.isUndefined(req.body.content)) {
                return reject(Response.onError(null, `Provide content of file!`, 400));
            }

            return File.override(req, filePath)
                .then(overrided => _fileOnSuccess(req))
                .then(saved => resolve(true))
                .catch(err => reject(Response.onError(err, err.error, err.code)))
        }
    })


}

function postFile(req) {
    return new Promise((resolve, reject) => {
        const allowActions = ['create', 'copy'];
        const allowTypes = ['file', 'directory'];

        if (_.indexOf(allowActions, req.body.action) < 0) {
            return reject(Response.onError(null, `Provide action name!`, 400));
        }

        if (_.isUndefined(req.body.name)) {
            return reject(Response.onError(null, `Provide name!`, 400));
        }

        if (_.isUndefined(req.body.path)) {
            return reject(Response.onError(null, `Provide destination path!`, 400));
        }

        if (_.isUndefined(req.body.action)) {
            return reject(Response.onError(null, `Provide action!`, 400));
        }

        const action = req.body.action;
        const mainPath = utils.generateFilePath(req, req.body.path);
        const rootPath = `${config.stuff_path}projects/${req.user.username}/${req.project.root}`;
        const type = req.body.type;
        const filePath = `${mainPath}/${utils.cleanFileName(req.body.name)}`;


        if (action === 'create') {

            if (_.indexOf(allowTypes, type) < 0) {
                return reject(Response.onError(null, `Provide type name!`, 400));
            }

            if (type === 'file') {
                return File.create(req, filePath)
                    .then(created => _fileOnSuccess(req))
                    .then(saved => resolve('The file was created!'))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))
            }

            if (type === 'directory') {
                return Folder.create(req, filePath)
                    .then(created => _fileOnSuccess(req))
                    .then(saved => resolve('The folder was created!'))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))
            }
        }

        else if (action === 'copy') {

            if (_.isUndefined(req.body.srcPath)) {
                return reject(Response.onError(null, `Provide source path!`, 400));
            }

            let srcPath = utils.generateFilePath(req, req.body.srcPath);

            if (type === 'file') {
                return File.copy(req, srcPath, filePath)
                    .then(copied => _fileOnSuccess(req))
                    .then(saved => resolve(`The file was copeid!`))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))

            }
            if (type === 'directory') {

                if (!req.body.srcPath) {
                    return reject(Response.onError(null, `Cant copy project in self!`, 400));
                }

                return Folder.copy(req, srcPath, filePath, rootPath)
                    .then(copied => _fileOnSuccess(req))
                    .then(saved => resolve('The folder was copeid!'))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))
            }

        }

    })
}

function deleteFile(req){
    return new Promise((resolve, reject)=>{

        if (_.isUndefined(req.query.filename)) {
            return reject(Response.onError(null, `Provide file name!`, 400));
        }

        const filePath = utils.generateFilePath(req, req.query.filename);
        if (!fs.existsSync(filePath)) {
            return reject(Response.onError(null, `Path or file does not exist!`, 400));
        }

        if (!_.last(filePath.split(/[\\\/]+/g))) {
            return reject(Response.onError(null, `Cannot delete project folder!`, 400));
        }


        if (!fs.lstatSync(filePath).isDirectory()) { //check if file
            return File.remove(req, filePath)
                .then(uploaded => _fileOnSuccess(req))
                .then(saved => resolve(filePath))
                .catch(err => reject(Response.onError(err, err.error, err.code)))
        }


        return Folder.remove(req, filePath)
            .then(uploaded => _fileOnSuccess(req))
            .then(saved => resolve(filePath))
            .catch(err => reject(Response.onError(err, err.error, err.code)))
    })
}


module.exports = {
    getFile: getFile,
    putFile: putFile,
    postFile: postFile,
    deleteFile:deleteFile
};
