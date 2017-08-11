/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose =  require('mongoose');
const Ctrl = require('./ctrl');
const config = require('../../config/env');
const Check = require('../../common/check');

// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});


const ModulesResponder = new cote.Responder({
    name: 'modules responder',
    namespace: 'modules',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


ModulesResponder.on('list', (req, cb) => {
    Ctrl.list(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('create', (req, cb) => {
    Check.isGod(req)
        .then(valid=> Ctrl.create(req))
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('submit', (req, cb) => {
    Ctrl.getModule(req)
        .then(module=>{
            Object.assign(req, {module:module});
            return Ctrl.validateSyntax(req);
        })
        .then(fileContent=> {
            Object.assign(req, {fileContent:fileContent});
            return Ctrl.submit(req)
        })
        .then(submitted => Ctrl.save(req))
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('approveReject', (req, cb)=>{
    Ctrl.getModule(req)
        .then(module=> {
            Object.assign(req, {module: module});
            return Ctrl.approveReject(req);
        })
        .then(response=> {
            Object.assign(req.body, response);
            return Ctrl.sendMail(req);
        })
        .then(saved => Ctrl.save(req))
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('check', (req, cb)=>{
    Ctrl.auth(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('getMyModules', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.getMyModules(req)
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('update', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.checkIsSubscribed(req)
        })
        .then(valid => Ctrl.getById(req.body.moduleId))
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('assignToProject', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.checkIsSubscribed(req)
        })
        .then(valid => Ctrl.getById(null, req))
        .then(module =>{
            Object.assign(req, {module:module});
            return Ctrl.assignToProject(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('subscribe', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.getById(null, req)
        })
        .then(module => {
            Object.assign(req, {module:module});
            return Ctrl.subscribe(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});

ModulesResponder.on('unsubscribe', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.getById(null, req)
        })
        .then(module => {
            Object.assign(req, {module:module});
            return Ctrl.unsubscribe(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('Modules get  err', err);
            return cb(err, null);
        })
});
