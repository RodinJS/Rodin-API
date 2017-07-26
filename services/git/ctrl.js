/**
 * Created by xgharibyan on 6/27/17.
 */

const fs = require('fs');
const path = require('path');
const _  = require('lodash');
const request = require('request-promise');
const sendgrid = require('sendgrid');
const git = require('simple-git/promise');
const config = require('../../config/env');
const utils = require('../../common/utils');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');
const APIURLS = {
    AUTH: 'https://github.com/login/oauth/access_token',
    USER: 'https://api.github.com/user?access_token=',
    EMAIL: 'https://api.github.com/user/emails?access_token=',
};


function _gitPathGenerator(token, clone_url) {
    let position = clone_url.indexOf('github');
    return [clone_url.slice(0, position), token, '@', clone_url.slice(position)].join('');
}

function getToken(req) {
    return new Promise((resolve, reject) => {
        console.log('QUERY', req.query);
        const options = {
            uri: APIURLS.AUTH,
            qs: {
                code: req.query.code,
                client_id: config.social.github.clientId,
                client_secret: config.social.github.clientSecret,
            },
            headers: {
                'User-Agent': 'Rodin-JS-API',
            },
            json: true,
        };

        request(options)
            .then((tokenInfo) => {
                console.log(`github-access-token is, ${tokenInfo.access_token}`);
                resolve(tokenInfo.access_token);
            })
            .catch(err => reject(Response.onError(err, `Can't get git token`, 400)));
    })
}

function getUser(req) {
    return new Promise((resolve, reject) => {
        const userOptions = {
            uri: `${APIURLS.USER}${req.gitAccessToken}`,
            headers: {
                'User-Agent': 'Rodin-JS-API',
            },
            json: true,
        };
        const emailOptions = {
            uri: `${APIURLS.EMAIL}${req.gitAccessToken}`,
            headers: {
                'User-Agent': 'Rodin-JS-API',
            },
            json: true,
        };
        const returnData = {};
        request(userOptions)
            .then((gitUser) => {
                Object.assign(returnData, {
                    params: {
                        socialName: 'github',
                    },
                    body: {
                        id: gitUser.id,
                        username: gitUser.login || false,
                    }
                });
                return request(emailOptions);
            })
            .then((gitUserEmail) => {
                let primaryEmail = _.find(gitUserEmail, (email) => {
                    return email.primary === true;
                }).email;
                Object.assign(returnData.body, {
                    socialEmail: primaryEmail,
                    email: primaryEmail
                });
                return resolve(returnData);
            })
            .catch(err => reject(Response.onError(err, `Can't get git user token`, 400)));
    })
}

function successSync(req) {
    return new Promise((resolve, reject) => {
        if (req.query.projectId) {
            return Project.findById(req.query.projectId)
                .then(project => {
                    project = project.toObject();
                    return resolve(`${config.editorURL}/${project.owner}/${project.root}?token=${req.gitAccessToken}&id=${req.body.id}&socialEmail=${req.body.socialEmail}`);
                })
                .catch(err => reject(Response.onError(err, `Can't init success sync`, 400)));
        }
        resolve(`${config.clientURL}/profile?token=${req.gitAccessToken}&id=${req.body.id}&socialEmail=${req.body.socialEmail}`);
        //res.redirect(`http://localhost:8000/#/profile?token=${req.gitAccessToken}&id=${req.body.id}`);
    })
}

function theirs(req){
    return new Promise((resolve, reject)=>{
        if(!req.body.root || !req.body.id)
            return reject(Response.onError(null, `Project root or project id does not provided!`, 400));

        const projectRoot = config.stuff_path + 'projects/' + req.user.username + '/' + utils.cleanUrl(req.body.root) + '/';

        Project.getOne(req.body.id, req.user.username)
            .then(project => {
                const repoUrl = _gitPathGenerator(req.user.githubToken, project.github.https);
                console.log('projectRoot', projectRoot);
                git(projectRoot)
                    .fetch(repoUrl, 'rodin_editor')
                    .then(response=> git(projectRoot).reset('hard'))
                    .then(resp=>{
                        console.log('resp', resp);
                    })
                    .catch((err) => console.error('failed: ', err));
                /*
                 .clean('df')
                 .then(() => console.log('finished'))
                 */
            })
            .catch(err=>{
                console.log('err', err);
            })
    })
}


module.exports = {
    getToken: getToken,
    getUser: getUser,
    theirs:theirs,
    successSync: successSync
};
