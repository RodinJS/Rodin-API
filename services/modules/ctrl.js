/**
 * Created by xgharibyan on 6/27/17.
 */
const _ = require('lodash');
const babel = require("babel-core");
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const StrDecoder = require('string_decoder');
const busterSyntax = require('buster-syntax');
const fsExtra = require('fs-extra');
const CP = require('google-closure-compiler');
const fs = require('fs');
const URL = require('url');
const RDSendgrid = require('../../common/sendgrid');
const APIError = require('../../common/APIError');
const httpStatus = require('../../common/httpStatus');
const Modules = require('../../models/modules');
const ModulesAssign = require('../../models/assignedModules');
const ModulesSubscribe = require('../../models/modulesSubscribe');
const Project = require('../../models/project');
const config = require('../../config/env');
const Response = require('../../common/servicesResponses');
const HookSecretKey = 'K7rd6FzEZwzcc6dQr3cv9kz4tTTZzAc9hdXYJpukvEnxmbdB42V4b6HePs5ZDTYLW_4000dram_module';
const StringDecoder = StrDecoder.StringDecoder;
const syntax = busterSyntax.syntax;
const ClosureCompiler = CP.compiler;
const allowedHosts = ['rodin.space', 'rodin.io', 'rodin.design', 'localhost'];


function _checkDeveloperKey(token) {
    return new Promise((resolve, reject) => {
        if (!token) return resolve(null);
        jwt.verify(token, config.jwtSecret, function (err, decoded) {
            if (err) return reject(err);
            if (new Date(decoded.exp * 1000) < new Date()) return reject('Expired');
            return resolve(decoded);
        })
    })
}

function _getProjectFromModulesRequest(req) {
    return new Promise((resolve, reject) => {
        _checkDeveloperKey(req.headers['rodin-key'])
            .then(decoded => {
                const innerQuery = {};
                if (decoded) {
                    Object.assign(innerQuery, {developerKey: req.headers['rodin-key']});
                }
                else if (_.indexOf(allowedHosts, req.headers.host) < 0) {
                    if (!req.headers.referer) return resolve(null);
                    const refererPath = URL.parse(req.headers.referer).path.split('/');
                    const projectRoot = refererPath.length == 1 ?
                        refererPath[0] :
                        _.indexOf(refererPath[refererPath.length - 1], '.index.html') > -1 ?
                            refererPath[refererPath.length - 1] :
                            refererPath[refererPath.length - 2];
                    Object.assign(innerQuery, {root: projectRoot});
                }
                else {
                    Object.assign(innerQuery, {domain: req.headers.host});
                }
                return resolve(Project.get(innerQuery))
            })
            .catch(err=>{
                console.log('err', err);
                return reject(err);
            })
    })
}

function getModule(req) {
    return new Promise((resolve, reject) => {
        const moduleID = req.body.moduleId || req.query.moduleId || req.params.moduleId;
        if (_.isUndefined(moduleID)) {
            return reject(Response.onError(null, `Provide module`, 400));
        }
        getById(moduleID)
            .then(module => resolve(module))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    });
}

function getById(moduleID, req) {
    return new Promise((resolve, reject) => {
        moduleID = moduleID || req.body.moduleId || req.query.moduleId || req.params.moduleId;
        Modules.getById(moduleID)
            .then(module => resolve(module))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function list(req) {
    return new Promise((resolve, reject) => {
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        Modules.list({limit, skip}, req.query._queryString)
            .then((modules) => resolve(modules))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function create(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.title)) {
            return reject(Response.onError(null, `Provide module title`, 400));
        }

        if (_.isUndefined(req.body.description)) {
            return reject(Response.onError(null, `Provide module description`, 400));

        }

        const savingData = _.pick(req.body, ['title', 'description', 'thumbnail', 'author', 'price', 'url', 'exampleLink', 'documentationLink']);

        let module = new Modules(savingData);

        module.save()
            .then((createdModule) => resolve(createdModule))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function validateSyntax(req) {
    return new Promise((resolve, reject) => {
        if (req.files.length < 0) return reject(Response.onError(err, `No attached files`, 400));
        const file = req.files[0].buffer;
        const decoder = new StringDecoder('utf8');
        const fileContent = decoder.write(file);
        const validSyntax = syntax.configure({ignoreReferenceErrors: true}).check(fileContent);
        if (!validSyntax.ok) return reject(Response.onError(null, validSyntax.errors, 400));
        return resolve(fileContent);
    })
}

function save(req) {
    return new Promise((resolve, reject) => {
        const moduleID = req.body.moduleId || req.query.moduleId || req.params.moduleId;
        const query = {_id: moduleID};
        const update = _.omit(req.body, ['moduleId']);

        Modules.findOneAndUpdate(query, update, {new: true})
            .then(module => resolve(module))
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function sendMail(req) {
    return new Promise((resolve, reject) => {
        const moduleID = req.body.moduleId || req.query.moduleId || req.params.moduleId;
        const query = {_id: moduleID};
        const update = _.omit(req.body, ['moduleId']);
        update.submitedDate = Date.now();

        console.log('REQ BODY', req.body);
        const handlebards = req.body.status == 'Rejected' ? [{
            name: 'moduleName',
            content: req.body.module.title
        }, {
            name: 'reason',
            content: req.body.reason
        }] : [{
            name: 'moduleName',
            content: req.body.module.title
        }];
        const templateName = req.body.status == 'Rejected' ? 'rodin_reject_module' : 'rodin_approve_module';
        const subject = req.body.status == 'Rejected' ? 'Rejected' : 'Approved';

        req.mailSettings = {
            to: req.body.module.email,
            from: 'noreplay@rodin.io',
            fromName: 'Rodin team',
            templateName: templateName,
            subject: `${req.body.module.title} ${subject}`,
            handleBars: handlebards
        };
        RDSendgrid.send(req);
        resolve(`Module successfully submitted`)
    })
}

function submit(req) {
    return new Promise((resolve, reject) => {
        const module = req.module;
        const moduleGlobalDir = `${config.stuff_path}modules/client/pending/`;
        const moduleDir = `${moduleGlobalDir}${module.url}`;
        const indexFile = `${moduleDir}/client.js`;
        fsExtra.ensureDir(moduleDir)
            .then(() => fsExtra.ensureFile(indexFile))
            .then(() => {
                fs.writeFileSync(indexFile, req.fileContent);
                return resolve(true);
            })
            .catch(err => reject(Response.onError(err, `Bad request`, 400)))
    })
}

function approveReject(req) {
    return new Promise((resolve, reject) => {
        const module = req.module;
        req.body.status = req.params.statusParam;
        req.body.module = module;
        if (req.body.status == 'Rejected') {
            req.body.approvedDate = null;
            req.body.rejectedDate = Date.now();
            return resolve({rejectedDate: Date.now(), approvedDate: null})
        }

        const moduleGlobalDir = `${config.stuff_path}modules/client/pending/`;
        const moduleDir = `${moduleGlobalDir}${module.url}`;
        const indexFile = `${moduleDir}/client.js`;

        babel.transformFile(indexFile, {
            presets: ['es2015'],
            plugins: [
                //"transform-es2015-modules-systemjs",
                //"transform-class-properties"
            ]
        },  (err, result) => {

            const publicModulesDir = `${config.stuff_path}publicModules/users/`;
            const publicModuleDir = `${publicModulesDir}${module.url}`;
            const publicIndexFile = `${publicModuleDir}/client.js`;

            fsExtra.ensureDir(publicModuleDir)
                .then(() => fsExtra.ensureFile(publicIndexFile))
                .then(() => {
                    fs.writeFileSync(publicIndexFile, `(function(){ \n${result.code}\n }).call(this)`);

                    req.body.approvedDate = Date.now();
                    req.body.rejectedDate = null;
                    return resolve({rejectedDate: null, approvedDate: Date.now()})
                })
                .catch(err => reject(Response.onError(err, `Bad request`, 400)));
        });
    })

}

function validateModules(req) {
    return new Promise((resolve, reject)=>{
        let expiredModules = [];
        _getProjectFromModulesRequest(req)
            .then(project => {
                if (!project) return reject(Response.onError(null, `Unauthorized`, httpStatus.UNAUTHORIZED));
                project = project.toObject();
                return ModulesAssign.get(project._id)
            })
            .then(modules => {
                if (!modules) return reject(Response.onError(null, `Modules not assigned to current project`, httpStatus.UNAUTHORIZED));

                return Promise.all(_.map(modules, (module) => {
                    module = module.toObject();
                    return ModulesSubscribe.getByOwnerAndModuleId(module.owner, module.moduleId)
                }));
            })
            .then(modules => {

                expiredModules = _.filter(modules, (module) => new Date(module.expiredAt) <= new Date());

                const subscribed = _.filter(modules, (module) => new Date(module.expiredAt) > new Date());

                return Promise.all(_.map(subscribed, (module) => {
                    return Modules.getById(module.moduleId);
                }));

            })
            .then(modules => {

                const completeModules = _.reduce(_.concat([], expiredModules, modules), (acc, module, key) => {
                    module = module.toObject();
                    if (module.expiredAt) {
                        acc.push({error: 'Subscription expired', module: null})
                    }
                    acc.push({error: null, module: module});
                    return acc;
                }, []);

                return resolve(completeModules)
            })
            .catch(err => reject(Response.onError(err, `bad request`, httpStatus.BAD_REQUEST)))
    })
}

function auth(req) {
    return new Promise((resolve, reject) => {
        const moduleId = req.body.moduleId || req.params.moduleId || req.query.moduleId;
        if (_.isUndefined(moduleId)) return reject(Response.onError(null, `Provide module id`, httpStatus.BAD_REQUEST));

        _getProjectFromModulesRequest(req)
            .then(project => {
                if (!project) return reject(Response.onError(null, `Unauthorized`, httpStatus.UNAUTHORIZED));
                project = project.toObject();
                return ModulesAssign.findOne({projectId: project._id, moduleId: moduleId})
            })
            .then(module => {
                if (!module) return reject(Response.onError(null, `Unauthorized`, httpStatus.UNAUTHORIZED));
                return resolve('Authorized');
            })
            .catch(err => reject(Response.onError(err, `Unauthorized`, httpStatus.UNAUTHORIZED)))
    })


}

function getMyModules(req) {
    return new Promise((resolve, reject) => {
        let validModules = [];
        let expiredModules = [];
        let subscribedModulesIds = [];
        let modules = [];
        ModulesSubscribe.getByOwner(req.user.username)
            .then(subscribedModules => {

                subscribedModules = subscribedModules.map(m => m.toObject());

                validModules = _.filter(subscribedModules, (module) => (new Date() < new Date(module.expiredAt)));
                expiredModules = _.filter(subscribedModules, (module) => (new Date() > new Date(module.expiredAt)));
                subscribedModulesIds = validModules.map(m => _.pick(m, ['moduleId']).moduleId);


                //If there is expired modules delete it
                if (expiredModules.length > 0) {
                    _.each(expiredModules, (module) => {
                        ModulesSubscribe.delete(module._id);
                    })
                }
                return Modules.find({_id: {$in: subscribedModulesIds}})
            })
            .then(modulesList => {
                modules = modulesList;
                return ModulesAssign.find({
                    owner: req.user.username,
                    moduleId: {$in: subscribedModulesIds},
                })
            })
            .then(assignedModules => {
                const mappedModules = _.map(modules.map(m => m.toObject()), (module) => {
                    console.log('module', module);
                    let assigned = _.filter(assignedModules, (m) => m.toObject().moduleId.toString() === module._id.toString());
                    if (assigned.length > 0) {
                        module.projects = _.map(assigned, (assign) => {
                            req.module = module;
                            let override = {
                                projectId: assign.projectId,
                                allowedHosts: assign.allowedHosts,
                                script: generateScript(req),
                            };
                            return override;
                        });
                    }
                    let moduleInfo = _.find(validModules, (subscribedModule) => subscribedModule.moduleId.toString() === module._id.toString());
                    if (moduleInfo) {
                        module.unsubscribed = moduleInfo.unsubscribed;
                        module.expiredAt = moduleInfo.expiredAt;
                    }
                    return module;
                });
                return resolve(mappedModules);
            })
            .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))

    })
}

function generateScript(req) {
    const projectID = req.body.projectId || req.query.projectId || req.params.projectId;
    return `<script src="${config.modules.socketService.URL}/${req.module.url}?projectId=${projectID}&host=${config.modules.socketService.URL}"></script>`;
}

function checkIsSubscribed(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.moduleId)) {
            return reject(Response.onError(null, `Provide module id`, httpStatus.BAD_REQUEST))
        }

        ModulesSubscribe.getModuleByIdAndOwner(req.body.moduleId, req.user.username)
            .then(module => resolve(module))
            .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))
    })
}

function update(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.allowedHosts) || _.isEmpty(req.body.allowedHosts)) {
            return reject(Response.onError(null, `Provide allowed hosts`, httpStatus.BAD_REQUEST))
        }

        if (_.isUndefined(req.body.projectId)) {
            return reject(Response.onError(null, `Provide project id`, httpStatus.BAD_REQUEST))
        }

        const query = {owner: req.user.username, projectId: req.body.projectId, moduleId: req.module._id};
        const update = {$set: {allowedHosts: req.body.allowedHosts}};

        ModulesAssign.findOneAndUpdate(query, update, {new: true})
            .then(assignedModule => resolve(assignedModule))
            .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))
    });

}

function subscribe(req) {
    return new Promise((resolve, reject) => {
        ModulesSubscribe.findOne({moduleId: req.module._id, owner: req.user.username})
            .then(module => {

                if (module && !module.unsubscribed) {
                    return reject(Response.onError(null, `Module already subscribed`, httpStatus.BAD_REQUEST));
                }

                //user unsubscribed but not exiperd
                if (module && module.unsubscribed && (new Date() < new Date(module.expiredAt))) {
                    module.subscribedAt = new Date();
                    module.expiredAt = (new Date(module.expiredAt).getTime() + 2629746000); // month
                    module.unsubscribed = false;
                    return module.save()
                        .then(subscribedModule => resolve(subscribedModule))
                        .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))
                }

                let subscribeModule = new ModulesSubscribe({
                    moduleId: req.module._id,
                    owner: req.user.username,
                });
                return subscribeModule.saveAsync()
            })
            .then(subscribedModule => resolve(subscribedModule))
            .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))
    })
}

function unsubscribe(req) {
    return new Promise((resolve, reject) => {
        ModulesSubscribe.findOneAndUpdate({
            moduleId: req.module._id,
            owner: req.user.username,
        }, {$set: {unsubscribed: true, unsubscrbedDate: new Date()}}, {new: true})
            .then(unsubscribed => resolve(unsubscribed))
            .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))
    })
}

function assignToProject(req) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(req.body.projectId)) {
            return reject(Response.onError(null, `Provide project id`, httpStatus.BAD_REQUEST));
        }

        ModulesAssign.findOne({owner: req.user.username, projectId: req.body.projectId, moduleId: req.module._id})
            .then(assignedModule => {
                if (assignedModule) {
                    return reject(Response.onError(null, `Module already assigned`, httpStatus.BAD_REQUEST));
                }

                const assignModule = new ModulesAssign({
                    owner: req.user.username,
                    projectId: req.body.projectId,
                    moduleId: req.module._id,
                });
                assignModule.save()
                    .then(assignedModule => resolve(generateScript(req)))
                    .catch(err => reject(Response.onError(err, `Bad request`, httpStatus.BAD_REQUEST)))
            });
    })
}

function serverFile(req) {
    //console.log('sereFile', req);

    req.modules = req.body.modules || req.modules;

    let content = '';
    if (!req.modules || req.modules.length <= 0) {
        content += `console.log('No external modules detected')`;
    }
    else{
        _.each(req.modules, (moduleData, key)=>{
            if(moduleData.error){
                content += `var error = '${moduleData.error || 'Bad request'}';\n throw new Error(error);`;
            }
            const module = moduleData.module;
            const moduleOwnerDirName = module.author == 'Rodin team' ? 'rodin' : 'users';
            const moduleGlobalDir = `${__dirname}/../../publicModules/${moduleOwnerDirName}/`;
            const moduleDir = `${moduleGlobalDir}${module.url}`;
            const indexFile = `${moduleDir}/client.js`;

            content += `\n${fs.readFileSync(indexFile, 'utf8')}\n\n`;
        });
    }
    return content;
}

function serveEmptyFile(req){
    return  `console.log('No external modules detected')`;
}

module.exports = {
    list,
    create,
    getModule,
    validateSyntax,
    save,
    submit,
    approveReject,
    auth,
    sendMail,
    getMyModules,
    checkIsSubscribed,
    getById,
    update,
    subscribe,
    unsubscribe,
    assignToProject,
    serverFile,
    validateModules,
    serveEmptyFile
};
