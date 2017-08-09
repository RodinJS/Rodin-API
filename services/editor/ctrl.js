/**
 * Created by xgharibyan on 6/27/17.
 */

const fs = require('fs');
const fsExtra = require('fs-extra');
const dirToJson = require('dir-to-json');
const _ = require('lodash');
const Minizip = require('node-minizip');
const config = require('../../config/env');
const utils = require('../../common/utils');
const User = require('../../models/user');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');
const notifications = require('../../common/notifications');
const httpStatus = require('../../common/httpStatus');
const fileContentSearch = require('../../common/fileSearch');
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
                    .then(saved => resolve(`The file was copied!`))
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

function deleteFile(req) {
    return new Promise((resolve, reject) => {

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

function searchInsideFiles(req) {
    return new Promise((resolve, reject) => {

        if (!req.query.search) {
            return reject(Response.onError(null, `Empty query`, 400));
        }

        let mainPath = utils.generateFilePath(req, req.query.path || '');
        let searchWord = req.query.search;
        let caseSensetive = req.query.caseSensitive;

        let fileSearch = new fileContentSearch(mainPath, searchWord, caseSensetive, false, false, req.project.root);

        fileSearch.search((error, data) => {
            if (error) {
                return reject(Response.onError(error, `Search failed`, 400));

            }
            return resolve(data);
        });
    })
}

function uploadFiles(req) {

    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.files) || req.files.length < 0) {
            return reject(Response.onError(null, `Please select at least one file`, 400));
        }

        if (_.isUndefined(req.body.path)) {
            return reject(Response.onError(null, `Please provide destination path!`, 400));
        }

        const type = req.body.type;
        const action = req.body.action;
        const folderPath = utils.generateFilePath(req, req.body.path);

        if (!fs.existsSync(folderPath)) {
            fsExtra.ensureDirSync(folderPath);
        }

        fs.readdir(folderPath, (err, files) => {

            if (err) {
                return reject(Response.onError(err, `Folder does not  exist!`, httpStatus.PATH_DOES_NOT_EXIST));
            }

            if (type === 'directory') {

                const folder = `${folderPath}${req.body.folderName}`;

                if (action === 'replace') {
                    return Folder.upload(req, folderPath)
                        .then(uploaded => _fileOnSuccess(req))
                        .then(updated => resolve(`Files successfully uploaded!`))
                        .catch(err => reject(Response.onError(err, err.error, err.code)))
                }

                if (fs.existsSync(folder)) {
                    return resolve({
                        folder: [req.body.folderName],
                        message: `Following ${req.body.folderName} folder exists, please provide action (replace)`,
                    })
                }

                return Folder.upload(req, folderPath)
                    .then(uploaded => _fileOnSuccess(req))
                    .then(updated => resolve(`Files successfully uploaded!`))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))

            }

            if (action === 'replace') {
                return File.upload(req, folderPath)
                    .then(uploaded => _fileOnSuccess(req))
                    .then(updated => resolve(`Files successfully uploaded!`))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))
            }

            if (action === 'rename') {
                req.files = _.map(req.files, (file) => {
                    file.originalname = file.originalname.replace(/(\.[\w\d_-]+)$/i, '_1$1');
                    return file;
                });

                return File.upload(req, folderPath)
                    .then(uploaded => _fileOnSuccess(req))
                    .then(updated => resolve(`Files successfully uploaded!`))
                    .catch(err => reject(Response.onError(err, err.error, err.code)))
            }

            const uploadingFiles = _.map(req.files, function (file) {
                return file.originalname;
            });

            let existedFiles = _.intersection(files, uploadingFiles);
            if (existedFiles.length > 0) {
                return resolve({
                    files: existedFiles,
                    message: 'Following files exists, please provide action (replace, rename)',
                })
            }
            return File.upload(req, folderPath)
                .then(uploaded => _fileOnSuccess(req))
                .then(updated => resolve(`Files successfuly uploaded!`))
                .catch(err => reject(Response.onError(err, err.error, err.code)))
        });
    })
}

function isUnitTest(req) {

    return new Promise((resolve, reject) => {
        // THIS WORKS ONLY FOR UNIT TEST
        if (req.body.testUpload) {

            if (req.body.type === 'directory') {
                //UNIT TEST FOLDER UPLOAD
                let path = utils.generateFilePath(req, req.body.path);
                let templatePath = 'resources/templates/blank';
                Minizip.zip(templatePath, path + '/test.zip', (err) => {
                    if (err) {
                        return reject(Response.onError(err, 'Test failed', 400));
                    }
                    let file = fs.readFileSync(path + '/test.zip');
                    return resolve([{originalname: 'test.zip', buffer: new Buffer(file)}]);
                });
            }
            //UNIT TEST FOLDER UPLOAD
            else {
                return resolve(req.body.files)
            }
        } else resolve(true);
        // THIS WORKS ONLY FOR UNIT TEST
    })

}

function _dirTree(filename, isSetFolderPath, rootPath) {

    let stats = fs.lstatSync(filename);

    let info = {
        parent: path.relative(rootPath, path.dirname(filename)),
        path: path.relative('./' + rootPath, './' + filename),
        name: path.basename(filename),
        type: 'file',
    };

    if (stats.isDirectory()) {
        info.type = 'directory';
        if (rootPath == filename || isSetFolderPath) {
            info.children = fs.readdirSync(filename).map((child) => _dirTree(filename + '/' + child, false, rootPath));
        }
    }
    return info;
}

function getTreeJSON(req) {
    return new Promise((resolve, reject) => {
        Project.get(req.params.id)
            .then((project) => {
                if (!project) {
                    return reject(Response.onError(null, 'Project not found', 404));
                }

                //TODO normalize root folder path
                let response = {
                    success: true,
                    data: {
                        name: project.name,
                        description: project.description,
                        root: project.root,
                        tree: '',
                    },
                };

                const rootPath = `${config.stuff_path}projects/${req.user.username}/${project.root}`;

                if (req.query.getAll) {

                    return dirToJson(rootPath)
                        .then((dirTree) => {
                            response.data.tree = dirTree;
                            return resolve(response)
                        })
                        .catch((e) => reject(Response.onError(e, `Problem with generating tree`, 404)));

                }
                if (_.isArray(req.query.folderPath)) {

                    response.data.tree = [];
                    _.each(req.query.folderPath, (folderPath, key) => {
                        response.data.tree.push(_dirTree(`${rootPath}/${folderPath}`, true, rootPath));
                    });

                }
                else {
                    const folderPath = req.query.folderPath ? `/${req.query.folderPath}` : '';
                    let isSetFolderPath = !!folderPath;
                    response.data.tree = _dirTree((isSetFolderPath ? `${rootPath}${folderPath}` : rootPath), isSetFolderPath, rootPath);
                }
                return resolve(response);
            })
            .catch(err => reject(Response.onError(err, `Project not found`, 404)))
    })
}

module.exports = {
    getFile: getFile,
    putFile: putFile,
    postFile: postFile,
    deleteFile: deleteFile,
    searchInsideFiles: searchInsideFiles,
    uploadFiles: uploadFiles,
    isUnitTest: isUnitTest,
    getTreeJSON: getTreeJSON
};
