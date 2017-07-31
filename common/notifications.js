/**
 * Created by xgharibyan on 11/29/16.
 */

const Promise = require('bluebird');
const Notifications = require('../models/notifications');
const _  = require('lodash');
const request = require('request-promise');
const config = require('../config/env');



/**
 * Get project for preview
 * @returns {Project}
 */
function create(req, res, next) {
    return new Promise((resolve, reject) =>{
        const label = req.notification.error ? req.notification.error.message : _.isObject(req.notification.data) ? req.notification.data.message : req.notification.data;
        const project = req.project ? _.pick(req.project, ['_id', 'name']) : undefined;
        //console.log('NOTIFICATION DATA', req.notification);
        const notification = new Notifications({
            username: req.user.username,
            label: label,
            project: project,
            error: req.notification.error ? req.notification.error  :  _.isObject(req.notification.data) ? req.notification.data.error : false,
        });
        notification.save()
            .then(saved=> resolve(saved))
            .catch(err=> reject(err));
    });

}

/*function get(req, res, next) {
    Notifications.list({}, req.user.username)
        .then(notifications => {
            return res.status(200).json({ success: true, data: notifications });
        })
        .error((e) => {
            const err = new APIError('Something went wrong!', 400, true);
            return next(err);
        });
}

function update(req, res, next) {
    Notifications.updateAsync({ _id: req.body.id || req.query.id }, { $set: { isRead: true } })
        .then(() => res.json({
            success: true,
            data: {},
        }))
        .error((e) => {
            const err = new APIError('Something went wrong!', 400, true);
            return next(err);
        });
}

function remove(req, res, next) {
    const queryParam = req.query.all ? { username: req.user.username } : { _id: req.query.id };
    const successMessage = req.query.all ? 'All notifications deleted' : 'Notification deleted';
    Notifications.removeAsync(queryParam)
        .then((deletedNotifications)=> {
            if (deletedNotifications.result.ok === 1) {
                return res.status(200).json({ success: true, data: successMessage });
            } else {
                const err = new APIError('Something went wrong!', 400, true);
                return next(err);
            }

        })
        .error((e) => {
            const err = new APIError('Something went wrong!', 400, true);
            return next(err);
        });
}

function pushSocket(req) {
    if(_.isUndefined(req.notification.username)){
        return console.log('no username')
    }
    if(_.isUndefined(req.notification.event)){
        return console.log('no event')
    }
    const options = {
        method: 'POST',
        uri: `${config.socketURL}/ss/hooks`,
        body: req.notification,
        json: true, // Automatically stringifies the body to JSON
    };

    request(options)
        .then((response) => {
            console.log(response);
        })
        .catch((err)  => {
            console.log(err);
        });
}*/

module.exports = { create};
// get, update, remove, pushSocket
