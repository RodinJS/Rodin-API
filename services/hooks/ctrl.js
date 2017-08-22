/**
 * Created by xgharibyan on 6/27/17.
 */
const _  = require('lodash');
const fs = require('fs');
const path = require('path');
const request = require('request');
const sendgrid = require('sendgrid');
const config = require('../../config/env');
const utils = require('../../common/utils');
const User = require('../../models/user');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');
const notifications = require('../../common/notifications');
const Notifications = require('../../models/notifications');
const httpStatus = require('../../common/httpStatus');
const RDSendgrid = require('../../common/sendgrid');
const sg = sendgrid('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');
const HookSecretKey = 'K7rd6FzEZwzcc6dQr3cv9kz4tTTZzAc9hdXYJpukvEnxmbdB42V4b6HePs5ZDTYLW_4000dram';

function validateKey(req) {
    return new Promise((resolve, reject) => {
        const token = req.headers['x-access-token'];

        if (token !== HookSecretKey) {
            return reject(Response.onError(null, `InvalidKey`, 404))
        }
        return resolve(true);
    })
}

function _sendEmail(req) {
    return new Promise((resolve, reject) => {


      /*  req.mailSettings = {
            to: req.user.email,
            from: 'team@rodin.io',
            fromName: 'Rodin team',
            templateName: 'rodin_build',
            subject: `${req.project.displayName} ${req.params.device} build complete`,
            handleBars: [{
                name: 'dateTime',
                content: utils.convertDate(),
            }, {
                name: 'userName',
                content: req.user.username,
            },
                {
                    name: 'projectName',
                    content: req.project.name,
                },
                {
                    name: 'device',
                    content: req.params.device,
                }],
        };*/

        req.mailSettings = {
            to: req.user.email,
            from: 'team@rodin.io',
            fromName: 'Rodin team',
            handleBars: [{
                name: 'dateTime',
                content: utils.convertDate(),
            }, {
                name: 'userName',
                content: req.user.username,
            },
                {
                    name: 'projectName',
                    content: req.project.name,
                },
                {
                    name: 'device',
                    content: req.params.device,
                }],
        };


        const appName = (req.body.project && req.body.project.appName) ? req.body.project.appName : req.project.name;
        let notificationSTATUS = 200;

        if (req.body.buildStatus === false && req.body.error) {
            const errorMessage = httpStatus[`${req.body.error.message}`] ? httpStatus[`${req.body.error.message}`].messgae : `build failed`;
            notificationSTATUS = 500;
            req.mailSettings.from = 'noreplay@rodin.io';
            req.mailSettings.templateName = 'rodin_build_failed';
            req.mailSettings.subject = `${req.project.displayName} ${req.params.device} build failed`;
            req.mailSettings.handleBars.push({name:'buildId', content:req.body.buildId});
            req.notification = Response.onError(null, `${appName} ${req.params.device} ${errorMessage}`, notificationSTATUS);
        }
        else {
            req.mailSettings.templateName = 'rodin_build';
            req.mailSettings.subject = `${req.project.displayName} ${req.params.device} build complete`;
            req.notification = `${appName} ${req.params.device} build complete`;
        }


        RDSendgrid.send(req)
            .then(mailSent => {
                req.notification = {
                    username: req.user.username,
                    label: req.notification.error ? req.notification.error.message : req.notification.data,
                    project: _.pick(req.project, ['_id', 'name']),
                    error: req.notification.error || false,
                    event: 'projectBuild',
                };
                notifications.create(req, false, false);
                notifications.pushSocket(req);
                return resolve(req.notification);
            })
    })
}

function build(req) {

    return new Promise((resolve, reject) => {
        const validDevices = ['oculus', 'vive', 'daydream', 'gearvr', 'ios', 'android'];

        if (validDevices.indexOf(req.params.device) < 0) {
            return reject(Response.onError(null, `Device type does not support`, 400));
        }
        if (!req.body.buildId) {
            return reject(Response.onError(null, `Provide buildId`, 400));
        }

        const update = {};
        update[`build.${req.params.device}.built`] = req.body.built || false;
        update[`build.${req.params.device}.buildId`] = req.body.buildId;

        Project.findByIdAndUpdate(req.params.id, {$set: update}, {new: true})
            .then(project => {
                if (!project) {
                    return reject(Response.onError(null, `Project not exist`, 404));
                }
                Object.assign(req, {project: project});
                return User.get(project.owner)
            })
            .then(user => {
                if (!user) {
                    return reject(Response.onError(null, `User Not Found`, 404));
                }
                Object.assign(req, {user: user});
                return _sendEmail(req);
            })
            .then(notification => resolve(notification))
            .catch(err => reject(Response.onError(err, `Can't send hook`, 400)))

    });
}

function get(req) {

    return new Promise((resolve, reject) => {
        Notifications.list({}, req.user.username)
            .then(notifications => resolve(notifications))
            .catch(err => reject(Response.onError(err, `Something went wrong`, 400)));

    });
}

function update(req) {
    return new Promise((resolve, reject) => {
        Notifications.updateAsync({_id: req.body.id || req.query.id}, {$set: {isRead: true}})
            .then(() => resolve({}))
            .catch(err => reject(Response.onError(err, `Something went wrong`, 400)));

    })
}

function remove(req) {
    return new Promise((resolve, reject) => {
        const queryParam = req.query.all ? {username: req.user.username} : {_id: req.query.id};
        const successMessage = req.query.all ? 'All notifications deleted' : 'Notification deleted';
        Notifications.removeAsync(queryParam)
            .then((deletedNotifications) => {
                if (deletedNotifications.result.ok === 1) {
                    return resolve(successMessage)
                } else {
                    return reject(Response.onError(err, `Something went wrong`, 400))
                }

            })
            .catch(err => reject(Response.onError(err, `Something went wrong`, 400)));
    })
}

module.exports = {
    build: build,
    validateKey: validateKey,
    get: get,
    update: update,
    remove: remove,
};
