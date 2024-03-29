/**
 * Created by xgharibyan on 11/29/16.
 */

const Promise = require('bluebird');
const Notifications = require('../models/notifications');
const _ = require('lodash');
const request = require('request-promise');
const config = require('../config/env');
const socketServerRequester = require('../core/requesters/socketServer');


/**
 * Get project for preview
 * @returns {Project}
 */
function create(req) {
    return new Promise((resolve, reject) => {
        const label = req.notification.error ? req.notification.error.message : _.isObject(req.notification.data) ? req.notification.data.message : req.notification.data;
        const project = req.project ? _.pick(req.project, ['_id', 'name']) : undefined;
        const notification = new Notifications({
            username: req.user.username,
            label: label,
            project: project,
            error: req.notification.error ? req.notification.error : _.isObject(req.notification.data) ? req.notification.data.error : false,
        });
        notification.save()
            .then(saved => resolve(saved))
            .catch(err => reject(err));
    });

}

function pushSocket(req) {
    if (_.isUndefined(req.notification.username)) {
        return console.warn('no username')
    }
    if (_.isUndefined(req.notification.event)) {
        return console.warn('no event')
    }
    socketServerRequester.hook(req);
}
module.exports = {create, pushSocket};
// get, update, remove, pushSocket
