/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose =  require('mongoose');
const Ctrl = require('./ctrl');
const config = require('../../config/env');
const Check = require('../../common/check');
const userCapacity = require('../../common/directorySize');
const ProjectsHelper = require('../../common/Projects');


// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});


const projectsResponder = new cote.Responder({
    name: 'projects responder',
    namespace: 'projects',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


projectsResponder.on('create', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return ProjectsHelper.count(req.user);
        })
        .then(projectsCount =>{
            Object.assign(req, {projectsCount:projectsCount});
            return Ctrl.create(req);
        })
        .then(created=> cb(null, created, 201))
        .catch(err=> {
            console.log('project create err', err);
            return cb(err, null);
        })
});

projectsResponder.on('list', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.list(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project list err', err);
            return cb(err, null);
        })
});

projectsResponder.on('count', (req, cb)=>{
   Check.validateToken(req)
       .then(tokenValid=>{
           Object.assign(req, {tokenValid:tokenValid});
           return Ctrl.allProjectsCount(req);
       })
       .then(response=> cb(null, response))
       .catch(err=> {
           console.log('project count err', err);
           return cb(err, null);
       })
});

projectsResponder.on('get', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.get(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project count err', err);
            return cb(err, null);
        })
});

projectsResponder.on('update', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.update(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project count err', err);
            return cb(err, null);
        })
});

projectsResponder.on('remove', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.get(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.remove(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project REMOVE ERR', err);
            return cb(err, null);
        })
});

projectsResponder.on('publishRollBack', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.rollBack(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('getPublishedHistory', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.getPublishedHistory(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('publishProject', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.publishProject(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('makePublic', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.get(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.makePublic(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('rePublishProject', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.rePublishProject(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('unPublishProject', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.unPublishProject(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('getPublishedProjects', (req, cb)=>{
    Ctrl.getPublishedProjects(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('getPublishedProject', (req, cb)=>{
    Ctrl.getPublishedProject(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('importOnce', (req, cb)=>{
    Ctrl.importOnce(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('getTemplatesList', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.getTemplatesList(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('transpile', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.transpile(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});

projectsResponder.on('generateDeveloperKey', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.generateDeveloperKey(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('project rollback err', err);
            return cb(err, null);
        })
});