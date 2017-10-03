/**
 * Created by xgharibyan on 6/27/17.
 */

const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const Q = require('q');
const request = require('request-promise');
const sendgrid = require('sendgrid');
const git = require('simple-git/promise');
const GitHubApi = require('github');
const config = require('../../config/env');
const utils = require('../../common/utils');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');
const notifications = require('../../common/notifications');
const APIURLS = {
    AUTH: 'https://github.com/login/oauth/access_token',
    USER: 'https://api.github.com/user?access_token=',
    EMAIL: 'https://api.github.com/user/emails?access_token=',
};


function _createRepo(repoName, token, project) {
    return new Promise((resolve, reject) => {
        const github = new GitHubApi({
            debug: true,
            protocol: 'https',
            host: 'api.github.com',
            pathPrefix: '',
            headers: {
                'user-agent': 'Rodin-JS-API',
            },
            Promise: require('bluebird'),
            followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
            timeout: 5000,
        });
        const repositoryName = `${repoName}_RO-${utils.generateCode(5)}`;
        github.authenticate({
            type: 'token',
            token: token,
        });

        github.repos.create({name: repositoryName}, (err, result) => {
            if (err) return reject(`Repo with name ${repoName} alredy exist!`);

            return resolve({data: result, token: token, repoName: repositoryName, project: project || undefined});
        });

    });
}

/**
 * @param projectRoot
 * @param repoUrl
 * @param project
 * @param req
 * @returns {Promise}
 * @private
 */
function _pushProject(projectRoot, repoUrl, project, req) {
    return new Promise((resolve, reject) => {
        //return

        git(projectRoot)
            .init()
            .then(response=> git(projectRoot).addConfig('user.email', req.user.github))

            .then(response => git(projectRoot).add('*'))
            .then(response => git(projectRoot).commit("first commit!"))
            .then(response => git(projectRoot).addRemote('origin', repoUrl))
            .then(response => git(projectRoot).push('origin', 'master', {'--force': true}))
            .then(response => git(projectRoot).checkoutLocalBranch('rodin_editor'))
            .then(response => git(projectRoot).push('origin', 'rodin_editor', {'-u': true}))
            .then(response => resolve(project || `Project Pushed`))
            .catch(err => {
                console.log('err', err);
                if (project && req) {
                    _sendErrorNotification(project, req, err);
                }
                reject(err)
            })

    })
}

function _initAndPush(repoData, req){
    const gitUrl = repoData.data.git_url;
    const cloneUrl = repoData.data.clone_url;
    const position = cloneUrl.indexOf('github');
    const token = repoData.token;
    const repoUrl = [cloneUrl.slice(0, position), token, '@', cloneUrl.slice(position)].join('');

    Object.assign(repoData.project, {git: gitUrl, https: cloneUrl});
    return _pushProject(repoData.project.projectRoot, repoUrl, repoData.project, req)
}

function _sendErrorNotification(project, req, err) {
    Object.assign(req, {
        notification: {
            username: req.user.username,
            error: err.err || err.error || err,
            data: `Problem with syncing projects with github. Please contact support for details support@rodin.io`,
            event: 'gitSync'
        },
    });
    if (project) {
        req.notification.data = {
            error: true,
            message: `Can't sync ${project.name} project with git. Please contact support for details support@rodin.io`
        };
        Object.assign(req.notification, {project: project});
    }
    notifications.create(req)
        .catch(err => console.log(`notification error`, err));
    notifications.pushSocket(req);
}

function _gitPathGenerator(token, clone_url) {
    let position = clone_url.indexOf('github');
    return [clone_url.slice(0, position), token, '@', clone_url.slice(position)].join('');
}

function _getProject(req) {
    return new Promise((resolve, reject) => {
        if (!req.body.root || !req.body.id)
            return reject(Response.onError(null, `Project root or project id does not provided!`, 400));

        const projectRoot = `${config.stuff_path}projects/${req.user.username}/${utils.cleanUrl(req.body.root)}`;
        Project.getOne(req.body.id, req.user.username)
            .then(project => {
                if (!project.github || !project.github.https) return reject(Response.onError(null, `Project not synced with github`, 400));
                const repoUrl = _gitPathGenerator(req.user.githubToken, project.github.https);
                return resolve({projectRoot: projectRoot, repoUrl: repoUrl, project: project.toObject()})
            })
            .catch(err => reject(Response.onError(err, `Can't get project`, 400)));
    })
}

function _rollback(projectRoot) {
    if (fs.existsSync(`${projectRoot}/.git/`)) {
        utils.deleteFolderRecursive(`${projectRoot}/.git/`)
    }
    return true;
}

function _updateProject(username, project){
    const query = {
        _id: project._id,
        owner: username
    };
    const options = {
        $set: {
            github: {
                git: project.git,
                https: project.https,
            },
        }
    };
    return Project.findOneAndUpdateAsync(query, options, {new: true});
}

function getToken(req) {
    return new Promise((resolve, reject) => {
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
        console.log('GIT OPTIONS', options);
        request(options)
            .then((tokenInfo) => {
                console.log('tokenInfo', tokenInfo);
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
    })
}

function create(req) {
    return new Promise((resolve, reject) => {
        if (!req.body.root || !req.body.id)
            return reject(Response.onError(null, `Project root or project id does not provided!`, 400));

        const projectRoot = `${config.stuff_path}projects/${req.user.username}/${utils.cleanUrl(req.body.root)}`;
        const project = {};
        let cloneUrl, position, token, repoUrl, repoName;

        _rollback(projectRoot);
        _getProject(req)
            .then(response => {
                Object.assign(project, response.project);
                return _createRepo(req.body.root, req.user.githubToken)
            })
            .then(result => {
                cloneUrl = result.data.clone_url;
                position = cloneUrl.indexOf('github');
                token = result.token;
                repoName = result.repoName;
                repoUrl = [cloneUrl.slice(0, position), token, '@', cloneUrl.slice(position)].join('');
                fsExtra.ensureFileSync(`${projectRoot}/README.md`);
                fs.truncateSync(`${projectRoot}/README.md`);
                fs.appendFileSync(`${projectRoot}/README.md`, `# ${project.name || req.body.root}`);
                return _pushProject(projectRoot, repoUrl);
            })
            /*.then(response => git(projectRoot).add('*'))
             .then(response => git(projectRoot).commit("first commit!"))
             .then(response => git(projectRoot).addRemote('origin', repoUrl))
             .then(response => git(projectRoot).push('origin', 'master', {'--force': true}))
             .then(response => git(projectRoot).checkoutLocalBranch('rodin_editor'))
             .then(response => git(projectRoot).push('origin', 'rodin_editor', {'-u': true}))*/
            .then(response => resolve(`GitHub repo successfully created`))
            .catch(err => reject(Response.onError(err, `GitHub account not linked to this user!`, 350)));
    })
}

function theirs(req) {
    return new Promise((resolve, reject) => {

        let projectRoot = null;
        let repoUrl = null;
        _getProject(req)
            .then(response => {
                projectRoot = response.projectRoot;
                repoUrl = response.repoUrl;
                return git(projectRoot).fetch(repoUrl, 'rodin_editor')
            })
            .then(response => git(projectRoot).reset('hard'))
            .then(response => git(projectRoot).clean('f'))
            .then(response => resolve(`GitHub repo successfully synced`))
            .catch(err => reject(Response.onError(err, `Can't Pull git`, 400)));

    })
}

function ours(req) {
    return new Promise((resolve, reject) => {
        let projectRoot = null;
        let repoUrl = null;
        _getProject(req)
            .then(response => {
                projectRoot = response.projectRoot;
                repoUrl = response.repoUrl;
                return git(projectRoot).add('*')
            })
            .then(response => git(projectRoot).commit(`update`))
            .then(response => git(projectRoot).push('origin', 'rodin_editor', {'--force': true}))
            .then(response => resolve(`GitHub repo successfully synced`))
            .catch(err => reject(Response.onError(err, `Can't push git`, 400)));

    })
}

function syncProjects(req) {
    return new Promise((resolve, reject) => {
        if (!req.user.githubToken) return reject(Response.onError(null, `GitHub account not synced`, 400));
        const gitToken = req.user.githubToken;
        const username = req.user.username;

        Project.find({owner: username, github: {$exists: false}})
            .then((projects) => {
                if (projects.length <= 0) return resolve(`Your all projects synced with github.`);
                resolve(`We will notify you when sync will be done`);

                return Q.all(_.map(projects, (project) => {
                    project = project.toObject();
                    project.projectRoot = `${config.stuff_path}projects/${username}/${utils.cleanUrl(project.root)}`;
                    _rollback(project.projectRoot);
                    return _createRepo(project.name, gitToken, project)
                }))
            })
            .then((repoCreated) => Q.all(_.map(repoCreated, (repoData) => _initAndPush(repoData, req))))
            .then((pushedProjects) => {
                if (pushedProjects.length <= 0) return null;
                return Q.all(_.map(pushedProjects, (project) => _updateProject(username, project)));
            })
            .then((updatedProjects) => {
                if (updatedProjects) {
                    const message = `${updatedProjects.length} project(s) successfully synced`;

                    req.notification = {
                        username: req.user.username,
                        error: false,
                        data: {
                            error: false,
                            message: message
                        },
                        event: 'gitSync'
                    };
                    notifications.create(req);

                    return notifications.pushSocket(req);
                }
            })
            .catch(err => {
                console.log('err', err);
                _sendErrorNotification(null, req, err)
            })

    })
}

function syncSingleProjects(req){
    return new Promise((resolve, reject)=>{
        if (!req.user.githubToken) return reject(Response.onError(null, `GitHub account not synced`, 400));
        const gitToken = req.user.githubToken;
        const username = req.user.username;
        const projectID = req.params.projectId;
        Project.findById(projectID)
            .then(project=>{
                project = project.toObject();
                project.projectRoot = `${config.stuff_path}projects/${username}/${utils.cleanUrl(project.root)}`;
                _rollback(project.projectRoot);
                return _createRepo(project.name, gitToken, project)
            })
            .then((repoData) =>{
                const gitUrl = repoData.data.git_url;
                const cloneUrl = repoData.data.clone_url;
                const position = cloneUrl.indexOf('github');
                const token = repoData.token;
                const repoUrl = [cloneUrl.slice(0, position), token, '@', cloneUrl.slice(position)].join('');

                Object.assign(repoData.project, {git: gitUrl, https: cloneUrl});
                return _pushProject(repoData.project.projectRoot, repoUrl, repoData.project, req)
            })
            .then(project => _updateProject(username, project))
            .then(response => resolve(`Project successfully synced`))
            .catch(err => reject(Response.onError(err, `Can't sync project`, 400)));


    })
}

function clone(user, repo_url, projectRoot){
    console.log('clone user: ', user);
    console.log('clone repo_url: ', repo_url);
    console.log('clone projectRoot: ', projectRoot);
    console.log('clone user.github: ', user.github);
    if(user.github) {
        return git().clone(repo_url, projectRoot)
            .then(response=> git(projectRoot).addConfig('user.email', user.github))
            .catch(e => Response.onError(e, `Can't clone from GitHub.`, 400))
    } else {
        return git().clone(repo_url, projectRoot)
            .catch(e => Response.onError(e, `Can't clone from GitHub.`, 400))        
    }
}

module.exports = {
    getToken: getToken,
    getUser: getUser,
    create: create,
    theirs: theirs,
    ours: ours,
    successSync: successSync,
    syncProjects: syncProjects,
    syncSingleProjects:syncSingleProjects,
    clone:clone
};
