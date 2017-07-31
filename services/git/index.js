/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const Ctrl = require('./ctrl');
const config = require('../../config/env');
const Check = require('../../common/check');

// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, {server: {socketOptions: {keepAlive: 1}}});
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});


const gitResponder = new cote.Responder({
    name: 'git responder',
    namespace: 'git',
    respondsTo: ['list']
});


gitResponder.on('initSync', (req, cb) => {
    Ctrl.getToken(req)
        .then(token => {
            Object.assign(req, {gitAccessToken: token});
            return Ctrl.getUser(req);
        })
        .then(response => {
            Object.assign(req, response);
            return cb(null, req, 999)
        })
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })

});

gitResponder.on('sync', (req, cb) => {
    Ctrl.getToken(req)
        .then(token => {
            Object.assign(req, {gitAccessToken: token});
            return Ctrl.getUser(req);
        })
        .then(response => {
            Object.assign(req, response);
            return Ctrl.successSync(req);
        })
        .then(response => cb(null, response, 301))
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
});

gitResponder.on('create', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.create(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
});

gitResponder.on('theirs', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.theirs(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
});

gitResponder.on('ours', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.ours(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
});

gitResponder.on('syncProjects', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.syncProjects(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
})

gitResponder.on('syncSingleProjects', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.syncSingleProjects(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
})

//buildResponder.on('*', console.log);
