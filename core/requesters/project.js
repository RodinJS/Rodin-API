/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');

const ProjectRequester = new cote.Requester({
    name: 'projects requester',
    namespace: 'projects'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        ProjectRequester.send(params, (err, response, code)=>{
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


function create(req, res, next){
    const params = { type:'create'};
    return _submit(req, res, params);
}

function list(req, res, next){
    const params = { type:'list'};
    return _submit(req, res, params);
}

function count(req, res, next){
    const params = { type:'count'};
    return _submit(req, res, params);
}

function get(req, res, next){
    const params = { type:'get'};
    return _submit(req, res, params);
}

function update(req, res, next){
    const params = { type:'update'};
    return _submit(req, res, params);
}

function remove(req, res, next){
    const params = { type:'remove'};
    return _submit(req, res, params);
}

function publishRollBack(req, res, next){
    const params = { type:'publishRollBack'};
    return _submit(req, res, params);
}

function getPublishedHistory(req, res, next){
    const params = {type:'getPublishedHistory'};
    return _submit(req, res, params);
}

function publishProject(req, res, next){
    const params = {type:'publishProject'};
    return _submit(req, res, params);
}

function rePublishProject(req, res, next){
    const params = {type:'rePublishProject'};
    return _submit(req, res, params);
}

function unPublishProject(req, res, next){
    const params = {type:'unPublishProject'};
    return _submit(req, res, params);
}

function getPublishedProjects(req, res, next){
    const params = {type:'getPublishedProjects'};
    return _submit(req, res, params);
}

function getPublishedProject(req, res, next){
    const params = {type:'getPublishedProject'};
    return _submit(req, res, params);
}

function importOnce(req, res, next){
    const params = {type:'importOnce'};
    return _submit(req, res, params);
}

function getTemplatesList(req, res, next){
    const params = {type:'getTemplatesList'};
    return _submit(req, res, params);
}

function transpile(req, res, next){
    const params = {type:'transpile'};
    return _submit(req, res, params);
}

function makePublic(req, res, next){
    const params = {type:'makePublic'};
    return _submit(req, res, params);
}

function generateDeveloperKey(req, res, next){
    const params = {type:'generateDeveloperKey'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    //console.log('data', data);
    //console.log('!!--- CODE --- !!', code);
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    return responses.sendError(res, 'projectsService', err);

}

module.exports = {
    create:create,
    list:list,
    count:count,
    get:get,
    update:update,
    remove:remove,
    publishRollBack:publishRollBack,
    getPublishedHistory:getPublishedHistory,
    publishProject:publishProject,
    rePublishProject:rePublishProject,
    unPublishProject:unPublishProject,
    getPublishedProjects:getPublishedProjects,
    getPublishedProject:getPublishedProject,
    importOnce:importOnce,
    getTemplatesList:getTemplatesList,
    transpile:transpile,
    makePublic:makePublic,
    generateDeveloperKey:generateDeveloperKey
};