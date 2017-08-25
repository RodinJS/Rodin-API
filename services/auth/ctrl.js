/**
 * Created by xgharibyan on 6/27/17.
 */

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const fs = require('fs');
const httpStatus = require('../../common/httpStatus');
const config = require('../../config/env');
const utils = require('../../common/utils');
const User = require('../../models/user');
const Response = require('../../common/servicesResponses');
const RDSendgrid = require('../../common/sendgrid');


/**
 *
 * @param userObject
 * @returns {*}
 * @private
 */
function _saveUserFromSocial(userObject) {
    user = new User(userObject);
    return user.save(userObject)
        .then(savedUser => {
            //setup project folder for confirmed User
            if (userObject.usernameConfirmed) {

                let rootDir = config.stuff_path + 'projects/' + savedUser.username;
                let publicDir = config.stuff_path + 'public/' + savedUser.username;
                let publishDir = config.stuff_path + 'publish/' + savedUser.username;

                if (!fs.existsSync(rootDir)) {
                    fs.mkdirSync(rootDir); //creating root dir for project
                }

                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir); //creating root dir for public
                }

                if (!fs.existsSync(publishDir)) {
                    fs.mkdirSync(publishDir); //creating root dir for publish
                }

            }
            return {sendMail: true, user: savedUser};
        })
        .catch(err => err);
}

/**
 *
 * @param req
 * @param user
 * @returns {*}
 * @private
 */
function _updateUserFromSocial(req, user) {
    const userUpdate = {};

    if (req.params.socialName === 'facebook' && !user.facebookId) {
        Object.assign(userUpdate, {$set: {'facebook.id': req.body.id, 'facebook.email': req.body.socialEmail}})
    }

    else if (req.params.socialName === 'google' && !user.googleId) {
        Object.assign(userUpdate, {$set: {'google.id': req.body.id, 'google.email': req.body.socialEmail}})
    }

    else if (req.params.socialName === 'steam' && !user.steamId) {
        Object.assign(userUpdate, {$set: {steamId: req.body.id}})
    }

    else if (req.params.socialName === 'oculus' && !user.oculusId) {
        Object.assign(userUpdate, {$set: {oculusId: req.body.id}})
    }

    else if (req.params.socialName === 'github') {
        if (req.body.sync) {
            Object.assign(userUpdate, {
                $set: {
                    'github.token': req.body.token,
                    'github.id': req.body.id,
                    'github.email': req.body.socialEmail
                }
            })
        }
        else {
            Object.assign(userUpdate, {$set: {'github.token': req.gitAccessToken}})
        }
    }

    if (Object.keys(userUpdate).length > 0) {

        return User.findOneAndUpdate({username: user.username}, userUpdate, {new: true})
            .then(updatedUser => {

                if (req.body.sync) {
                    updatedUser = updatedUser.toObject();
                    updatedUser = _.omit(updatedUser, ['stripe']);


                    updatedUser.github = updatedUser.github ? updatedUser.github.email : false;
                    updatedUser.facebook = updatedUser.facebook ? updatedUser.facebook.email : false;
                    updatedUser.google = updatedUser.google ? updatedUser.google.email : false;
                    updatedUser.steam = !!updatedUser.steamId;
                    updatedUser.oculus = !!updatedUser.oculusId;

                    return {sendMail: false, user: updatedUser};
                }

                return {sendMail: false, user: updatedUser};

            })
            .catch((e) => e);
    }

    return {sendMail: false, user: user};
}

/**
 *
 * @param params
 * @returns {Promise|Promise.<T>|*}
 */
function login(params) {

    return new Promise((resolve, reject) => {
        const user = {};
        return User.get(params.username)
            .then(response => {
                if (!response) reject(Response.onError(null, `Authentication error`, 310));
                Object.assign(user, response.toObject());
                return response.comparePassword(params.password);
            })
            .then(matched => resolve(user))
            .catch(err => reject(Response.onError(err, `Authentication error`, 310)));
    })
}

/**
 *
 * @param req
 * @returns {*}
 */
function socialAuth(req) {
    return new Promise((resolve, reject) => {
        const socials = ['facebook', 'google', 'steam', 'oculus', 'github'];
        const queryMethod = {};
        const userObject = {};
        if (_.indexOf(socials, req.params.socialName) < 0) {
            return reject(Response.onError(null, `Wrong login method`, 310));
        }


        switch (req.params.socialName) {
            case 'facebook':
                Object.assign(queryMethod, {$or: [{'facebook.id': req.body.id}]});
                _.set(userObject, 'facebook', {
                    id: req.body.id,
                    email: req.body.socialEmail
                });
                break;
            case 'google':
                Object.assign(queryMethod, {$or: [{'google.id': req.body.id}]});
                _.set(userObject, 'google', {
                    id: req.body.id,
                    email: req.body.socialEmail
                });
                break;
            case 'steam':
                Object.assign(queryMethod, {$or: [{steamId: req.body.id}]});
                userObject.steamId = req.body.id;
                _.set(userObject, 'steamId', req.body.id);
                break;
            case 'oculus':
                Object.assign(queryMethod, {$or: [{oculusId: req.body.id}]});
                _.set(userObject, 'oculusId', req.body.id);
                break;
            case 'github':
                Object.assign(queryMethod, {$or: [{'github.id': req.body.id}]});
                _.set(userObject, 'github', {
                    id: req.body.id,
                    token: req.gitAccessToken,
                    email: req.body.socialEmail
                });
                break;

        }
        queryMethod['$or'].push({email: req.body.email});

        return User.findOne(queryMethod)
            .then(user => {
                if (!user) {
                    Object.assign(userObject, {
                        email: req.body.email,
                        username: req.body.username || req.body.id,
                        password: utils.generateCode(8),
                        profile: {
                            firstName: req.body.first_name || '',
                            lastName: req.body.last_name || ''
                        },
                        role: 'Free',
                        usernameConfirmed: !!req.body.username
                    });
                    return _saveUserFromSocial(userObject);
                }
                if(req.params.socialName == 'github') return reject(Response.onError(null, httpStatus.GIT_ALREADY_SYNCED.message, 400));
                return _updateUserFromSocial(req, user);
            })
            .then(data => {
                if (data.sendMail) {
                    req.mailSettings = {
                        to: user.email,
                        from: 'team@rodin.io',
                        fromName: 'Rodin team',
                        templateName: 'rodin_signup',
                        subject: 'Welcome to Rodin platform',
                        handleBars: [{
                            name: 'dateTime',
                            content: utils.convertDate()
                        }, {
                            name: 'userName',
                            content: user.username
                        }]
                    };
                    RDSendgrid.send(req);
                }
                return resolve(data.user);
            })
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    });


}

/**
 *
 * @param data
 * @returns {{}}
 */
function completeLogin(data) {
    const user = data.user;
    const allowedDataArr = [
        'email',
        'username',
        'role',
        'profile',
        'usernameConfirmed',
        'allowProjectsCount',
        'creationDate',
        'github',
        'facebook',
        'google',
        'steam',
        'oculus',
    ];
    const token = data.token || jwt.sign({
            username: user.username,
            role: user.role,
            random: user.password.slice(-15)
        }, config.jwtSecret, {
            expiresIn: "7d"
        });
    const responseData = {};
    Object.assign(responseData, {user: _.pick(user, allowedDataArr)});
    Object.assign(responseData.user, {projects: data.projectsCount});
    Object.assign(responseData.user, {usedStorage: utils.byteToMb(data.usedStorage)});
    Object.assign(responseData, {token: token});

    return responseData;
}

module.exports = {
    login: login,
    socialAuth: socialAuth,
    completeLogin: completeLogin
};
