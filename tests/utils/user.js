/**
 * Created by xgharibyan on 10/21/16.
 */

const request = require('supertest-as-promised');
const Promise = require('bluebird');
const app = require('../../core/index');
const UserModel = require('../../models/user');
const ProjectModel = require('../../models/project');
const ProjectTemplate = require('../../models/projectTemplate');
const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');
const config = require('../../config/env/test');
const stripeKeys = config.payments.tokens.stripe;
const stripe = require('stripe')(stripeKeys.secret);

// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config.db}`);
});

const common = {};

const god = {
    email: 'odin@asgard.io',
    username: 'odin',
    password: 'Lokiis603',
    role: 'God',
};

function login(done) {

    let user = {
        username: 'gagas',
        password: '1234567890AAa',
    };

    request(app)
        .post('/api/auth/login')
        .send(user)
        .then(res => {
            common.token = res.body.data.token;
            common.username = user.username;
            common.passowrd = user.password;
            done();
        });

}

function loginAsGod(done) {
    request(app)
        .post('/api/auth/login')
        .send(_.pick(god, 'username', 'password'))
        .then(res => {
            common.token = res.body.data.token;
            common.username = god.username;
            common.passowrd = god.password;
            done();
        });
}

function getTestProjects(done) {
    request(app)
        .get('/api/project')
        .set(generateHeaders())
        .then(res => {
            common.project = res.body.data.projects[0];
            done();
        });
}

function generateHeaders() {
    return {
        'x-access-token': getToken(),
    };
}

function generateHookHeader() {
    return {
        'x-access-token': 'K7rd6FzEZwzcc6dQr3cv9kz4tTTZzAc9hdXYJpukvEnxmbdB42V4b6HePs5ZDTYLW_4000dram',
    };
}

function setProject(project) {
    common.project = project;
}


function getToken() {
    return common.token;
}

function getProject() {
    return common.project;
}

function getUserName() {
    return common.username;
}

function createGod() {
    const GOD = new UserModel(god);
    GOD.save()
        .then(response => {
        })
        .catch(err => {
        });
}

function createStripeToken(done){
    stripe.tokens.create({
        card: {
            "number": '4242424242424242',
            "exp_month": 12,
            "exp_year": 2022,
            "cvc": '123'
        }
    }, (err, token) => {
        if(err) return console.error('stripe error', err);
        Object.assign(common, {stripeToken:token.id});
        done();
    });
}

function getStripeToken(){
    return common.stripeToken;
}

function dropCollections(callback) {
    const collections = _.keys(mongoose.connection.collections); //['users', 'projects', 'modules', 'invitiationcodes'];
    async.forEach(collections, function (collectionName, done) {
        let collection = mongoose.connection.collections[collectionName];
        collection.drop((err) => {
            if (err && err.message != 'ns not found') done(err);
            done(null);
        });
    }, callback);
}

module.exports = {
    login,
    getToken,
    getTestProjects,
    getProject,
    generateHeaders,
    generateHookHeader,
    getUserName,
    createGod,
    loginAsGod,
    dropCollections,
    setProject,
    createStripeToken,
    getStripeToken
};
