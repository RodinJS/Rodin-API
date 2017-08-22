/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');


const socketServerRequester = new cote.Requester({
    name: 'socketServer requester',
    namespace: 'socketServer'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        socketServerRequester.send(params, (err, response, code)=>{
            console.log(err, response, code);
            if(err) return reject(err);
            return resolve([response, code]);
        })
    })
}

function _submit(req, res, params){
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params', 'notification'));
    return _requesterHandler(params)
        .then((response, code)=> _onSuccess(res, response[0], response[1]))
        .catch(err=> _onError(res, err));
}

function hook(req, res, next){
    const params = { type:'hook'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    if(res) return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    return responses.sendError(res, 'socketService', err);

}

module.exports = {
    hook:hook,
};