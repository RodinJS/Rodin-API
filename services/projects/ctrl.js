/**
 * Created by xgharibyan on 6/27/17.
 */

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const request = require('request');
const urlExists = require('url-exists');
const sendgrid = require('sendgrid');
const config = require('../../config/env');
const utils = require('../../common/utils');
const User = require('../../models/user');
const Response = require('../../common/servicesResponses');
const Project = require('../../models/project');
const ProjectTemplates = require('../../models/projectTemplate');
const RDSendgrid = require('../../common/sendgrid');
const sg = sendgrid('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');


function _getStatus(project, device) {
    return new Promise((resolve, reject) => {
        if (!project.build[device].buildId) return resolve(project);

        const reqParams = {
            url: `${config[device].urls.getStatus}/${project.build[device].buildId}`,
            headers: {
                'app-id': config[device].appId,
                'app-secret': config[device].appSecret,
            },
        };

        request.get(reqParams, (err, httpResponse, body) => {
            console.log('STATUS: err', err);
            console.log('STATUS: body', body);

            const buildResponse = JSON.parse(body);


            if (err || buildResponse.error) {
                project = project.toObject();
                project.fields = {
                    error: {
                        messge: buildResponse.error.message || 'something happens'
                    }
                };
                return resolve(project);
            }

            project.build[device].built = buildResponse.data.buildStatus;
            const projectDuplicate = _.clone(project.toObject());
            projectDuplicate.fields = buildResponse.data.project;
            return project.save()
                .then(project => resolve(projectDuplicate))
                .catch(err => reject({error: `Can't save`, code: 400}));
        })
    })
}

function _saveProject(project, req) {
    return new Promise((resolve, reject) => {
        project.saveAsync()
            .then((savedProject) => resolve(savedProject))
            .catch(err => reject(Response.onError(err, `Can't save project!`, 353)))
    })

}

function _validateGithubUrl(project, req) {
    return new Promise((resolve, reject) => {
        urlExists(utils.cleanUrl(req.body.githubUrl), (err, exists) => {
            console.log("GitHub repo exists: ", exists);
            if (err || !exists) return reject(Response.onError(err, `GitHub project does not exist!`, 353));
            Object.assign(project, {githubUrl: utils.cleanUrl(req.body.githubUrl)});
            return resolve(project);
        });
    })
}

function _initTemplate(project, req, rootDir) {
    ProjectTemplates.getOne(req.body.templateId)
        .then((templateProject) => {
            if (!templateProject) {
                fs.appendFileSync(`${rootDir}/error.log`, 'Template not exists' + '\n');
            }
            templateProject = templateProject.toObject();
            const templateDir = `resources/templates/${templateProject.root}`;

            if (!fs.existsSync(templateDir)) {
                fs.appendFileSync(`${rootDir}/error.log`, 'Template not exists' + '\n');
            }
            fsExtra.copy(templateDir, rootDir, function (err) {
                if (err) {
                    fs.appendFileSync(`${rootDir}/error.log`, err + '\n');
                }
                const query = {id: project._id, owner: req.user.username};
                const update = {
                    $set: {
                        updatedAt: new Date(),
                        templateOf: templateProject.name
                    }
                };
                Project.updateAsync(query, update)
                    .then(projectUpdated => resolve(true))
                    .catch(err => {
                        fs.appendFileSync(`${rootDir}/error.log`, err + '\n');
                    });

            });
        })
        .catch(err => {
            fs.appendFileSync(`${rootDir}/error.log`, err + '\n');
        });
}

function _updateUser(req, savedProject) {
    return new Promise((resolve, reject) => {
        const query = {username: req.user.username};
        const update = {
            $push: {
                "projects": savedProject._id
            }
        };
        User.updateAsync(query, update)
            .then(updatedUser => resolve(savedProject.outcome()))
            .catch((e) => reject(Response.onError(e, `Can't update user`, 400)));
    })
}

function create(req) {
    return new Promise((resolve, reject) => {
        if (req.projectsCount.total >= req.user.allowProjectsCount) {
            return reject(Response.onError(null, `Maximum projects count exceeded, allowed project count ${req.user.allowProjectsCount}`, 400))
        }

        Project.getByName(req.body.name, req.user.username)
            .then(projectExist => {
                if (projectExist) {
                    return reject(Response.onError(null, `Project url already exists`, 309))
                }
                const project = new Project({
                    name: req.body.name,
                    tags: req.body.tags,
                    root: req.body.name,
                    owner: req.user.username,
                    displayName: req.body.displayName,
                    description: req.body.description,
                    isNew: true
                });

                if (req.body.githubUrl) {
                    return _validateGithubUrl(project, req);
                }
                return project;
            })
            .then(project => _saveProject(project, req))
            .then(savedProject => {
                const project = savedProject.toObject();
                const rootDir = `${config.stuff_path}projects/${req.user.username}/${project.root}`;
                const historyDir = `${config.stuff_path}history/${req.user.username}/${project.root}`;

                if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir); //creating root dir for project

                if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir); //creating root dir for project

                if (req.body.templateId) {
                    _initTemplate(project, req, rootDir)
                }

                //TODO: Implement later git clone during create

                /* if (req.body.githubUrl) { // RO-243 #create project from git repo
                 git.clone(req.user.username, help.cleanUrl(req.body.githubUrl), rootDir)
                 .catch(e => {
                 const err = new APIError('GitHub project does not exist!', httpStatus.REPO_DOES_NOT_EXIST, true);
                 return next(err);
                 });
                 }*/
                return _updateUser(req, savedProject)
            })
            .then(project => resolve(project))
            .catch(err => reject(Response.onError(err, `Can't create project`, 400)))

    })
}

function list(req) {
    return new Promise((resolve, reject) => {
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        let projects = '';
        Project.list({limit, skip}, req.user.username, req.query._queryString)
            .then((response) => {
                projects = response;
                return Project.projectsCount(req.user.username, false, false, false);
            })
            .then(count => resolve({projects: projects, count: count}))
            .catch((e) => reject(Response.onError(e, `Can't get project`, 400)));

    })
}

function allProjectsCount(req) {
    return new Promise((resolve, reject) => {
        let userProjectsCount = null;
        let featuredCount = 0;
        let demosCount = 0;

        if (req.tokenValid) {
            Project.projectsCount(req.tokenValid.username, false, false, false)
                .then(projectsCount => userProjectsCount = projectsCount || 0)
        }
        Project.projectsCount(false, true, true, 'featured')
            .then(featuredProjectsCount => {
                featuredCount = featuredProjectsCount;
                return Project.projectsCount(false, true, true, 'demos');
            })
            .then(demosProjectsCount => {
                demosCount = demosProjectsCount;
                resolve({userProjects: userProjectsCount, featuredProjects: featuredCount, demoProjects: demosCount})
            })
            .catch((e) => reject(Response.onError(e, `Can't get count`, 400)));

    })

}

function get(req) {
    return new Promise((resolve, reject) => {
        Project.getOne(req.params.id, req.user.username)
            .then((project) => {
                if (!project) return reject(reject(Response.onError(null, `Project is empty`, 404)));

                if (req.query.device) {

                    return _getStatus(project, req.query.device)
                        .then(project => resolve(project))
                        .catch(err => reject(Response.onError(err, err.error, err.code)));
                }

                return resolve(project.toObject());
            })
            .catch((e) => reject(Response.onError(e, `Project not found`, 404)));
    })
}

function update(req) {
    return new Promise((resolve, reject) => {
        req.body.updatedAt = new Date();
        req.body.state = 'pending';
        Project.findOneAndUpdate({_id: req.params.id, owner: req.user.username}, {$set: req.body}, {new: true})
            .then(project => resolve(project))
            .catch((e) => reject(Response.onError(e, `Can't update project`, 400)));
    })
}

function remove(req) {
    return new Promise((resolve, reject) => {
        const id = req.params.id;
        const username = req.user.username;
        User.getPermission(username, id)
            .then(user => {
                if (!user) return reject(Response.onError(null, `User has no permission to modify this project!`, 310));
                return Project.removeAsync({_id: id})
            })
            .then((deletedProject) => {
                if (deletedProject.result.ok === 1) {

                    const rootDir = config.stuff_path + 'projects/' + req.user.username + '/' + req.project.root;
                    const publishDir = config.stuff_path + 'public/' + req.user.username + '/' + req.project.root;
                    const publicDir = config.stuff_path + 'publish/' + req.user.username + '/' + req.project.root;
                    const historyDir = config.stuff_path + 'history/' + req.user.username + '/' + req.project.root;

                    if (fs.existsSync(rootDir)) {
                        utils.deleteFolderRecursive(rootDir);
                    }

                    if (fs.existsSync(publishDir)) {
                        utils.deleteFolderRecursive(publishDir);
                    }

                    if (fs.existsSync(publicDir)) {
                        utils.deleteFolderRecursive(publicDir);
                    }

                    if (fs.existsSync(historyDir)) {
                        utils.deleteFolderRecursive(historyDir);
                    }

                    return User.updateAsync({username: username}, {$pull: {projects: id}})
                        .then(updatedUser => resolve(`Project Successfully deleted!`))

                }
                return reject(Response.onError(null, `Something went wrong`, 312));

            })
            .catch((e) => reject(Response.onError(e, `Can't remove project`, 400)));
    })
}

function rollBack(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.date))
            return reject(Response.onError(null, `Select version date`, 400));


        const publishFolder = utils.generateFilePath(req, '', 'publish');
        const historyFolder = help.generateFilePath(req, '', 'history');
        const projectBackupFolder = `${historyFolder}/${req.body.date}`;

        if (!fs.existsSync(projectBackupFolder))
            return reject(Response.onError(null, `Project version not exist`, 400));

        if (fs.existsSync(publishFolder)) {
            fsExtra.removeSync(publishFolder);
        }

        fsExtra.copy(projectBackupFolder, publishFolder, (err) => {
            if (err)
                return reject(Response.onError(err, `Publishing error`, 400));

            Project.findOneAndUpdate({
                _id: req.params.id,
                owner: req.user.username
            }, {$set: {activePublishDate: req.body.date}}, {new: true})
                .then(project => resolve({}))
                .catch((e) => reject(Response.onError(e, `Can't rollback project`, 400)));
        });
    })
}

function getPublishedHistory(req) {
    const historyFolder = utils.generateFilePath(req, '', 'history');
    const backUps = _.sortBy(fs.readdirSync(historyFolder).filter((file) => {
        return fs.statSync(path.join(historyFolder, file)).isDirectory();
    }), (date) => {
        return -parseInt(date);
    });
    return backUps;
}

function publishProject(req) {
    return new Promise((resolve, reject) => {
        const projectFolder = utils.generateFilePath(req, '');
        const publishFolder = utils.generateFilePath(req, '', 'publish');
        if (!fs.existsSync(projectFolder)) {
            return reject(Response.onError(null, `Project not found`, 404))
        }
        if (fs.existsSync(publishFolder)) {
            fsExtra.removeSync(publishFolder)
        }

        fsExtra.copy(projectFolder, publishFolder, function (err) {
            if (err) return reject(Response.onError(null, `Publishing error`, 404));


            //Todo implement published public mechanizm
            let publishedPublic = req.body.publishedPublic || true;

            Project.findOneAndUpdate({_id: req.params.id, owner: req.user.username}, {
                $set: {
                    publishDate: new Date(),
                    publishedPublic: publishedPublic,
                    state: 'pending',
                }
            }, {new: true})
                .then(project => {
                    if (!project) return reject(Response.onError(null, `Can't update info`, 400));
                    req.mailSettings = {
                        to: req.user.email,
                        from: 'team@rodin.io',
                        fromName: 'Rodin team',
                        templateName: 'rodin_publish',
                        subject: `${req.project.displayName} published`,
                        handleBars: [{
                            name: 'userName',
                            content: req.user.username
                        }, {
                            name: 'publishUrl',
                            content: `${config.clientURL}/${req.user.username}/${req.project.name}`
                        }]
                    };
                    RDSendgrid.send(req);
                    return resolve(project)
                })
                .catch((e) => reject(Response.onError(e, `Can't publish project`, 400)));

        });
    })
}

function rePublishProject(req) {
    return new Promise((resolve, reject) => {
        const projectFolder = utils.generateFilePath(req, '');
        const publishFolder = utils.generateFilePath(req, '', 'publish');
        const historyFolder = utils.generateFilePath(req, '', 'history');
        const projectBackupFolder = `${historyFolder}/${Date.now()}`;

        let backUps = fs.readdirSync(historyFolder).filter((file) => fs.statSync(path.join(historyFolder, file)).isDirectory());

        if (backUps.length == 3) {
            let oldestBackup = _.min(backUps);
            utils.deleteFolderRecursive(`${historyFolder}/${oldestBackup}`);
        }

        fsExtra.copy(publishFolder, projectBackupFolder, (err) => {
            if (err) return reject(Response.onError(err, `Publishing error`, 400));

            if (fs.existsSync(publishFolder)) {
                fsExtra.removeSync(publishFolder);
            }

            fsExtra.copy(projectFolder, publishFolder, (err) => {
                if (err) return reject(Response.onError(err, `Publishing error`, 400));
                Project.findOneAndUpdate({_id: req.params.id, owner: req.user.username}, {
                    $set: {
                        state: 'pending',
                        activePublishDate: new Date()
                    }
                }, {new: true})
                    .then(project => resolve(`Project successfully re published`))
                    .catch(err => reject(Response.onError(err, `Can't update project`, 400)));
            });
        });
    })
}

function unPublishProject(req) {
    return new Promise((resolve, reject) => {
        const publishFolder = utils.generateFilePath(req, '', 'publish');
        const historyFolder = utils.generateFilePath(req, '', 'history');

        if (!fs.existsSync(publishFolder))  return reject(Response.onError(null, `Project not found`, 404))


        fsExtra.removeSync(publishFolder);
        fsExtra.emptyDirSync(historyFolder);
        Project.findOneAndUpdate({_id: req.params.id, owner: req.user.username}, {
            $unset: {
                publishDate: 1,
                publishedPublic: 1
            }
        }, {new: true})
            .then(project => {
                if (!project) return reject(Response.onError(null, `Can't update info`, 400));
                return resolve(project)
            })
            .catch((e) => reject(Response.onError(e, `Can't unpublish project`, 400)));

    })
}

function getPublishedProjects(req) {
    return new Promise((resolve, reject) => {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || false;
        const type = req.query.type || 'featured';
        const allowedFields = ['name', 'owner', 'id', 'thumbnail', 'description', 'root', 'displayName', 'type'];


        let Projects = {};
        Project.list({skip: skip, limit: limit}, false, false, true, true, sort, type)
            .then(publishedProject => {
                Projects = _.map(publishedProject, (project) => _.pick(project, allowedFields));
                return Project.projectsCount(false, true, true, type);
            })
            .then(projectsCount => resolve({
                projects: Projects,
                count: projectsCount
            }))
            .catch((e) => reject(Response.onError(e, `Can't get published projects`, 400)));

    })
}

function getPublishedProject(req) {
    return new Promise((resolve, reject) => {
        if (!req.params.id) reject(Response.onError(null, `Provide project id`, 400));
        const query = {
            _id: req.params.id,
            $and: [
                {publishDate: {$exists: true}},
                {publishedPublic: {$eq: true}},
            ]
        };
        Project.get(query)
            .then(publishedProject => resolve(_.pick(publishedProject, ['name', 'owner', 'id', 'thumbnail', 'description', 'root', 'displayName'])))
            .catch((e) => reject(Response.onError(e, `Can't get published project`, 400)));
    })
}

function importOnce(req) {
    return new Promise((resolve, reject) => {
        const projects = utils.getDefTemplatesObject();
        ProjectTemplates.insert(projects, (response) => {
            if (!response.success) reject(Response.onError(null, `Importing error`, 400));
            return resolve(`Templates imported`)
        });
    })
}

function getTemplatesList(req) {
    return new Promise((resolve, reject) => {
        const {limit = 50, skip = 0} = req.query;
        ProjectTemplates.list({limit, skip})
            .then((projects) => resolve(projects))
            .catch((e) => reject(Response.onError(e, `Can't get templates`, 400)));
    })
}

function transpile(req) {
    return new Promise((resolve, reject) => {
        // transpiler.projectTranspile(req);
        return resolve(`${req.project.name} build start`);
    })
}

module.exports = {
    create: create,
    list: list,
    allProjectsCount: allProjectsCount,
    get: get,
    update: update,
    remove: remove,
    rollBack: rollBack,
    getPublishedHistory: getPublishedHistory,
    publishProject: publishProject,
    rePublishProject: rePublishProject,
    unPublishProject: unPublishProject,
    getPublishedProjects: getPublishedProjects,
    getPublishedProject: getPublishedProject,
    importOnce: importOnce,
    getTemplatesList: getTemplatesList,
    transpile: transpile
};
