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
    .get(modulesRequester.socketServerFile);

router.route('/subscribe')
    .post(modulesRequester.socketServerSubscribe);


module.exports = router;