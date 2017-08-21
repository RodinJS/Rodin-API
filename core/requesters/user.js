/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _ = require('lodash');
const responses = require('../../common/servicesResponses');

const UserRequester = new cote.Requester({
    name: 'user requester',
    namespace: 'user'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        UserRequester.send(params, (err, response)=>{
            if(err) return reject(err);
            return resolve(response);
        })
    })
}

function _submit(req, res, params){
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params'));
    return _requesterHandler(params)
        .then(response=> _onSuccess(res, response))
        .catch(err=> _onError(res, err));
}

function me(req, res, next){
    const params = { type:'me'};
    return _submit(req, res, params);
}

function create(req, res, next){
    const params = {type:'create'};
    return _submit(req, res, params);
}

function checkResetPasswordUsed(req, res, next){
    const params = {type:'checkResetPasswordUsed'};
    return _submit(req, res, params);

}

function resetPassword(req, res, next){
    const params = {type:'resetPassword'};
    return _submit(req, res, params);
}
function changePassword(req, res, next){
    const params = {type:'changePassword'};
    return _submit(req, res, params);
}

function updatePassword(req, res, next){
    const params = {type:'updatePassword'};
    return _submit(req, res, params);
}

function metaverse(req, res, next){
    const params = {type:'metaverse'};
    return _submit(req, res, params);
}

function unSyncSocial(req, res, next){
    const params = {type:'unSyncSocial'};
    return _submit(req, res, params);
}

function updateUser(req, res, next){
    const params = {type:'updateUser'};
    return _submit(req, res, params);
}

function deleteUser(req, res, next){
    const params = {type:'deleteUser'};
    return _submit(req, res, params);
}

function confirmUsername(req, res, next){
    const params = {type:'confirmUsername'};
    return _submit(req, res, params);
}

function _onSuccess(res, data){
    return res.status(200).json({success:true, data:data});
}

function _onError(res, err){
    return responses.sendError(res, 'usersService', err);

}


module.exports = {
    me:me,
    create:create,
    checkResetPasswordUsed:checkResetPasswordUsed,
    resetPassword:resetPassword,
    changePassword:changePassword,
    updatePassword:updatePassword,
    metaverse:metaverse,
    unSyncSocial:unSyncSocial,
    updateUser:updateUser,
    deleteUser:deleteUser,
    confirmUsername:confirmUsername
};