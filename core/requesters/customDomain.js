const cote = require('cote');
const _  = require('lodash');
const responses = require('../../common/servicesResponses');

const customDomainRequester = new cote.Requester({
    name: 'Custom Domain responder',
    namespace: 'customDomain'
});

function _requesterHandler(params) {
    return new Promise((resolve, reject) => {
        customDomainRequester.send(params, (err, response) => {
            console.error('service err',err);
            console.log('service response', response);
            if(err) return reject(err);
            return resolve(response);
        })
    })
}

function _submit(req, res, params) {
    Object.assign(params, _.pick(req, 'headers', 'body', 'query', 'params', 'files'));
    return _requesterHandler(params)
        .then(response => _onSuccess(res, response))
        .catch(err => _onError(res, err));
}

function add(req, res, next) {
    const params = {type:'add'};
    return _submit(req, res, params);
}

function remove(req, res, next) {
    const params = {type:'remove'};
    return _submit(req, res, params);
}

function _onSuccess(res, data) {
    return res.status(200).json({success: true, data: data});
}

function _onError(res, err) {
    return responses.sendError(res, 'customDomain', err);

}

module.exports = {
	add,
	remove
};