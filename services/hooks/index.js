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


const hooksResponder = new cote.Responder({
    name: 'hooks responder',
    namespace: 'hooks',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


hooksResponder.on('build', (req, cb) => {
    Ctrl.validateKey(req)
        .then(valid=> Ctrl.build(req))
        .then(notification=> cb(null, notification))
        .catch(err=> {
            console.log('build  hook  err', err);
            return cb(err, null);
        })
});

hooksResponder.on('get', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.get(req);
        })
        .then(notification=> cb(null, notification))
        .catch(err=> {
            console.log('build  hook  err', err);
            return cb(err, null);
        })
});

hooksResponder.on('update', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.update(req);
        })
        .then(notification=> cb(null, notification))
        .catch(err=> {
            console.log('build  hook  err', err);
            return cb(err, null);
        })
});

hooksResponder.on('remove', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=> {
            Object.assign(req, {user:user});
            return Ctrl.remove(req);
        })
        .then(notification=> cb(null, notification))
        .catch(err=> {
            console.log('build  hook  err', err);
            return cb(err, null);
        })
});

