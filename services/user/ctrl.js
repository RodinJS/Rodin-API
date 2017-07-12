/**
 * Created by xgharibyan on 6/27/17.
 */

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const fs = require('fs');
const fsExtra = require('fs-extra');
const moment = require('moment');
const sendgrid = require('sendgrid');
const Q = require('q');
const config = require('../../config/env');
const utils = require('../../common/utils');
const User = require('../../models/user');
const Project = require('../../models/project');
const Response = require('../../common/servicesResponses');
const notifications = require('../../common/notifications');
const RDSendgrid = require('../../common/sendgrid');
const sg = sendgrid('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');

function returnUserData(data, requireToken) {
    const user = data.user;
    const responseData = {};

    if (requireToken) {
        const token = jwt.sign({
            username: user.username,
            role: user.role,
            random: user.password.slice(-15)
        }, config.jwtSecret, {
            expiresIn: "7d"
        });
        Object.assign(responseData, {user: {}});
        Object.assign(responseData, {token: token});
        Object.assign(responseData.user, user);
        Object.assign(responseData.user, {projects: data.projectsCount});
        Object.assign(responseData.user, {usedStorage: utils.byteToMb(data.usedStorage)});
    }
    else {
        Object.assign(responseData, user);
        Object.assign(responseData, {projects: data.projectsCount});
        Object.assign(responseData, {usedStorage: utils.byteToMb(data.usedStorage)});
    }
    return responseData;
}

function create(req) {
    console.log('REq Create', req);
    return new Promise((resolve, reject) => {
        User.get(req.body.username)
            .then(user => {
                if (user) {
                    return reject(Response.onError(err, `Username or Email already exists.`, 311));
                }
                const userObject = {
                    email: req.body.email,
                    password: req.body.password,
                    username: req.body.username,
                    profile: {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                    },
                    usernameConfirmed: true,
                };
                user = new User(userObject);
                return user.saveAsync();
            })
            .then((savedUser) => {
                const rootDir = config.stuff_path + 'projects/' + savedUser.username;
                const publicDir = config.stuff_path + 'public/' + savedUser.username;
                const publishDir = config.stuff_path + 'publish/' + savedUser.username;
                const historyDir = config.stuff_path + 'history/' + savedUser.username;

                if (!fs.existsSync(rootDir)) {
                    fs.mkdirSync(rootDir); //creating root dir for project
                }

                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir); //creating root dir for public
                }

                if (!fs.existsSync(publishDir)) {
                    fs.mkdirSync(publishDir); //creating root dir for publish
                }

                if (!fs.existsSync(historyDir)) {
                    fs.mkdirSync(historyDir); //creating root dir for history
                }

                const token = jwt.sign({
                    username: savedUser.username,
                    role: savedUser.role,
                    random: savedUser.password.slice(-15),
                }, config.jwtSecret, {
                    expiresIn: '7d',
                });

                req.mailSettings = {
                    to: savedUser.email,
                    from: 'team@rodin.io',
                    fromName: 'Rodin team',
                    templateName: 'rodin_signup',
                    subject: 'Welcome to Rodin platform',
                    handleBars: [{
                        name: 'dateTime',
                        content: utils.convertDate(),
                    }, {
                        name: 'userName',
                        content: savedUser.username,
                    }],
                };
                RDSendgrid.send(req)
                    .then(response => {
                        return resolve({
                            token,
                            user: {
                                email: savedUser.email,
                                username: savedUser.username,
                                role: savedUser.role,
                                profile: savedUser.profile,
                                projects: {
                                    unpublished: 0,
                                    published: 0,
                                    total: 0,
                                },
                                usedStorage: 0,
                            },
                        });
                    });

            })
            .catch(err => reject(Response.onError(err, `Username or Email already exists.`, 327)));

    })
}

function update(req) {
    console.log('REQ UPDATE:', req);
    return new Promise((resolve, reject) => {
        User.updateAsync({username: req.params.username}, {$set: req.body})
            .then(() => resolve(true))
            .catch((e) => reject(`Email already in use.`));
    })
}

function remove(req) {

    return new Promise((resolve, reject) => {
        const user = req.user;
        const username = req.user.username;

        let rootDir = config.stuff_path + 'projects/' + username;
        let publicDir = config.stuff_path + 'public/' + username;
        let publishDir = config.stuff_path + 'publish/' + username;

        fsExtra.removeSync(rootDir);
        fsExtra.removeSync(publicDir);
        fsExtra.removeSync(publishDir);

        Q.all(_.map(user.projects, (project) => {
            return Project.removeAsync({_id: project})
        }))
            .then(removed => {
                User.removeAsync({username: username})
                    .then((deletedUser) => resolve(deletedUser))
                    .error((e) => reject(Response.onError(e, `Something went wrong`, 400)));
            })
    })

}

function checkResetPasswordUsed(req) {
    return new Promise((resolve, reject) => {
        User.findOne({resetPasswordToken: req.query.token})
            .then(user => {
                const expired = (user && user.resetPasswordExpires) ? moment(new Date()).isAfter(user.resetPasswordExpires) : true;
                if ((user && user.resetPasswordExpires) && expired) {
                    user.resetPasswordExpires = null;
                    user.resetPasswordToken = null;
                    user.save();
                }
                return resolve({tokenUsed: expired});
            })
            .catch(err => resolve({tokenUsed: false}));
    });
}

function resetPassword(req) {
    return new Promise((resolve, reject) => {

        if (_.isUndefined(req.body.resetData)) {
            return reject(Response.onError(null, `Please provide username or email`, 400));
        }
        const query = {
            $or: [
                {username: new RegExp('^' + req.body.resetData.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') + '$', 'i')},
                {email: req.body.resetData.toLowerCase()}
            ]
        };
        const userData = {};
        let email = '';
        let resetToken = '';
        User.findOne(query)
            .then(user => {
                if (!user) return reject(Response.onError(err, `User not exist!`, 400));


                email = user.email;
                resetToken = utils.generateCode(15);

                user.resetPasswordToken = resetToken;
                user.resetPasswordExpires = moment().add(1, 'days');
                Object.assign(userData, user.toObject());
                return user.save()
            })
            .then(userSaved => {
                req.mailSettings = {
                    to: email,
                    from: 'team@rodin.io',
                    fromName: 'Rodin team',
                    templateName: 'rodin_forget',
                    subject: 'Password reset request',
                    handleBars: [{
                        name: 'userName',
                        content: userData.profile.firstName || userData.username,
                    },
                        {
                            name: 'resetLink',
                            content: `${config.clientURL}/reset-password?t=${resetToken}`,
                        }]
                };
                return RDSendgrid.send(req)
            })
            .then(response => {
                let responseMessage = 'Mail sent';
                if (req.body.test && req.body.test === 'giveMeAToken')
                    responseMessage = resetToken;
                return resolve(responseMessage);
            })
            .catch(e => reject(Response.onError(e, `Bad Request`, 400)));
    })
}

function changePassword(req) {
    return new Promise((resolve, reject) => {
        if (req.body.password != req.body.confirmPassword) {
            return reject(Response.onError(null, `Password not match`, 400));
        }
        User.findOne({resetPasswordToken: req.body.token})
            .then(user => {
                if (!user) return reject(Response.onError(null, `Invalid token or secret`, 316));
                user.resetPasswordExpires = null;
                user.resetPasswordToken = null;
                user.save();
                delete req.body.token;
                delete req.body.confirmPassword;
                return resolve({
                    username: user.username,
                    email: user.email,
                })
            })
            .catch(e => reject(Response.onError(e, `Invalid token or secret`, 316)));

    })
}

function updatePassword(req) {
    return new Promise((resolve, reject) => {
        User.get(req.user.username)
            .then((user) => {
                user.password = req.body.password;
                return user.saveAsync()
            })
            .then((user) => {
                req.user = user;
                req.notification = {
                    data: 'Password has been changed',
                };
                notifications.create(req, false, false);
                return resolve(user.toObject());
            })
            .error((e) => reject(Response.onError(e, `Bad request`, 400)));
    })
}

/**
 * METAVERSE subscription
 * @param req
 * @param res
 * @param next
 */
function metaverse(req, res, next) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.email)) {
            return reject(Response.onError(null, `Please provide email`, 400));
        }
        if (_.isUndefined(req.body.first_name)) {
            return reject(Response.onError(null, `Please provide name`, 400));
        }

        req.body.metaverse = "true";

        const setSubscriber = sg.emptyRequest({
            method: 'POST',
            path: '/v3/contactdb/recipients',
            body: [req.body],
        });


        sg.API(setSubscriber)
            .then(response => {
                if (response.body.error_count > 0) {
                    return reject(Response.onError(null, `Something went wrong`, 400));

                }
                req.mailSettings = {
                    to: req.body.email,
                    from: 'team@rodin.io',
                    fromName: 'Rodin team',
                    templateName: 'rodin_metaverse',
                    subject: 'Rodin Metaverse',
                    handleBars: [{
                        name: 'userName',
                        content: req.body.first_name,
                    }]
                };
                RDSendgrid.send(req);
                return resolve('Stake claimed');
            })
            .catch(e => {
                console.log(e);
                reject(Response.onError(null, `Something went wrong!`, 400))
            })
    })
}

function unSyncSocial(req) {
    return new Promise((resolve, reject) => {
        const field = {};
        switch (req.params.socialName) {
            case 'facebook' :
                Object.assign(field, {$unset: {facebook: 1}});
                break;
            case 'github' :
                Object.assign(field, {$unset: {github: 1}});
                break;
            case 'google' :
                Object.assign(field, {$unset: {google: 1}});
                break;
            case 'steam' :
                Object.assign(field, {$unset: {steamId: 1}});
                break;
            case 'oculus' :
                Object.assign(field, {$unset: {oculusId: 1}});
                break;
        }
        if (!field.$unset) {
            return reject(Response.onError(null, `Provide right Social`, 400))
        }

        req.field = field;


        if (req.params.socialName === 'github') {

            return Project.find({owner: req.user.username})
                .then(projects => {
                    return Q.all(_.map(projects, (project) => {
                        project = project.toObject();
                        project.projectRoot = config.stuff_path + 'projects/' + req.user.username + '/' + utils.cleanUrl(project.root) + '/';
                        if (fs.existsSync(`${project.projectRoot}.git/`)) {
                            utils.deleteFolderRecursive(`${project.projectRoot}.git/`)
                        }
                        return Project.updateAsync({_id: project._id}, {$unset: {github: 1}})
                    }))
                })
                .then(unsetResponse => resolve(req))
                .catch((e) => {
                    console.log(e);
                    reject(Response.onError(e, `Bad request`, 400))
                });
        }
        return resolve(req)
    })
}

function unsetUserData(req) {
    return new Promise((resolve, reject) => {
        return User.updateAsync({username: req.user.username}, req.field)
            .then(() => resolve({}))
            .error((e) => {
                console.log(e);
                reject(Response.onError(e, `Bad request`, 400))
            })
    })
}

function confirmUsername(req){

    return new Promise((resolve, reject)=>{
        if (req.user.usernameConfirmed) {
            return  reject(Response.onError(null, `Username updated`, 400))
        }
        if (_.isUndefined(req.body.username)) {
            return  reject(Response.onError(null, `Please provide username`, 400))
        }

        req.body.usernameConfirmed = true;
        User.findOneAndUpdate({username: req.user.username}, {$set: req.body}, {new: true})
            .then(user => {
                let rootDir = config.stuff_path + 'projects/' + user.username;
                let publicDir = config.stuff_path + 'public/' + user.username;
                let publishDir = config.stuff_path + 'publish/' + user.username;

                if (!fs.existsSync(rootDir)) {
                    fs.mkdirSync(rootDir); //creating root dir for project
                }

                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir); //creating root dir for public
                }

                if (!fs.existsSync(publishDir)) {
                    fs.mkdirSync(publishDir); //creating root dir for publish
                }

                return resolve(user)
            })
            .catch(e => {
                return  reject(Response.onError(e, `Something went wrong`, 400))
            });

    });
}


module.exports = {
    returnUserData: returnUserData,
    create: create,
    update: update,
    remove:remove,
    checkResetPasswordUsed: checkResetPasswordUsed,
    resetPassword: resetPassword,
    changePassword: changePassword,
    updatePassword: updatePassword,
    metaverse: metaverse,
    unSyncSocial: unSyncSocial,
    unsetUserData: unsetUserData,
    confirmUsername:confirmUsername
};