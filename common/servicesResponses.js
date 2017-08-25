/**
 * Created by xgharibyan on 6/27/17.
 */

const _ = require('lodash');

function onSuccess(data){
    return {
        success:true,
        data:data
    }
}

function onError(err, info, code){
    return {
        success:false,
        err:err,
        message:info || 'Bad request',
        code:code || 400
    }
}

function sendError(res, service, data){
    const err = data ? {
        status:data.code,
        message:data.message,
    } : {
        status:400,
        message:'Bad request'
    };
    console.log(`Service error ${service}`, data);
    if(res) res.status(err.status || 400).json({success:false, error:err});
}

module.exports = {
    onSuccess:onSuccess,
    onError:onError,
    sendError:sendError
};
