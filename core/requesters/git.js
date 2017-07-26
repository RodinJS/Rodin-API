/**
 * Created by xgharibyan on 6/27/17.
 */

const cote = require('cote');
const _ = require('lodash');

const GitRequester = new cote.Requester({
    name: 'git requester',
    namespace: 'git'
});

const authRequester = require('../requesters/auth');


function _requesterHandler(params) {
    return new Promise((resolve, reject) => {
        GitRequester.send(params, (err, response, code) => {
            if (err) return reject(err);
            return resolve([response, code]);
        })
    })
}

function _submit(req, res, params) {
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params'));
    return _requesterHandler(params)
        .then((response, code) => _onSuccess(res, response[0], response[1]))
        .catch(err => _onError(res, err));
}

function initSync(req, res) {
    const params = {type: 'initSync'};
    return _submit(req, res, params);
}

function sync(req, res) {
    const params = {type: 'sync'};
    return _submit(req, res, params);
}

function _onSuccess(res, data, code) {
    if (code === 301) {
        return res.redirect(data);
    }
    console.log('CODE', code);
    if(code === 999){
        return authRequester.socialAuth(data, res)
    }
    return res.status(code || 200).json({success: true, data: data});
}

function _onError(res, err) {
    console.error('Core response', err);
    return res.status(err.code || 400).json({success: false, data: err.message || `Bad request`});
}

module.exports = {
    initSync: initSync,
    sync: sync
};