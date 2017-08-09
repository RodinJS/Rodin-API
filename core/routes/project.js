/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const multer = require('multer');
const paramValidation = require('../configs/paramValidation');
const projectRequester = require('../requesters/project');
const buildRequester = require('../requesters/build');
const path = require('path');
//const buildRouter = require('./build');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../resources/uploads/'));
    },

    filename: function (req, file, cb) {
        let nameArray = file.originalname.split('.');
        nameArray.splice(-1, 0, Date.now());
        let newName = nameArray.join('.');
        cb(null, newName);
    },
});

const router = express.Router();
const upload = multer({ storage: storage }).fields([
    {
        name: 'icon-m',
        maxCount: 1,
    },
    {
        name: 'icon-h',
        maxCount: 1,
    },
    {
        name: 'icon-xh',
        maxCount: 1,
    },
    {
        name: 'icon-xxh',
        maxCount: 1,
    },
    {
        name: 'icon-xxxh',
        maxCount: 1,
    },
    {
        name: 'cert',
        maxCount: 1,
    },
    {
        name: 'profile',
        maxCount: 1,
    },
]);

router.route('/')
    .get(projectRequester.list)
    .post(validate(paramValidation.createProject), projectRequester.create);

router.route('/count')
    .get(projectRequester.count);

router.route('/:id')
    .get(projectRequester.get)
    .put(validate(paramValidation.updateProject), projectRequester.update)
    .delete(projectRequester.remove);

router.route('/publish/rollback/:id')
    .post(projectRequester.publishRollBack);

router.route('/publish/:id')
    .get(projectRequester.getPublishedHistory)
    .post(projectRequester.publishProject)
    .put(projectRequester.rePublishProject)
    .delete(projectRequester.unPublishProject);

router.route('/published/list')
    .get(projectRequester.getPublishedProjects);

router.route('/published/:id')
    .get(projectRequester.getPublishedProject);

router.route('/templates/importOnce')
    .get(projectRequester.importOnce);

router.route('/templates/list')
    .get(projectRequester.getTemplatesList);

router.route('/:id/build/vive')
    .post(upload, buildRequester.buildVive)
    .delete(upload, buildRequester.removeVive);

router.route('/:id/build/android')
    .post(upload, buildRequester.buildAndroid)
    .delete(upload, buildRequester.removeAndroid);

router.route('/:id/build/ios')
    .post(upload, buildRequester.buildIos)
    .delete(upload, buildRequester.removeIos);

router.route('/:id/build/oculus')
    .post(upload, buildRequester.buildOculus)
    .delete(upload, buildRequester.removeOculus);

router.route('/:id/download/:device')
    .get(buildRequester.download);

router.route('/pp/:id')
    .post(projectRequester.makePublic);




module.exports = router;