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


const paymentsResponder = new cote.Responder({
    name: 'Payments responder',
    namespace: 'payments',
    respondsTo: ['list']
});


paymentsResponder.on('createCustomer', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.createCustomer(req);
        })
        .then(customerCreated => {
            Object.assign(req, customerCreated);
            return Ctrl.updateUser(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe Customer create err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('getCustomer', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getCustomer(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('getCustomerError', err);
            cb(err, null)
        })
});

paymentsResponder.on('updateCustomer', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.updateCustomer(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe Customer update err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('deleteCustomer', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.deleteCustomer(req);
        })
        .then(confirmed => {
            delete req.user.stripe;
            Object.assign(req, {deleteCustomer:true});
            return Ctrl.updateUser(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe Customer update err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('createSubscription', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.createSubscription(req);
        })
        .then(subscriptionCreated => {
            Object.assign(req, subscriptionCreated);
            return Ctrl.updateUser(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe Customer create err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('updateSubscription', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.updateSubscription(req);
        })
        .then(subscriptionUpdated => {
            Object.assign(req, subscriptionUpdated);
            return Ctrl.updateUser(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe subscription update err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('deleteSubscription', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.deleteSubscription(req);
        })
        .then(subscriptionUpdated => {
            Object.assign(req, subscriptionUpdated);
            return Ctrl.updateUser(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe subscription update err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('upgradeSubscription', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.upgradeSubscription(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('upgradeSubscribtionError', err);
            cb(err, null)
        })
});

paymentsResponder.on('getSubscription', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getSubscription(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe get subscription err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('getSubscriptions', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getSubscriptions(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe get subscriptions err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('getPlans', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getPlans(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('stripe Customer update err', err);
            return cb(err, null);
        })
});

paymentsResponder.on('createPlan', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.createPlan(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('create plan', err);
            return cb(err, null);
        })
});

paymentsResponder.on('getCharges', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getCharges(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('getCustomerError', err);
            cb(err, null)
        })
});


paymentsResponder.on('createToken', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.createToken(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('createTokenError', err);
            cb(err, null)
        })
});

paymentsResponder.on('getTokens', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getTokens(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('getTokensError', err);
            cb(err, null)
        })
});

paymentsResponder.on('getInvoices', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.getInvoices(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('getInvoicesError', err);
            cb(err, null)
        })
});

paymentsResponder.on('upcomingInvoices', (req, cb) => {
    Check.ifTokenValid(req)
        .then(user => {
            Object.assign(req, {user: user});
            return Ctrl.upcomingInvoices(req);
        })
        .then(response => cb(null, response))
        .catch(err => {
            console.log('upcomingInvoices', err);
            cb(err, null)
        })
});

//authResponder.on('*', console.log);

