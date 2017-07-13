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


function _initializeData(req){
    const project = JSON.parse(req.body.project);
    project.appId = req.project._id;
    project.userId = req.user.username;
    project.version = req.body.version;
    project.url = `${config.clientURL}/${req.user.username}/${req.project.name}/`;
    return project;
}

function _saveInProject(req, body, device, remove){
    return new Promise((resolve, reject)=>{
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
            .then(project=> resolve(project))
            .catch(err=>reject(Response.onError(err, `Can't save in project`, 400)))
    })
}

function _submit(data, device, method = 'POST'){
    return new Promise((resolve, reject)=>{
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
                return reject(Response.onError(err || httpResponse.statsuCode, `something went wrong, try again later`, 400))
            }
            return resolve(body)
        });
    })
}

function buildVive(req){
    return new Promise((resolve, reject)=>{
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'vive', 'POST')
            .then(body=> _saveInProject(req, body, 'vive'))
            .then(response => resolve({requested:true}))
            .catch(err=> reject(Response.onError(err, `Can't build vive`, 400)))
    })
}

function removeVive(req){
    return new Promise((resolve, reject)=>{
        const project = _initializeData(req);
        _submit({project: JSON.stringify(project)}, 'vive', 'DELETE')
            .then(body=> _saveInProject(req, body, 'vive', true))
            .then(response => resolve({requested:true}))
            .catch(err=> reject(Response.onError(err, `Can't delete vive build`, 400)))
    })
}

module.exports = {
    buildVive:buildVive,
    removeVive:removeVive
};
