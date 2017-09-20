/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');

const PaymentsRequester = new cote.Requester({
    name: 'payments requester',
    namespace: 'payments'
});


function _requesterHandler(params){
    return new Promise((resolve, reject) =>{
        PaymentsRequester.send(params, (err, response, code)=>{
            if(err) return reject(err);
            return resolve([response, code]);
        })
    })
}

function _submit(req, res, params){
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params'));
    return _requesterHandler(params)
        .then((response, code)=> _onSuccess(res, response[0], response[1]))
        .catch(err=> _onError(res, err));
}


function createCustomer(req, res, next){
    const params = { type:'createCustomer'};
    return _submit(req, res, params);
}

function getCustomer(req, res, next){
    const params = { type:'getCustomer'};
    return _submit(req, res, params);
}

function updateCustomer(req, res, next){
    const params = { type:'updateCustomer'};
    return _submit(req, res, params);
}

function deleteCustomer(req, res, next){
    const params = { type:'deleteCustomer'};
    return _submit(req, res, params);
}

function getSubscription(req, res, next){
    const params = { type:'getSubscription'};
    return _submit(req, res, params);
}

function createSubscription(req, res, next){
    const params = { type:'createSubscription'};
    return _submit(req, res, params);
}

function updateSubscription(req, res, next){
    const params = { type:'updateSubscription'};
    return _submit(req, res, params);
}

function deleteSubscription(req, res, next){
    const params = { type:'deleteSubscription'};
    return _submit(req, res, params);
}

function getPlans(req, res, next) {
    const params = { type:'getPlans'};
    return _submit(req, res, params);
}

function createPlan(req, res, next) {
    const params = { type:'createPlan'};
    return _submit(req, res, params);
}

function getCharges(req, res, next){
    const params = { type:'getCharges'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code){
    //console.log('data', data);
    //console.log('!!--- CODE --- !!', code);
    return res.status(code || 200).json({success:true, data:data});
}

function _onError(res, err){
    console.error('Core response', err);
    return responses.sendError(res, 'paymentsService', err);
}


module.exports = {
    getCustomer:getCustomer,
    createCustomer:createCustomer,
    updateCustomer:updateCustomer,
    deleteCustomer:deleteCustomer,
    getSubscription:getSubscription,
    createSubscription:createSubscription,
    updateSubscription:updateSubscription,
    deleteSubscription:deleteSubscription,
    getPlans:getPlans,
    createPlan: createPlan,
    getCharges: getCharges
};