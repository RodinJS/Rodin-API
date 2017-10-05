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
        if (!req.user.stripe || !req.user.stripe.customerId) return resolve({});

        stripe.customers.retrieve(req.user.stripe.customerId, (err, customer) => {
            if (err) reject(Response.onError(null, err.message, 400));
            return resolve(customer);
        });
    })
}

function createCustomer(req) {
    return new Promise((resolve, reject) => {
        let exp_month = req.body.expireDate.split('/')[0];
        let exp_year = Number('20' + req.body.expireDate.split('/')[1]);
        stripe.tokens.create({
            card: {
                "number": req.body.cardNumber,
                "exp_month": exp_month,
                "exp_year": exp_year,
                "cvc": req.body.securityCode,
                "address_city": req.body.city,
                "address_line1": req.body.address || '',
                "address_country": req.body.country,
                "address_zip": req.body.postalCode,
                "name": `${req.body.firstName} ${req.body.lastName}`
            }
        }, (err, token) => {
            if (err) return reject(Response.onError(null, err.message, 400));
            const requestData = {
                email: req.user.email,
                source: token.id,
                metadata: {
                    username: req.user.username,
                },
            };
            stripe.customers.create(requestData, (err, customer) => {
                if (err) return reject(Response.onError(null, err.message, 400));
                const payment = {stripe: {}};
                Object.assign(payment.stripe, {customerId: customer.id});
                return resolve({message: `Customer created successfully`, payment: payment});
            });
        });
    })
}

function updateCustomer(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe && !req.user.stripe.customerId) return reject(Response.onError(null, `No Customer!`, 400));
        createToken(req.body.card)
            .then((token) => createSource(req.user.stripe.customerId, token.id))
            .then((source) => updateCustomerDefault(req.user.stripe.customerId, source.id))
            .then((response) => resolve(response))
            .catch((err) => reject(Response.onError(null, err.message, 400)))
    })
}

function deleteCustomer(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe && !req.user.stripe.customerId) return reject(Response.onError(null, `No Customer!`, 400));
        stripe.customers.del(req.user.stripe.customerId, (err, confirmation) => {
            if (err) return reject(Response.onError(null, err.message, 400));
            return resolve(confirmation);
        });
    });
}

function getSubscription(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe || !req.user.stripe.subscriptionId) return resolve({});

        stripe.subscriptions.retrieve(req.user.stripe.subscriptionId, (err, subscription) => {
            if (err) return reject(Response.onError(null, err.message, 400));
            return resolve(subscription);
        });

    })
}

function getSubscriptions(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe) return resolve({});

        stripe.subscriptions.list({customer: req.user.stripe.customerId,status:'all'}, (err, subscriptions) => {
            if (err) return reject(Response.onError(null, err.message, 400));
            return resolve(subscriptions);
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
            // source: req.body.stripeToken
        };

        stripe.subscriptions.create(requestData, (err, subscription) => {
            if (err) return reject(Response.onError(null, err.message, 400));

            const payment = {stripe: req.user.stripe, planId: subscription.plan.id};
            Object.assign(payment.stripe, {subscriptionId: subscription.id});
            return resolve({message: `Subscription created successfully`, payment: payment});
        });
    })

}

function updateSubscription(req) {
    return new Promise((resolve, reject) => {
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
            if (err) reject(Response.onError(null, err.message, 400));

            const payment = {stripe: req.user.stripe, planId: subscription.plan.id};
            Object.assign(payment.stripe, {subscriptionId: subscription.id});
            return resolve({message: `Subscription updated successfully`, payment: payment});
        });
    })
}

function deleteSubscription(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.user.stripe.subscriptionId)) {
            return reject(Response.onError(null, `Not subscribed!`, 400));
        }
        stripe.subscriptions.del(req.user.stripe.subscriptionId, (err, confirmation) => {
            if (err) return reject(Response.onError(null, err.message, 400));


            const payment = {stripe: _.omit(req.user.stripe, 'subscriptionId'), planId: 'Free'};
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
            if (req.payment.planId) {
                updatingData.role = req.payment.planId;
                delete updatingData.planId;
            }
            Object.assign(query, {$set: updatingData})
        }
        if (req.deleteCustomer) {
            Object.assign(query, {$unset: {stripe: 1}})
        }
        User.findOneAndUpdate({username: req.user.username}, query, {new: true})
            .then(user => resolve(user))
            .catch(e => reject(Response.onError(err, `Customer creation error!`, 400)))
    })
}

function getPlans(req) {
    return new Promise((resolve, reject) => {
        stripe.plans.list(
            function (err, plans) {
                if (err) return reject(Response.onError(null, err.message, 400))
                return resolve(plans)
            }
        );
    })
}

function createPlan(req) {
    return new Promise((resolve, reject) => {
        stripe.plans.create({
            amount: req.body.amount,
            interval: req.body.interval,
            name: req.body.name,
            currency: req.body.currency,
            id: req.body.id
        }, function (err, plan) {
            if (err) {
                return reject(Response.onError(null, err.message, 400))
            }
            return resolve({plan: plan})
        });
    })
}

function getCharges(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe) {
            return resolve(null);
        }
        stripe.charges.list(
            {customer: req.user.stripe.customerId},
            function (err, charges) {
                if (err) {
                    return reject(Response.onError(null, err.message, 400))
                }
                return resolve(charges)
            }
        );
    })
}

function getTokens(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe) {
            return resolve(null);
        }
        stripe.customers.listCards(req.user.stripe.customerId, function (err, cards) {
            if (err) {
                return reject(Response.onError(null, err.message, 400))
            }
            return resolve(cards)
        });
    })

}

function getInvoices(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.stripe) {
            return resolve(null);
        }
        stripe.invoices.list({customer: req.user.stripe.customerId}, function (err, cards) {
            if (err) {
                return reject(Response.onError(null, err.message, 400))
            }
            return resolve(cards)
        });
    })
}

function createToken(card) {
    let exp_month, exp_year;
    if (card.expireDate) {
        exp_month = card.expireDate.split('/')[0] || null;
        exp_year = Number('20' + card.expireDate.split('/')[1]) || null;
    }
    return stripe.tokens.create(
        {
            card: {
                "number": card.cardNumber,
                "exp_month": exp_month,
                "exp_year": exp_year,
                "cvc": card.securityCode,
                "address_city": card.city,
                "address_line1": card.address || '',
                "address_country": card.country,
                "address_zip": card.postalCode,
                "name": `${card.firstName} ${card.lastName}`

            }
        })
}

function createSource(customerId, source) {
    return stripe.customers.createSource(customerId, {
        source: source
    })
}

function updateCustomerDefault(customerId, source) {
    return stripe.customers.update(customerId, {default_source: source})
}

function updateSubscriptionPlan(subscriptionId, planId) {
    const requestData = {
        plan: planId,
        prorate: true,
    };
    return stripe.subscriptions.update(subscriptionId, requestData)
}

function payInvoice(upcoming) {
    return stripe.invoices.pay(upcoming.id)
}

function retrieveUpcomingInvoice(customerId, subscribtionId) {
    return stripe.invoices.retrieveUpcoming(customerId, {subscription: subscribtionId})
}

function checkLastSubscriptions(req) {
    return new Promise((resolve, reject) => {
        stripe.subscriptions.list({customer: req.user.stripe.customerId, status:'all'}, (err, subscriptions) => {
            if (err) return reject(Response.onError(null, err.message, 400));
            if(subscriptions.data[0] && subscriptions.data[0].status === 'canceled') return resolve({status: 'canceled'});
            return resolve({status:'active'});
        });
    })
}
function createSubscripitionPlan(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.planId)) {
            return reject(Response.onError(null, `Provide planId!`, 400));
        }
        stripe.subscriptions.create({customer: req.user.stripe.customerId, plan: req.body.planId}, (err, subscription) => {
            if (err) return reject(Response.onError(null, err.message, 400));

            const payment = {stripe: req.user.stripe, planId: subscription.plan.id};
            Object.assign(payment.stripe, {subscriptionId: subscription.id});
            let query = {};
            Object.assign(query, {$set: payment});
            User.findOneAndUpdate({username: req.user.username}, query, {new: true})
                .then(user => resolve(user))
                .catch(e => reject(e))
        });
    })

}
function upgradeSubscription(req) {

    return new Promise((resolve, reject) => {
        createToken(req.body.card)
            .then((token) => createSource(req.user.stripe.customerId, token.id))
            .then((source) => updateCustomerDefault(req.user.stripe.customerId, source.id))
            .then((customer) => checkLastSubscriptions(req))
            .then((response) => {
                if(response.status === 'active') {
                    return updateSubscriptionPlan(req.user.stripe.subscriptionId, req.body.planId)
                } else if(response.status === 'canceled') {
                    return createSubscripitionPlan(req)
                }
            })
            // .then((subscription) => retrieveUpcomingInvoice(req.user.stripe.customerId, subscription.id))
            // .then((upcoming) => payInvoice(upcoming))
            .then((final) => resolve(final))
            .catch((err) => reject(Response.onError(null, err.message, 400)))
    })
}

function upcomingInvoices(req) {

    return new Promise((resolve, reject) => {
        if (!req.user.stripe) {
            return resolve(null);
        }
        stripe.invoices.retrieveUpcoming(req.user.stripe.customerId, function (err, invoice) {
            if (err) {
                return reject(Response.onError(null, err.message, 400))
            }
            return resolve(invoice)
        })
    })
}

module.exports = {
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getSubscriptions,
    createPlan,
    getPlans,
    getCharges,
    updateUser,
    getTokens,
    createToken,
    getInvoices,
    upcomingInvoices,
    upgradeSubscription
};
