/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');

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
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params', 'files'));
    return _requesterHandler(params)
        .then((response, code)=> _onSuccess(res, response[0], response[1]))
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

function _onSuccess(res, data, code){
    //console.log('data', data);
    //console.log('!!--- CODE --- !!', code);
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    console.error('Core response', err);
    return res.status(err.code || 400).json({success:false, data:err.message || `Bad request`});
}

module.exports = {
    getFile:getFile,
    putFile:putFile,
    postFile:postFile,
    deleteFile:deleteFile
};