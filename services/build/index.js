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


const buildResponder = new cote.Responder({
    name: 'build responder',
    namespace: 'build',
    respondsTo: ['list']
});


buildResponder.on('buildVive', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.buildVive(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build vive err', err);
            return cb(err, null);
        })
});

buildResponder.on('removeVive', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.removeVive(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build vive err', err);
            return cb(err, null);
        })
});

buildResponder.on('buildAndroid', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.buildAndroid(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build vive err', err);
            return cb(err, null);
        })
});

buildResponder.on('removeAndroid', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.removeAndroid(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build vive err', err);
            return cb(err, null);
        })
});

buildResponder.on('buildIos', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.buildIos(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build vive err', err);
            return cb(err, null);
        })
});

buildResponder.on('removeIos', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.removeIos(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build vive err', err);
            return cb(err, null);
        })
});

buildResponder.on('buildOculus', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.buildOculus(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build oculus err', err);
            return cb(err, null);
        })
});

buildResponder.on('removeOculus', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Check.isProjectOwn(req);
        })
        .then(project=>{
            Object.assign(req, {project:project});
            return Ctrl.removeOculus(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('build oculus err', err);
            return cb(err, null);
        })
});

//buildResponder.on('*', console.log);
