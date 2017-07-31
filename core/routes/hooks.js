/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const hooksRequester = require('../requesters/hooks');

const socketServerRequester = require('../requesters/socketServer');

const router = express.Router();

router.route('/')
    .post(socketServerRequester.hook);

router.route('/build/:id/:device')
    .post(hooksRequester.build);


module.exports = router;