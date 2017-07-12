/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const projectRequester = require('../requesters/project');

const router = express.Router();


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

router.route('/:id/build/transpile')
   .get(projectRequester.transpile);


module.exports = router;