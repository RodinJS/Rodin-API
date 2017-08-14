/**
 * Created by xgharibyan on 8/9/17.
 */

const express = require('express');
const validate = require('express-validation');
const multer = require('multer');
const router = express.Router();
const upload = multer();

const paramValidation = require('../configs/paramValidation');
const modulesRequester = require('../requesters/modules');



router.route('/')
    .get(modulesRequester.list)
    .post(modulesRequester.create);


router.route('/mine')
    .get(modulesRequester.getMyModules)
    .put(modulesRequester.update);

router.route('/subscribe')
    .post(modulesRequester.subscribe)
    .delete(modulesRequester.unsubscribe);

router.route('/assign')
    .post(modulesRequester.assignToProject);

//router.route('/:moduleId')
  //  .get(check.ifTokenValid, check.isGod, modulesCtrl.getById);


router.route('/submit')
    .post(upload.array('file'), modulesRequester.submit);

router.route('/check')
    .get(modulesRequester.check);

router.route('/status/:statusParam')
    .post(modulesRequester.approveReject);


router.route('/socket-server')
    .get(modulesRequester.socketServerFile);


module.exports = router;