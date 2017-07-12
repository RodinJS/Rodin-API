/**
 * Created by xgharibyan on 6/27/17.
 */

const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../configs/paramValidation');

const authRequester = require('../requesters/auth');

const router = express.Router();


router.route('/login')
    .post(validate(paramValidation.login), authRequester.login);

router.route('/social/:socialName')
    .post(authRequester.socialAuth);

module.exports = router;