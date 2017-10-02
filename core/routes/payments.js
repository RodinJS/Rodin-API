/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const paymentsRequester = require('../requesters/payments');
const paramValidation = require('../configs/paramValidation');
const validate = require('express-validation');


const router = express.Router();

router.route('/stripe/customer')
    .get(paymentsRequester.getCustomer)
    .post(validate(paramValidation.createCustomer), paymentsRequester.createCustomer)
    .put(paymentsRequester.updateCustomer)
    .delete(paymentsRequester.deleteCustomer);

router
    .route('/stripe/subscription')
    .get(paymentsRequester.getSubscription)
    .post(paymentsRequester.createSubscription)
    .put(paymentsRequester.updateSubscription)
    .delete(paymentsRequester.deleteSubscription);

router
    .route('/stripe/subscriptions')
    .get(paymentsRequester.getSubscriptions);


router
    .route('/stripe/subscription/upgrade')
    .put(validate(paramValidation.upgradeSubscription), paymentsRequester.upgradeSubscription);

router
    .route('/stripe/charges')
    .get(paymentsRequester.getCharges);

router
    .route('/stripe/plans')
    .get(paymentsRequester.getPlans)
    .post(paymentsRequester.createPlan);

router
    .route('/stripe/token')
    .get(paymentsRequester.getTokens)
    .post(paymentsRequester.createToken);

router
    .route('/stripe/invoices')
    .get(paymentsRequester.getInvoices);

router
    .route('/stripe/invoices/upcoming')
    .get(paymentsRequester.upcomingInvoices);

module.exports = router;