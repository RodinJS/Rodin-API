/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');

const ModulesRequester = new cote.Requester({
    name: 'modules requester',
    namespace: 'modules'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        ModulesRequester.send(params, (err, response, code)=>{
            if(err) return reject(err);
            const arr = [];
            arr.push(response);
            arr.push(code);
            return resolve(arr);
        })
    })
}

function _submit(req, res, params){
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params', 'files'));
    return _requesterHandler(params)
        .then((response)=> _onSuccess(res, response[0], response[1]))
        .catch(err=> _onError(res, err));
}

function list(req, res, next){
    const params = { type:'list'};
    return _submit(req, res, params);
}

function create(req, res, next){
    const params = { type:'create'};
    return _submit(req, res, params);
}

function submit(req, res, next){
    const params = { type:'submit'};
    return _submit(req, res, params);
}

function approveReject(req, res, next){
    const params = { type:'approveReject'};
    return _submit(req, res, params);
}

function check(req, res, next){
    const params = { type:'check'};
    return _submit(req, res, params);
}

function getMyModules(req, res, next){
    const params = { type:'getMyModules'};
    return _submit(req, res, params);
}

function update(req, res, next){
    const params = { type:'update'};
    return _submit(req, res, params);
}

function subscribe(req, res, next){
    const params = { type:'subscribe'};
    return _submit(req, res, params);
}

function unsubscribe(req, res, next){
    const params = { type:'unsubscribe'};
    return _submit(req, res, params);
}

function assignToProject(req, res, next){
    const params = { type:'assignToProject'};
    return _submit(req, res, params);
}

function socketServerFile(req, res, next){
    const params = { type:'socketServerFile'};
    return _submit(req, res, params);
}

function socketServerSubscribe(req, res, next){
    const params = { type:'socketServerSubscribe'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    //console.log('data', data);
    //console.log('!!--- CODE --- !!', code);
    if(code == 202){
        res.setHeader('content-type', 'text/javascript');
        return res.send(data)
    }
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    console.error('Core response', err);
    return res.status(err.code || 400).json({success:false, data:err.message || `Bad request`});
}

module.exports = {
    list,
    create,
    submit,
    approveReject,
    check,
    getMyModules,
    update,
    subscribe,
    unsubscribe,
    assignToProject,
    socketServerFile,
    socketServerSubscribe
};