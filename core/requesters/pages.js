/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');


const PagestRequester = new cote.Requester({
    name: 'pages requester',
    namespace: 'pages'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        PagestRequester.send(params, (err, response, code)=>{
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

function pagesList(req, res, next){
    const params = { type:'pagesList'};
    return _submit(req, res, params);
}

function getByUrl(req, res, next){
    const params = { type:'getByUrl'};
    return _submit(req, res, params);
}

function getFaq(req, res, next){
    const params = { type:'getFaq'};
    return _submit(req, res, params);
}

function getKnowledgeCategories(req, res, next){
    const params = { type:'getKnowledgeCategories'};
    return _submit(req, res, params);
}

function getKnowlegeCategoryArticles(req, res, next){
    const params = { type:'getKnowlegeCategoryArticles'};
    return _submit(req, res, params);
}

function getKnowlegeArticle(req, res, next){
    const params = { type:'getKnowlegeArticle'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    //console.log('data', data);
    //console.log('!!--- CODE --- !!', code);
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    console.error('Core response', err);
    return responses.sendError(res, 'pagesService', err);
}

module.exports = {
    pagesList,
    getByUrl,
    getFaq,
    getKnowledgeCategories,
    getKnowlegeCategoryArticles,
    getKnowlegeArticle
};