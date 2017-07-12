/**
 * Created by xgharibyan on 6/28/17.
 */

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const Promise = require('bluebird');
const config = require('../config/env');
const User = require('../models/user');
const Project = require('../models/project');

function ifTokenValid(req) {

    return new Promise((resolve, reject) => {
        if (!req.headers['x-access-token']) return reject(`Token does not provided!`);
        const token = req.headers['x-access-token'];
        jwt.verify(token, config.jwtSecret, (err, decoded) => {
            if (err) return reject(`Invalid token or secret`);
            User.get(decoded.username)
                .then(user => {
                    if (!user) return reject('Invalid token!');
                    user = user.toObject();
                    const data = {};
                    Object.assign(data, _.pick(user, ['email',
                        'username',
                        'role',
                        'profile',
                        'storageSize',
                        'allowProjectsCount',
                        'usernameConfirmed',
                        'stripe',
                        'projects',
                    ]));
                    Object.assign(data, {
                        creationDate: user.createdAt,
                        github: user.github ? user.github.email : false,
                        facebook: user.facebook ? user.facebook.email : false,
                        google: user.google ? user.google.email : false,
                        steam: !!user.steamId,
                        oculus: !!user.oculusId
                    });
                    return resolve(data);
                })
                .catch(err => {
                    console.log('err', err);
                    return reject('Invalid token!');
                });
        });

    });
}

function ifSelfUpdate(req, res, next) {
    return new Promise((resolve, reject) => {
        if (req.user.username !== req.params.username) {
            return reject(`Access to update denied`)
        }
        return resolve(true);
    });
}

function validateToken(req) {
    return new Promise((resolve, reject) => {
        const token = req.headers['x-access-token']; //TODO: Get from Auth header
        jwt.verify(token, config.jwtSecret, (err, decoded) => {
            if (err) return resolve(false);
            return resolve(decoded);
        })
    });
}

function project(req) {
    return new Promise((resolve, reject) => {
        const projectID = req.query.id || req.params.id;
        if (!projectID) return reject(`Provide project ID!`);
        Project.getOne(projectID, req.user.username)
            .then((project) => resolve({
                name: project.name,
                root: project.root,
                displayName: project.displayName,
            }))
            .catch(err => reject(`Access to project denied!`))
    });
}

function isProjectOwn(req) {
    return new Promise((resolve, reject) => {
        Project.getOne(req.params.id, req.user.username)
            .then(project => resolve(project))
            .catch(err => reject('Access to project denied!'))
    });
}

module.exports = {
    ifTokenValid: ifTokenValid,
    ifSelfUpdate: ifSelfUpdate,
    validateToken: validateToken,
    project: project,
    isProjectOwn: isProjectOwn
};