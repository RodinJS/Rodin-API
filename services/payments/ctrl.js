/**
 * Created by xgharibyan on 6/27/17.
 */
const _ = require('lodash');
const config = require('../../config/env');
const User = require('../../models/user');
const utils = require('../../common/utils');
const Response = require('../../common/servicesResponses');
const stripeKeys = config.payments.tokens.stripe;
const stripe = require('stripe')(stripeKeys.secret);


function getCustomer(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe && !req.user.stripe.customerId) return resolve(null);

        stripe.customers.retrieve(req.user.stripe.customerId, (err, customer) => {
            if (err) reject(Response.onError(err, `Customer getting error!`, 400));
            return resolve(customer);
        });
    })
}

function createCustomer(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.stripeToken)) {
            return reject(Response.onError(null, `Provide stripe token!`, 400));
        }

        const requestData = {
            email: req.user.email,
            source: req.body.stripeToken,
            metadata: {
                username: req.user.username,
            },
        };
        stripe.customers.create(requestData, (err, customer) => {
            if (err) return reject(Response.onError(err, `Customer creation error!`, 400));
            const payment = {stripe: {}};
            Object.assign(payment.stripe, {customerId: customer.id});
            return resolve({message: `Subscription created successfully`, payment: payment});
        });
    })
}

function updateCustomer(req) {

    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.query.default_source)) {
            return reject(Response.onError(null, `Provide default card`, 400));
        }

        if (!req.user.stripe && !req.user.stripe.customerId) return reject(Response.onError(null, `No Customer!`, 400));

        stripe.customers.update(req.user.stripe.customerId, {default_source: req.query.default_source}, (err, customer) => {
            if (err) return reject(Response.onError(err, `Customer update error!`, 400));

            return resolve(customer);
        });
    })
}

function deleteCustomer(req){
    return new Promise((resolve, reject)=>{
        if (!req.user.stripe && !req.user.stripe.customerId) return reject(Response.onError(null, `No Customer!`, 400));
        stripe.customers.del(req.user.stripe.customerId, (err, confirmation) => {
            if (err) return reject(Response.onError(err, `Customer delete error!`, 400));
            return resolve(confirmation);
        });
    });
}

function getSubscription(req) {
    return new Promise((resolve, reject) => {
        stripe.subscriptions.retrieve(req.user.stripe.subscriptionId, (err, subscription) => {
            if (err) return reject(Response.onError(err, `Get subscription error!`, 400));
            return resolve(subscription);
        });
    })
}

function createSubscription(req) {
    return new Promise((resolve, reject) => {
        if (req.user.stripe && req.user.stripe.subscriptionId) {
            return reject(Response.onError(null, `Already subscribed!`, 400));
        }

        if (_.isUndefined(req.body.planId)) {
            return reject(Response.onError(null, `Provide planId!`, 400));
        }

        const requestData = {
            customer: req.user.stripe.customerId,
            plan: req.body.planId,
            //source: req.body.stripeToken
        };

        stripe.subscriptions.create(requestData, (err, subscription) => {
            if (err) return reject(Response.onError(err, `Subscription create error!`, 400));

            const payment = {stripe: req.user.stripe, planId: subscription.plan.id};
            Object.assign(payment.stripe, {subscriptionId: subscription.id});
            return resolve({message: `Subscription created successfully`, payment: payment});
        });
    })

}

function updateSubscription(req){
    return new Promise((resolve, reject)=>{
        if (_.isUndefined(req.user.stripe.subscriptionId)) {
            return reject(Response.onError(null, `Not subscribed!`, 400));
        }
        if (_.isUndefined(req.body.planId)) {
            return reject(Response.onError(null, `Provide planId!`, 400));
        }
        const requestData = {
            plan: req.body.planId,
        };
        stripe.subscriptions.update(req.user.stripe.subscriptionId, requestData, (err, subscription) => {
            if (err) return reject(Response.onError(err, `Subscription update error!`, 400));

            const payment = {stripe: req.user.stripe, planId: subscription.plan.id};
            Object.assign(payment.stripe, {subscriptionId: subscription.id});
            return resolve({message: `Subscription updated successfully`, payment: payment});
        });
    })
}

function deleteSubscription(req){
    return new Promise((resolve, reject)=>{
        if (_.isUndefined(req.user.stripe.subscriptionId)) {
            return reject(Response.onError(null, `Not subscribed!`, 400));
        }
        stripe.subscriptions.del(req.user.stripe.subscriptionId, (err, confirmation)=> {
            if (err) return reject(Response.onError(err, `Subscription deletion error!`, 400));


            const payment = { stripe: _.omit(req.user.stripe, 'subscriptionId'), planId: 'Free' };
            console.log('payment', payment);
            return resolve({message: `Subscription deleted successfully`, payment: payment});

        });
    })
}

function updateUser(req) {
    return new Promise((resolve, reject) => {
        const updatingData = req.payment;
        const query = {};
        if (updatingData) {
            if(req.payment.planId){
                updatingData.role = req.payment.planId;
                delete updatingData.planId;
            }
            Object.assign(query, {$set: updatingData})
        }
        if(req.deleteCustomer){
            Object.assign(query, {$unset:{stripe:1}})
        }
        User.findOneAndUpdate({username: req.user.username}, query, {new: true})
            .then(user => resolve(user))
            .catch(e => reject(Response.onError(err, `Customer creation error!`, 400)))
    })
}

module.exports = {
    getCustomer,
    createCustomer,
    updateCustomer,
    updateUser,
    getSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    deleteCustomer
};
