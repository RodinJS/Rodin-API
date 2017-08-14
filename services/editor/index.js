/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose =  require('mongoose');
const _ = require('lodash');
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


const editoresponder = new cote.Responder({
    name: 'editor responder',
    namespace: 'editor',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


editoresponder.on('getFile', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.getFile(req)
        })
        .then(response => cb(null, response))
        .catch(err=> cb(err, null))
});

editoresponder.on('putFile', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Check.validateStorage(req)
        })
        .then(valid=> Ctrl.putFile(req))
        .then(response => cb(null, response))
        .catch(err=> cb(err, null))
});

editoresponder.on('postFile', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Check.validateStorage(req)
        })
        .then(valid=> Ctrl.postFile(req))
        .then(response => cb(null, response))
        .catch(err=> cb(err, null))
});

editoresponder.on('deleteFile', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.deleteFile(req)
        })
        .then(response => cb(null, response))
        .catch(err=> cb(err, null))
});

editoresponder.on('searchInsideFiles', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.searchInsideFiles(req)
        })
        .then(response => cb(null, response))
        .catch(err=> cb(err, null))
});

editoresponder.on('getTreeJSON', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.getTreeJSON(req);
        })
        .then(response => cb(null, response))
        .catch(err=> cb(err, null))
});

editoresponder.on('uploadFiles', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.project(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Check.validateStorage(req)
        })
        .then(validated => Ctrl.isUnitTest(req))
        .then(testResult=>{
            if(!_.isBoolean(testResult)){
                Object.assign(req, {files:testResult})
            }
            return Ctrl.uploadFiles(req);
        })
        .then(response => cb(null, response))
        .catch(err=> {
            console.log('err', err);
            cb(err, null)
        })
});
