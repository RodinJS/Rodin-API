/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _ = require('lodash');
const responses = require('../../common/servicesResponses');

const AuthRequester = new cote.Requester({
    name: 'authorization requester',
    namespace: 'auth'
});


function requesterHandler(params){
    return new Promise((resolve, reject) =>{
        AuthRequester.send(params, (err, response)=>{
            console.error('service err',err);
            //console.log('service response', response);
            if(err) return reject(err);
            return resolve(response);
        })
    })
}



function login(req, res, next){

    requesterHandler({type:'login', body:req.body, headers:req.headers})
        .then(response=>_onSuccess(res, response))
        .catch(err=> _onError(res, err));
}


function socialAuth(req, res, next){
    requesterHandler({type:'socialAuth', body:req.body, headers:req.headers, params:req.params})
        .then(response=>_onSuccess(res, response))
        .catch(err=> _onError(res, err));
}

function _onSuccess(res, data){
    res.status(200).json({success:true, data:data});
}

function _onError(res, data){
    return responses.sendError(res, 'authService', data);
}

module.exports = {
    login:login,
    socialAuth:socialAuth
};