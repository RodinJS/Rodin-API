/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');

const SupportRequester = new cote.Requester({
    name: 'support requester',
    namespace: 'support'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        SupportRequester.send(params, (err, response, code)=>{
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

function getQuestionsList(req, res, next){
    const params = { type:'getQuestionsList'};
    return _submit(req, res, params);
}

function createQuestion(req, res, next){
    const params = { type:'createQuestion'};
    return _submit(req, res, params);
}

function createQuestionThread(req, res, next){
    const params = { type:'createQuestionThread'};
    return _submit(req, res, params);
}


function updateQuestionThread(req, res, next){
    const params = { type:'updateQuestionThread'};
    return _submit(req, res, params);
}

function getConversation(req, res, next){
    const params = { type:'getConversation'};
    return _submit(req, res, params);
}

function updateConversation(req, res, next){
    const params = { type:'updateConversation'};
    return _submit(req, res, params);
}

function getTags(req, res, next){
    const params = { type:'getTags'};
    return _submit(req, res, params);
}

function searchConversations(req, res, next){
    const params = { type:'searchConversations'};
    return _submit(req, res, params);
}

function deleteConversation(req, res, next){
    const params = { type:'deleteConversation'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    //console.log('data', data);
    //console.log('!!--- CODE --- !!', code);
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    console.error('Core response', err);
    return responses.sendError(res, 'supportService', err);
}

module.exports = {
    getQuestionsList,
    createQuestion,
    createQuestionThread,
    getConversation,
    updateConversation,
    getTags,
    searchConversations,
    updateQuestionThread,
    deleteConversation
};