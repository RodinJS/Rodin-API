/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');

const ProjectRequester = new cote.Requester({
    name: 'build requester',
    namespace: 'build'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        ProjectRequester.send(params, (err, response)=>{
            console.error('service err',err);
            //console.log('service response', response);
            if(err) return reject(err);
            return resolve(response);
        })
    })
}

function _submit(req, res, params){
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params', 'files'));
    return _requesterHandler(params)
        .then(response=> _onSuccess(res, response))
        .catch(err=> _onError(res, err));
}


function buildVive(req, res, next){
    const params = {type:'buildVive'};
    return _submit(req, res, params);
}

function removeVive(req, res, next){
    const params = {type:'removeVive'};
    return _submit(req, res, params);
}

function buildAndroid(req, res, next){
    const params = {type:'buildAndroid'};
    return _submit(req, res, params);
}

function removeAndroid(req, res, next){
    const params = {type:'removeAndroid'};
    return _submit(req, res, params);
}

function buildIos(req, res, next){
    const params = {type:'buildIos'};
    return _submit(req, res, params);
}

function removeIos(req, res, next){
    const params = {type:'removeIos'};
    return _submit(req, res, params);
}

function buildOculus(req, res, next){
    const params = {type:'buildOculus'};
    return _submit(req, res, params);
}

function removeOculus(req, res, next){
    const params = {type:'removeOculus'};
    return _submit(req, res, params);
}

function _onSuccess(res, data){
    return res.status(200).json({success:true, data:data});
}

function _onError(res, err){
    console.error('Core response', err);
    return res.status(err.code || 400).json({success:false, data:err.message || `Bad request`});
}

module.exports = {
    buildVive:buildVive,
    removeVive:removeVive,
    buildAndroid:buildAndroid,
    removeAndroid:removeAndroid,
    buildIos:buildIos,
    removeIos:removeIos,
    buildOculus:buildOculus,
    removeOculus:removeOculus
};