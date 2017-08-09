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


const PagesResponder = new cote.Responder({
    name: 'pages responder',
    namespace: 'pages',
    respondsTo: ['list']
});


//authResponder.on('*', console.log);


PagesResponder.on('pagesList', (req, cb) => {
    Ctrl.pagesList(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

PagesResponder.on('getByUrl', (req, cb) => {
    Ctrl.getByUrl(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

PagesResponder.on('getFaq', (req, cb) => {
    Ctrl.getFaq(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

PagesResponder.on('getKnowledgeCategories', (req, cb) => {
    Ctrl.getKnowledgeCategories(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

PagesResponder.on('getKnowlegeCategoryArticles', (req, cb) => {
    Ctrl.getKnowlegeCategoryArticles(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

PagesResponder.on('getKnowlegeArticle', (req, cb) => {
    Ctrl.getKnowlegeArticle(req)
        .then(response=> cb(null, response))
        .catch(err=> {
            console.log('getQuestionsList  err', err);
            return cb(err, null);
        })
});

