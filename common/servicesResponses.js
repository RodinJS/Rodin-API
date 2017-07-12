/**
 * Created by xgharibyan on 6/27/17.
 */


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

module.exports = {
    onSuccess:onSuccess,
    onError:onError
}
