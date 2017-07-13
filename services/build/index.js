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


//buildResponder.on('*', console.log);
