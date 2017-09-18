/**
 * Created by xgharibyan on 6/27/17.
 */

const fs = require('fs');
const path = require('path');
const request = require('request');
const sendgrid = require('sendgrid');
const config = require('../../config/env');
const utils = require('../../common/utils');
const Response = require('../../common/servicesResponses');


function _initializeData(req) {
    const project = JSON.parse(req.body.project);
    project.appId = req.project._id;
    project.userId = req.user.username;
    project.version = req.body.version;
    project.url = `${config.clientURL}/${req.user.username}/${req.project.name}/`;
    return project;
}

function _saveInProject(req, body, device, remove) {
    return new Promise((resolve, reject) => {
        if (!req.project) {
            req.project = {};
            req.project[device] = {
                requested: false,
                built: false,
                version: req.body.version,
            };
        }

        req.project.build[device].requested = !remove;
        req.project.build[device].built = false;
        req.project.build[device].version = req.body.version;
        req.project.build[device].buildId = JSON.parse(body).data.buildId;
        req.project.saveAsync()
            .then(project => resolve(project))
            .catch(err => reject(Response.onError(err, `Can't save in project`, 400)))
    })
}

function _submit(data, device, method = 'POST') {
    return new Promise((resolve, reject) => {
        request({
            method: method,
            url: config[device].urls.build,
            headers: {
                'app-id': config[device].appId,
                'app-secret': config[device].appSecret,
            },
            formData: data,
        }, (err, httpResponse, body) => {
            if (err || httpResponse.statusCode !== 200) {
                if(method == 'DELETE'){
                    console.log('DEL ERROR', err, httpResponse.statusCode, body);
                }
                return reject(Response.onError(err || httpResponse.statsuCode, `something went wrong, try again later`, 400))
            }
            return resolve(body)
        });
    })
}

function buildVive(req) {
    return new Promise((resolve, reject) => {
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'vive', 'POST')
            .then(body => _saveInProject(req, body, 'vive'))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't build vive`, 400)))
    })
}

function removeVive(req) {
    return new Promise((resolve, reject) => {
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'vive', 'DELETE')
            .then(body => _saveInProject(req, body, 'vive', true))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't delete vive build`, 400)))
    })
}

function buildAndroid(req) {
    return new Promise((resolve, reject) => {
        for (let file of ['icon-h']) {
            if (!req.files[file] || !req.files[file][0]) {
                return reject(Response.onError(err, `${file} file was not provided`, 400))
            }
        }
        const project = _initializeData(req);
        _submit({
            project: JSON.stringify(project),
            'icon-h': fs.createReadStream(req.files['icon-h'][0].path)
        }, 'android', 'POST')
            .then(body => _saveInProject(req, body, 'android'))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't build android`, 400)))
    })
}

function removeAndroid(req) {
    return new Promise((resolve, reject) => {
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'android', 'DELETE')
            .then(body => _saveInProject(req, body, 'android', true))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't delete android build`, 400)))
    })
}

function buildIos(req) {
    return new Promise((resolve, reject) => {
        for (let file of ['cert', 'profile', 'icon-h']) {
            if (!req.files[file] || !req.files[file][0]) {
                return reject(Response.onError(err, `${file} file was not provided`, 400))
            }
        }
        const project = _initializeData(req);
        _submit({
            project: JSON.stringify(project),
            cert: fs.createReadStream(req.files['cert'][0].path),
            profile: fs.createReadStream(req.files['profile'][0].path),
            'icon-h': fs.createReadStream(req.files['icon-h'][0].path),
        }, 'ios', 'POST')
            .then(body => _saveInProject(req, body, 'ios'))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't build iOS`, 400)))
    })
}

function removeIos(req) {
    return new Promise((resolve, reject) => {
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'ios', 'DELETE')
            .then(body => _saveInProject(req, body, 'ios', true))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't delete android build`, 400)))
    })
}

function buildOculus(req) {
    return new Promise((resolve, reject) => {
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'oculus', 'POST')
            .then(body => _saveInProject(req, body, 'oculus'))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't build oculus`, 400)))
    })
}

function removeOculus(req) {
    return new Promise((resolve, reject) => {
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'oculus', 'DELETE')
            .then(body => _saveInProject(req, body, 'oculus', true))
            .then(response => resolve({requested: true}))
            .catch(err => reject(Response.onError(err, `Can't delete oculus build`, 400)))
    })
}

function download(req){
    return new Promise((resolve, reject)=>{
        const device = req.params.device;
        request.get({
                url: `${config[device].urls.get}/${req.project.build[device].buildId}`,
                headers: {
                    'app-id': config[device].appId,
                    'app-secret': config[device].appSecret,
                },
            },
            (err, httpResponse, body) => {
                if (err || httpResponse.statusCode !== 200) {
                    return reject(Response.onError(err ||  httpResponse.statusCode, `Internal Server Error`, 500))
                }

                return resolve({
                    downloadUrl: `${config[device].urls.download}/${JSON.parse(body).data.downloadUrl}`,
                })
            }
        );
    })
}

module.exports = {
    buildVive: buildVive,
    removeVive: removeVive,
    buildAndroid: buildAndroid,
    removeAndroid:removeAndroid,
    buildIos:buildIos,
    removeIos:removeIos,
    buildOculus:buildOculus,
    removeOculus:removeOculus,
    download:download
};
