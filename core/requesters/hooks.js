/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');

const HooksRequester = new cote.Requester({
    name: 'hooks requester',
    namespace: 'hooks'
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
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params'));
    return _requesterHandler(params)
        .then((response, code)=> _onSuccess(res, response[0], response[1]))
        .catch(err=> _onError(res, err));
}


function build(req, res, next){
    const params = { type:'build'};
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
    build:build,
};