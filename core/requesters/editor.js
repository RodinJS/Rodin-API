/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');
const shortid = require('shortid');
const fs = require('fs');
const utils = require('../../common/utils');
const Promise = require('bluebird');

const HooksRequester = new cote.Requester({
    name: 'editor requester',
    namespace: 'editor'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        HooksRequester.send(params, (err, response, code)=>{
            if(err) return reject(err);
            return resolve([response, code]);
        })
    })
}

function _submit(req, res, params){
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params', 'files' ));
    return _requesterHandler(params)
        .then((response, code) => _onSuccess(res, response[0], response[1]))
        .catch(err=> _onError(res, err));
}


function getFile(req, res, next){
    const params = { type:'getFile'};
    return _submit(req, res, params);
}

function putFile(req, res, next){
    const params = { type:'putFile'};
    return _submit(req, res, params);
}

function postFile(req, res, next){
    const params = { type:'postFile'};
    return _submit(req, res, params);
}

function deleteFile(req, res, next){
    const params = { type:'deleteFile'};
    return _submit(req, res, params);
}

function searchInsideFiles(req, res, next){
    const params = { type:'searchInsideFiles'};
    return _submit(req, res, params);
}

function uploadFiles(req, res, next){
    if (_.isUndefined(req.files) || req.files.length < 0) {
        return _onError(res, `Please select at least one file`);
    }
    _processUpload(req)
        .then(filenames => {
            const params = { type:'uploadFiles', filenames: filenames };
            delete req.files;
            return _submit(req, res, params);
        })
        .catch((error) => _onError(res, error));
}

function getTreeJSON(req, res, next){
    const params = { type:'getTreeJSON'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    // console.log('data', data);
    // console.log('!!--- CODE --- !!', code);
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
        // console.log('err', err);
    return responses.sendError(res, 'editorService', err);

}


function _processUpload(req) {
  return new Promise((resolve, reject) => {
    const PromisifiedFS = Promise.promisifyAll(fs);
    let filenames = {};

    const promises = req.files.map((file) => {
        console.log("---- orig name", req.files[0].originalname);
        file.tmpname = shortid.generate();
      const filePath = `resources/uploads/tmp/${file.tmpname}`; //
      const writeFile = PromisifiedFS.writeFileAsync(filePath, Buffer.from(file.buffer));
      if (fs.existsSync(filePath)) {
        filenames[file.tmpname] = file.originalname;
        return PromisifiedFS.chmodAsync(filePath, 0o755);
      }
      else {
        filenames[file.tmpname] = file.originalname;
        return writeFile;
      }
    });

    Promise.all(promises)
    .then(() => resolve(filenames))
    .catch((error) => reject(error));
  })
}



module.exports = {
    getFile:getFile,
    putFile:putFile,
    postFile:postFile,
    deleteFile:deleteFile,
    searchInsideFiles:searchInsideFiles,
    uploadFiles:uploadFiles,
    getTreeJSON:getTreeJSON
};