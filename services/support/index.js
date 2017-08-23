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


const SupportResponder = new cote.Responder({
    name: 'support responder',
    namespace: 'support',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


SupportResponder.on('getQuestionsList', (req, cb) => {

    Check.getUserByToken(req)
        .then(user=>{
            if(user) Object.assign(req, {user:user});
            return  Ctrl.getUserVotedConversations(req)
        })
        .then(votedConversations=>{
            Object.assign(req, {votedConversations:votedConversations});
            return Ctrl.getQuestionsList(req)
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

SupportResponder.on('createQuestion', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.validateCustomer(req);
        })
        .then(customer=>{
            Object.assign(req, {hsUser:customer});
            return Ctrl.createQuestion(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('createQuestion  err', err);
            return cb(err, null);
        })
});

SupportResponder.on('createQuestionThread', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.validateCustomer(req);
        })
        .then(customer=>{
            Object.assign(req, {hsUser:customer});
            return Ctrl.createQuestionThread(req);
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('createQuestionThread  err', err);
            return cb(err, null);
        })
});

SupportResponder.on('getConversation', (req, cb) => {
    Check.getUserByToken(req)
        .then(user=>{
            if(user) Object.assign(req, {user:user});
            return  Ctrl.getUserVotedConversations(req)
        })
        .then(votedConversations=>{
            Object.assign(req, {votedConversations:votedConversations});
            return Ctrl.getConversation(req)
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getConversation  err', err);
            return cb(err, null);
        })
});

SupportResponder.on('updateConversation', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user=>{
            Object.assign(req, {user:user});
            return Ctrl.updateConversation(req)
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('updateConversation  err', err);
            return cb(err, null);
        })
});

SupportResponder.on('getTags', (req, cb) => {
    Ctrl.getTags(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getConversation  err', err);
            return cb(err, null);
        })
});

SupportResponder.on('searchConversations', (req, cb) => {
    Check.getUserByToken(req)
        .then(user=>{
            if(user) Object.assign(req, {user:user});
            return  Ctrl.getUserVotedConversations(req)
        })
        .then(votedConversations=>{
            Object.assign(req, {votedConversations:votedConversations});
            return Ctrl.searchConversations(req)
        })
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getConversation  err', err);
            return cb(err, null);
        })
});

