/**
 * Created by xgharibyan on 6/28/17.
 */

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const Promise = require('bluebird');
const config = require('../config/env');
const User = require('../models/user');
const Project = require('../models/project');
const userCapacity  = require('./directorySize');
const utils = require('./utils');


function _getUser(decoded){
    return new Promise((resolve, reject)=>{
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
                    githubToken:user.github ? user.github.token : undefined,
                    facebook: user.facebook ? user.facebook.email : false,
                    google: user.google ? user.google.email : false,
                    steam: !!user.steamId,
                    oculus: !!user.oculusId
                });
                return resolve(data);
            })
            .catch(err => reject('Invalid token!'));
    })
}

function ifTokenValid(req) {

    return new Promise((resolve, reject) => {
        if (!req.headers['x-access-token']) return reject(`Token does not provided!`);
        const token = req.headers['x-access-token'];
        jwt.verify(token, config.jwtSecret, (err, decoded) => {
            if (err) return reject(`Invalid token or secret`);
            _getUser(decoded)
                .then(resolve)
                .catch(reject)
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

function isGod(req) {
   return new Promise((resolve, reject)=>{
       const token = req.headers['x-access-token']; //TODO: Get from Auth header
       // verifies secret and checks exp date
       jwt.verify(token, config.jwtSecret, function (err, decoded) {
           if (err) return reject(`You are not authenticated!`);
           if(decoded.role === 'God') return resolve(true);
           return reject('You are not authorized to perform this operation!');
       });
   })
}

function project(req) {
    return new Promise((resolve, reject) => {
        const projectID = req.query.id || req.params.id || req.body.id;
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
        Project.getOne(req.params.id || req.body.id || req.query.id, req.user.username)
            .then(project => resolve(project))
            .catch(err => {reject('Access to project denied!')})
    });
}

function validateStorage(req) {
    return new Promise((resolve, reject)=>{
        const role = req.user.role.toLowerCase();
        if (role == 'Admin' || role == 'God') resolve(true);
        //'Free', 'Premium', 'Enterprise', 'Admin', 'God'
        const storageSizes = {
            free: 100,
            premium: 500,
            enterprise: 100,
        };

        const storageMaxCapacity = req.user.storageSize || storageSizes[role];
        const rootDir = `projects/${req.user.username}`;

        userCapacity.readSizeRecursive(rootDir, (err, size) => {
            size = err ? 0 : size;

            if (req.files && req.files.length > 0) {
                _.each(req.files, function (file) {
                    size += file.size;
                });
            }

            if (utils.byteToMb(size) >= storageMaxCapacity) {
                return reject('Storage is full')
            }

            resolve(true);
        });
    })
}

function getUserByToken(req) {
    return new Promise((resolve)=>{
        if (!req.headers['x-access-token']) return resolve(null);
        const token = req.headers['x-access-token'];
        jwt.verify(token, config.jwtSecret, (err, decoded) => {
            if (err) return resolve(null);
            _getUser(decoded)
                .then(resolve)
                .catch(err=> resolve(null))
        });
    })
}

module.exports = {
    ifTokenValid: ifTokenValid,
    ifSelfUpdate: ifSelfUpdate,
    validateToken: validateToken,
    project: project,
    isProjectOwn: isProjectOwn,
    validateStorage:validateStorage,
    isGod:isGod,
    getUserByToken
};