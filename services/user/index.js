/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const Ctrl = require('./ctrl');
const config = require('../../config/env');
const userCapacity = require('../../common/directorySize');
const ProjectsHelper = require('../../common/Projects');
const Check = require('../../common/check');

// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, {server: {socketOptions: {keepAlive: 1}}});
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});


const userResponder = new cote.Responder({
    name: 'user responder',
    namespace: 'user',
    respondsTo: ['list']
});

//authResponder.on('*', console.log);


userResponder.on('me', (req, cb) => {
    const data = {};
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(data, {user: user});
            return userCapacity.getUserStorageSize(data.user);
        })
        .then(storageSize => {
            Object.assign(data, {usedStorage: storageSize});
            return ProjectsHelper.count(data.user);
        })
        .then(count => {
            Object.assign(data, {projectsCount: count});
            return cb(null, Ctrl.returnUserData(data))
        })
        .catch(err => {
            console.log('err', err);
            cb(err, null)
        })
});

userResponder.on('create', (req, cb) => {
    console.log('responder create', req);
    Ctrl.create(req)
        .then(user => cb(null, user))
        .catch(err => cb(err, null))
});

userResponder.on('checkResetPasswordUsed', (req, cb) => {
    Ctrl.checkResetPasswordUsed(req)
        .then(response => cb(null, response))
        .catch(err => cb(err, null))
});

userResponder.on('resetPassword', (req, cb) => {
    Ctrl.resetPassword(req)
        .then(response => cb(null, response))
        .catch(err => cb(err, null))
});

userResponder.on('changePassword', (req, cb)=>{
    const data = {};
    Ctrl.changePassword(req)
        .then(user=>{
            req.user = user;
            return Ctrl.updatePassword(req);
        })
        .then(user=>{
            Object.assign(data, {user: user});
            return ProjectsHelper.count(data.user);
        })
        .then(count => {
            Object.assign(data, {projectsCount: count});
            return cb(null, Ctrl.returnUserData(data, true))
        })
        .catch(err => cb(err, null));

});

userResponder.on('updatePassword', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            req.user = user;
            return Ctrl.updatePassword(req);
        })
        .then(user=> cb(null, user))
        .catch(err=> {
            console.log('updatePassword', err);
            cb(err, null)
        })
});

userResponder.on('metaverse', (req, cb)=>{
    Ctrl.metaverse(req)
        .then(success => cb(null, success))
        .catch(err => cb(err, null))
});

userResponder.on('unSyncSocial', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            req.user = user;
            return Ctrl.unSyncSocial(req);
        })
        .then(unset => Ctrl.unsetUserData(unset))
        .then(response=> cb(null, response))
        .catch(err=>{
            console.log(err);
            cb(err, null)
        })
});

userResponder.on('updateUser', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            req.user = user;
            return Check.ifSelfUpdate(req);
        })
        .then(valid=> Ctrl.update(req))
        .then(updated=> cb(null, updated))
        .catch(err=>{
            console.log(err);
            cb(err, null)
        })
});

userResponder.on('deleteUser', (req, cb)=>{
    Check.ifTokenValid(req)
        .then(user=>{
            req.user = user;
            return Ctrl.remove(req);
        })
        .then(removed=> cb(null, removed))
        .catch(err=>{
            console.log(err);
            cb(err, null)
        })
});

userResponder.on('confirmUsername', (req, cb)=>{
    const data = {};
    Check.ifTokenValid(req)
        .then(user=>{
            req.user = user;
            return Ctrl.confirmUsername(req);
        })
        .then(user=> {
            Object.assign(data, {user: user.toObject()});
            return cb(null, Ctrl.returnUserData(data, true))
        })
        .catch(err=>{
            console.log(err);
            cb(err, null)
        })
});
