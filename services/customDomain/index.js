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

const customDomainResponder = new cote.Responder({
    name: 'Custom Domain responder',
    namespace: 'customDomain',
    respondsTo: ['list']
});


customDomainResponder.on('add', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Check.isProjectOwn(req);
        })
        .then(project => {
            Object.assign(req, {project: project});
            return Ctrl.add(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('Custom Domain add err', err);
            return cb(err, null);
        })
});

customDomainResponder.on('remove', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Check.isProjectOwn(req);
        })
        .then(project => {
            Object.assign(req, {project: project});
            return Ctrl.remove(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('Custom Domain remove err', err);
            return cb(err, null);
        })
});