/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const paymentsRequester = require('../requesters/payments');

const router = express.Router();

router.route('/stripe/customer')
    .get(paymentsRequester.getCustomer)
    .post(paymentsRequester.createCustomer)
    .put(paymentsRequester.updateCustomer)
    .delete(paymentsRequester.deleteCustomer);

router.route('/stripe/subscription')
    .get(paymentsRequester.getSubscription)
    .post(paymentsRequester.createSubscription)
    .put(paymentsRequester.updateSubscription)
    .delete(paymentsRequester.deleteSubscription);

router
    .route('/stripe/charges')
    .get(paymentsRequester.getCharges);
router
    .route('/stripe/plans')
    .get(paymentsRequester.getPlans)
    .post(paymentsRequester.createPlan);


module.exports = router;